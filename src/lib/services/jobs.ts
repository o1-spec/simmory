import { db } from "../db";
import { Prisma } from "../../generated/prisma/client";
import { getVideoValidationQueue, VideoValidationJobPayload } from "../queue";
import { canEditVideo, getVideoWithAccess } from "../auth/permissions";

/**
 * Creates or retrieves a pending validation job transactionally.
 * Guarantees that at most one active validation job exists per video.
 */
export async function createOrGetPendingValidationJob(
  tx: Prisma.TransactionClient,
  params: {
    videoId: string;
    kitchenId: string;
    expectedSize: number;
  }
) {
  // Check for any currently active job for this video
  const existingActiveJob = await tx.processingJob.findFirst({
    where: {
      videoId: params.videoId,
      jobType: "VIDEO_VALIDATION",
      status: {
        in: ["PENDING_DISPATCH", "QUEUED", "PROCESSING"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActiveJob) {
    return existingActiveJob;
  }

  // Create new pending job in outbox
  const job = await tx.processingJob.create({
    data: {
      videoId: params.videoId,
      kitchenId: params.kitchenId,
      jobType: "VIDEO_VALIDATION",
      status: "PENDING_DISPATCH",
      stage: "WAITING_FOR_DISPATCH",
      maxAttempts: 3,
    },
  });

  // Transition video validation status to QUEUED
  await tx.cookingVideo.update({
    where: { id: params.videoId },
    data: {
      validationStatus: "QUEUED",
      validationError: null,
    },
  });

  return job;
}

export interface DispatchResult {
  dispatched: number;
  failed: number;
  errors: string[];
}

/**
 * Reads PENDING_DISPATCH jobs and dispatches them to BullMQ using deterministic job IDs.
 * Does not hold a database transaction open while communicating over network to Redis.
 */
export async function dispatchPendingValidationJobs(
  batchSize = 20
): Promise<DispatchResult> {
  const result: DispatchResult = { dispatched: 0, failed: 0, errors: [] };

  try {
    // 1. Fetch pending dispatch jobs
    const pendingJobs = await db.processingJob.findMany({
      where: {
        status: "PENDING_DISPATCH",
        jobType: "VIDEO_VALIDATION",
      },
      include: {
        video: {
          select: {
            id: true,
            storageKey: true,
            expectedSize: true,
            uploadStatus: true,
          },
        },
      },
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (pendingJobs.length === 0) {
      return result;
    }

    const queue = getVideoValidationQueue();

    for (const job of pendingJobs) {
      try {
        if (!job.video || job.video.uploadStatus !== "UPLOADED") {
          // If video was deleted or not uploaded, fail the job
          await db.processingJob.update({
            where: { id: job.id },
            data: {
              status: "CANCELLED",
              stage: "CANCELLED",
              errorMessage: "Video was not marked uploaded or was deleted prior to dispatch.",
            },
          });
          continue;
        }

        const deterministicJobId = `video-val-${job.id}`;
        const payload: VideoValidationJobPayload = {
          jobId: job.id,
          videoId: job.videoId,
          kitchenId: job.kitchenId,
          storageKey: job.video.storageKey,
          expectedSize: job.video.expectedSize,
        };

        // 2. Publish to BullMQ with deterministic ID (prevent duplicates)
        await queue.add("validate-video", payload, {
          jobId: deterministicJobId,
        });

        // 3. Atomically transition to QUEUED only if still PENDING_DISPATCH
        const updateCount = await db.processingJob.updateMany({
          where: {
            id: job.id,
            status: "PENDING_DISPATCH",
          },
          data: {
            status: "QUEUED",
            stage: "QUEUED",
            queuedAt: new Date(),
            bullMqJobId: deterministicJobId,
          },
        });

        if (updateCount.count > 0) {
          result.dispatched += 1;
        }
      } catch (jobError: unknown) {
        result.failed += 1;
        const msg = jobError instanceof Error ? jobError.message : String(jobError);
        result.errors.push(`Job ${job.id}: ${msg}`);
        console.warn(`[Dispatcher] Failed to dispatch job ${job.id}:`, msg);
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Dispatcher error: ${msg}`);
    console.warn("[Dispatcher] Dispatch batch failed:", msg);
  }

  return result;
}

/**
 * Retrieves the full processing & validation status for a video.
 * Enforces kitchen access (OWNER, EDITOR, VIEWER).
 */
export async function getVideoProcessingStatus(userId: string, videoId: string) {
  const result = await getVideoWithAccess(videoId, userId);
  if (!result) {
    return null;
  }

  const { video } = result;

  const latestJob = await db.processingJob.findFirst({
    where: {
      videoId,
      jobType: "VIDEO_VALIDATION",
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    video: {
      id: video.id,
      kitchenId: video.kitchenId,
      originalFilename: video.originalFilename,
      uploadStatus: video.uploadStatus,
      validationStatus: video.validationStatus,
      processingStatus: video.processingStatus,
      duration: video.duration,
      videoCodec: video.videoCodec,
      audioCodec: video.audioCodec,
      width: video.width,
      height: video.height,
      fps: video.fps,
      validationError: video.validationError,
      completedAt: video.completedAt,
    },
    latestJob: latestJob
      ? {
          id: latestJob.id,
          status: latestJob.status,
          stage: latestJob.stage,
          attempts: latestJob.attempts,
          maxAttempts: latestJob.maxAttempts,
          errorCode: latestJob.errorCode,
          errorMessage: latestJob.errorMessage,
          progressInfo: latestJob.progressInfo,
          queuedAt: latestJob.queuedAt,
          startedAt: latestJob.startedAt,
          completedAt: latestJob.completedAt,
          createdAt: latestJob.createdAt,
          updatedAt: latestJob.updatedAt,
        }
      : null,
  };
}

/**
 * Allows an authorized OWNER or EDITOR to trigger or retry validation.
 */
export async function triggerVideoValidation(userId: string, videoId: string) {
  const result = await canEditVideo(videoId, userId);
  if (!result) {
    throw new Error("VIDEO_NOT_FOUND_OR_FORBIDDEN");
  }

  const { video } = result;
  if (video.uploadStatus !== "UPLOADED") {
    throw new Error("VIDEO_NOT_UPLOADED");
  }

  // Check if there is already an active job
  const activeJob = await db.processingJob.findFirst({
    where: {
      videoId,
      jobType: "VIDEO_VALIDATION",
      status: { in: ["PENDING_DISPATCH", "QUEUED", "PROCESSING"] },
    },
  });

  if (activeJob) {
    // Already running or queued
    return activeJob;
  }

  // Create new validation job in transaction
  const newJob = await db.$transaction(async (tx) => {
    return createOrGetPendingValidationJob(tx, {
      videoId: video.id,
      kitchenId: video.kitchenId,
      expectedSize: video.expectedSize,
    });
  });

  // Attempt immediate outbox dispatch (non-blocking)
  dispatchPendingValidationJobs(5).catch((err) => {
    console.warn("[triggerVideoValidation] Background dispatch trigger:", err.message);
  });

  return newJob;
}

/**
 * Returns genuine database-derived video validation metrics across user's accessible kitchens.
 */
export async function getVideoValidationStats(userId: string) {
  const memberships = await db.kitchenMember.findMany({
    where: { userId },
    select: { kitchenId: true },
  });
  const kitchenIds = memberships.map((m) => m.kitchenId);

  if (kitchenIds.length === 0) {
    return {
      uploaded: 0,
      awaitingValidation: 0,
      validated: 0,
      failedValidation: 0,
    };
  }

  const [uploaded, awaitingValidation, validated, failedValidation] = await Promise.all([
    db.cookingVideo.count({
      where: { kitchenId: { in: kitchenIds }, uploadStatus: "UPLOADED" },
    }),
    db.cookingVideo.count({
      where: {
        kitchenId: { in: kitchenIds },
        uploadStatus: "UPLOADED",
        validationStatus: { in: ["NOT_STARTED", "QUEUED", "VALIDATING"] },
      },
    }),
    db.cookingVideo.count({
      where: { kitchenId: { in: kitchenIds }, validationStatus: "VALIDATED" },
    }),
    db.cookingVideo.count({
      where: { kitchenId: { in: kitchenIds }, validationStatus: "FAILED" },
    }),
  ]);

  return {
    uploaded,
    awaitingValidation,
    validated,
    failedValidation,
  };
}

