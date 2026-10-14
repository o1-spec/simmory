import { db } from "../db";
import { Prisma } from "../../generated/prisma/client";
import {
  getVideoValidationQueue,
  getAiAnalysisQueue,
  VideoValidationJobPayload,
  AiAnalysisJobPayload,
} from "../queue";
import { canEditVideo, getVideoWithAccess } from "../auth/permissions";
import { logger } from "../logger";

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

/**
 * Creates or retrieves a pending AI analysis job transactionally.
 * Guarantees that at most one active AI analysis job exists per video.
 */
export async function createOrGetPendingAiAnalysisJob(
  tx: Prisma.TransactionClient,
  params: {
    videoId: string;
    kitchenId: string;
  }
) {
  // Check for any currently active AI analysis job for this video
  const existingActiveJob = await tx.processingJob.findFirst({
    where: {
      videoId: params.videoId,
      jobType: "AI_ANALYSIS",
      status: {
        in: ["PENDING_DISPATCH", "QUEUED", "PROCESSING"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActiveJob) {
    return existingActiveJob;
  }

  // Create new pending AI job in outbox
  const job = await tx.processingJob.create({
    data: {
      videoId: params.videoId,
      kitchenId: params.kitchenId,
      jobType: "AI_ANALYSIS",
      status: "PENDING_DISPATCH",
      stage: "WAITING_FOR_DISPATCH",
      maxAttempts: 3,
    },
  });

  // Transition video processing status to QUEUED
  await tx.cookingVideo.update({
    where: { id: params.videoId },
    data: {
      processingStatus: "QUEUED",
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
        logger.warn(`[Dispatcher] Failed to dispatch job ${job.id}`, { error: msg });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Dispatcher error: ${msg}`);
    logger.warn("[Dispatcher] Dispatch batch failed", { error: msg });
  }

  return result;
}

/**
 * Reads PENDING_DISPATCH AI analysis jobs and dispatches them to BullMQ.
 */
export async function dispatchPendingAiAnalysisJobs(
  batchSize = 20
): Promise<DispatchResult> {
  const result: DispatchResult = { dispatched: 0, failed: 0, errors: [] };

  try {
    const pendingJobs = await db.processingJob.findMany({
      where: {
        status: "PENDING_DISPATCH",
        jobType: "AI_ANALYSIS",
      },
      include: {
        video: {
          select: {
            id: true,
            storageKey: true,
            validationStatus: true,
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

    const queue = getAiAnalysisQueue();

    for (const job of pendingJobs) {
      try {
        if (!job.video || job.video.validationStatus !== "VALIDATED") {
          await db.processingJob.update({
            where: { id: job.id },
            data: {
              status: "CANCELLED",
              stage: "CANCELLED",
              errorMessage: "Video is not validated or was deleted prior to AI analysis dispatch.",
            },
          });
          continue;
        }

        const deterministicJobId = `ai-analysis-${job.id}`;
        const payload: AiAnalysisJobPayload = {
          jobId: job.id,
          videoId: job.videoId,
          kitchenId: job.kitchenId,
        };

        await queue.add("analyze-video", payload, {
          jobId: deterministicJobId,
        });

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
        result.errors.push(`AI Job ${job.id}: ${msg}`);
        logger.warn(`[Dispatcher] Failed to dispatch AI job ${job.id}`, { error: msg });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Dispatcher error: ${msg}`);
    logger.warn("[Dispatcher] AI dispatch batch failed", { error: msg });
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

  const [latestValidationJob, latestAiJob] = await Promise.all([
    db.processingJob.findFirst({
      where: {
        videoId,
        jobType: "VIDEO_VALIDATION",
      },
      orderBy: { createdAt: "desc" },
    }),
    db.processingJob.findFirst({
      where: {
        videoId,
        jobType: "AI_ANALYSIS",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
    latestJob: latestValidationJob
      ? {
          id: latestValidationJob.id,
          status: latestValidationJob.status,
          stage: latestValidationJob.stage,
          attempts: latestValidationJob.attempts,
          maxAttempts: latestValidationJob.maxAttempts,
          errorCode: latestValidationJob.errorCode,
          errorMessage: latestValidationJob.errorMessage,
          progressInfo: latestValidationJob.progressInfo,
          queuedAt: latestValidationJob.queuedAt,
          startedAt: latestValidationJob.startedAt,
          completedAt: latestValidationJob.completedAt,
          createdAt: latestValidationJob.createdAt,
          updatedAt: latestValidationJob.updatedAt,
        }
      : null,
    latestAiJob: latestAiJob
      ? {
          id: latestAiJob.id,
          status: latestAiJob.status,
          stage: latestAiJob.stage,
          attempts: latestAiJob.attempts,
          maxAttempts: latestAiJob.maxAttempts,
          errorCode: latestAiJob.errorCode,
          errorMessage: latestAiJob.errorMessage,
          progressInfo: latestAiJob.progressInfo,
          queuedAt: latestAiJob.queuedAt,
          startedAt: latestAiJob.startedAt,
          completedAt: latestAiJob.completedAt,
          createdAt: latestAiJob.createdAt,
          updatedAt: latestAiJob.updatedAt,
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
    logger.warn("[triggerVideoValidation] Background dispatch trigger", { error: err.message });
  });

  return newJob;
}

/**
 * Allows an authorized OWNER or EDITOR to trigger AI analysis for a media-validated video.
 */
export async function triggerAiAnalysis(userId: string, videoId: string) {
  const result = await canEditVideo(videoId, userId);
  if (!result) {
    throw new Error("VIDEO_NOT_FOUND_OR_FORBIDDEN");
  }

  const { video } = result;
  if (video.uploadStatus !== "UPLOADED") {
    throw new Error("VIDEO_NOT_UPLOADED");
  }

  if (video.validationStatus !== "VALIDATED") {
    throw new Error("VIDEO_NOT_VALIDATED: Only media-validated videos can be analyzed by AI.");
  }

  // Check if there is already an active AI analysis job
  const activeJob = await db.processingJob.findFirst({
    where: {
      videoId,
      jobType: "AI_ANALYSIS",
      status: { in: ["PENDING_DISPATCH", "QUEUED", "PROCESSING"] },
    },
  });

  if (activeJob) {
    return activeJob;
  }

  // Create new AI analysis job in transaction
  const newJob = await db.$transaction(async (tx) => {
    return createOrGetPendingAiAnalysisJob(tx, {
      videoId: video.id,
      kitchenId: video.kitchenId,
    });
  });

  // Attempt immediate outbox dispatch (non-blocking)
  dispatchPendingAiAnalysisJobs(5).catch((err) => {
    logger.warn("[triggerAiAnalysis] Background dispatch trigger", { error: err.message });
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

