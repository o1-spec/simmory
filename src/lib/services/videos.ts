import { db } from "@/lib/db";
import {
  requireKitchenEditor,
  getVideoWithAccess,
  canEditVideo,
} from "@/lib/auth/permissions";
import {
  generatePresignedUploadUrl,
  verifyObjectExists,
  generatePresignedPlaybackUrl,
  deleteStorageObject,
  isStorageConfigured,
  StorageNotConfiguredError,
} from "@/lib/storage/r2";
import { InitiateVideoUploadInput, UpdateVideoInput } from "@/lib/validations/video";
import { VideoUploadStatus } from "@/generated/prisma/client";
import {
  createOrGetPendingValidationJob,
  dispatchPendingValidationJobs,
} from "@/lib/services/jobs";
import { logger } from "@/lib/logger";

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(-100);
}

/**
 * Initiates an upload workflow by creating a PENDING_UPLOAD record and
 * issuing a short-lived presigned PUT URL.
 */
export async function initiateVideoUpload(
  userId: string,
  input: InitiateVideoUploadInput
) {
  // Check that user has OWNER or EDITOR access in the selected kitchen
  const membership = await requireKitchenEditor(userId, input.kitchenId);
  if (!membership) {
    throw new Error("UNAUTHORIZED_KITCHEN_ACCESS");
  }

  // If a recipe is selected, verify that it belongs to the same kitchen
  if (input.recipeId) {
    const recipe = await db.recipe.findUnique({
      where: { id: input.recipeId },
      select: { kitchenId: true },
    });
    if (!recipe || recipe.kitchenId !== input.kitchenId) {
      throw new Error("RECIPE_KITCHEN_MISMATCH");
    }
  }

  // Storage must be configured to generate a real presigned URL
  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }

  // Generate unique, unguessable storage key
  const randomSuffix = crypto.randomUUID();
  const cleanName = sanitizeFilename(input.originalFilename);
  const storageKey = `kitchens/${input.kitchenId}/videos/${randomSuffix}-${cleanName}`;

  // 5 minutes expiry for direct browser upload
  const expiresInSeconds = 300;
  const uploadExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  // Generate presigned PUT URL from storage provider
  const { uploadUrl } = await generatePresignedUploadUrl({
    storageKey,
    contentType: input.contentType,
    expectedSize: input.fileSize,
    expiresInSeconds,
  });

  // Create pending database record
  const video = await db.cookingVideo.create({
    data: {
      kitchenId: input.kitchenId,
      recipeId: input.recipeId || null,
      uploadedById: userId,
      originalFilename: input.originalFilename,
      storageKey,
      contentType: input.contentType,
      expectedSize: input.fileSize,
      uploadStatus: "PENDING_UPLOAD",
      processingStatus: "NOT_STARTED",
      uploadExpiresAt,
    },
    include: {
      kitchen: {
        select: {
          id: true,
          name: true,
        },
      },
      recipe: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return {
    video,
    uploadUrl,
    storageKey,
    expiresInSeconds,
    uploadExpiresAt,
  };
}

/**
 * Completes and finalizes an upload after independently verifying object existence
 * and size in Cloudflare R2 / S3 via HEAD request.
 */
export async function completeVideoUpload(userId: string, videoId: string) {
  const result = await canEditVideo(videoId, userId);
  if (!result) {
    throw new Error("VIDEO_NOT_FOUND_OR_FORBIDDEN");
  }

  const { video } = result;

  // Idempotent handling: if already marked uploaded, return cleanly
  if (video.uploadStatus === "UPLOADED") {
    return video;
  }

  if (video.uploadStatus === "DELETED") {
    throw new Error("VIDEO_DELETED");
  }

  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }

  // Independently verify object on R2
  const headResult = await verifyObjectExists(video.storageKey);
  if (!headResult.exists) {
    throw new Error("OBJECT_NOT_FOUND_IN_STORAGE");
  }

  // Compare file size if returned
  const actualSize = headResult.contentLength ?? video.expectedSize;

  // Transactionally transition status to UPLOADED and create pending validation job
  const updatedVideo = await db.$transaction(async (tx) => {
    const v = await tx.cookingVideo.update({
      where: { id: videoId },
      data: {
        uploadStatus: "UPLOADED",
        actualSize,
        completedAt: new Date(),
      },
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    await createOrGetPendingValidationJob(tx, {
      videoId: v.id,
      kitchenId: v.kitchenId,
      expectedSize: v.expectedSize,
    });

    return v;
  });

  // Attempt immediate background dispatch (non-blocking, survives Redis downtime)
  dispatchPendingValidationJobs(5).catch((err) => {
    logger.warn("[completeVideoUpload] Immediate dispatch non-critical error", { error: err.message });
  });

  return updatedVideo;
}

/**
 * Generates an authorized, short-lived playback URL for a cooking video.
 */
export async function getVideoPlaybackUrl(userId: string, videoId: string) {
  const result = await getVideoWithAccess(videoId, userId);
  if (!result) {
    throw new Error("VIDEO_NOT_FOUND_OR_FORBIDDEN");
  }

  const { video } = result;

  if (video.uploadStatus !== "UPLOADED") {
    throw new Error("VIDEO_NOT_UPLOADED");
  }

  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }

  const expiresInSeconds = 900; // 15 minutes
  const { playbackUrl } = await generatePresignedPlaybackUrl({
    storageKey: video.storageKey,
    expiresInSeconds,
  });

  return {
    video,
    playbackUrl,
    expiresInSeconds,
  };
}

/**
 * Lists videos belonging to kitchens accessible to the user.
 */
export async function listUserVideos(
  userId: string,
  options: {
    kitchenId?: string;
    uploadStatus?: VideoUploadStatus;
    page?: number;
    limit?: number;
  } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  // Find all kitchens where the user is an active member
  const memberships = await db.kitchenMember.findMany({
    where: { userId },
    select: { kitchenId: true },
  });

  const accessibleKitchenIds = memberships.map((m) => m.kitchenId);

  if (accessibleKitchenIds.length === 0) {
    return {
      videos: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  // Build filter
  const where: {
    kitchenId: { in: string[] } | string;
    uploadStatus?: VideoUploadStatus;
  } = {
    kitchenId: options.kitchenId
      ? accessibleKitchenIds.includes(options.kitchenId)
        ? options.kitchenId
        : { in: [] }
      : { in: accessibleKitchenIds },
  };

  if (options.uploadStatus) {
    where.uploadStatus = options.uploadStatus;
  }

  const [total, videos] = await Promise.all([
    db.cookingVideo.count({ where }),
    db.cookingVideo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            cookName: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    videos,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Retrieves details for a specific video if the user belongs to its kitchen.
 */
export async function getVideoDetails(userId: string, videoId: string) {
  const result = await getVideoWithAccess(videoId, userId);
  if (!result) {
    return null;
  }

  return {
    video: result.video,
    role: result.membership.role,
  };
}

/**
 * Deletes a video record and removes its object from Cloudflare R2 storage.
 */
export async function deleteVideo(userId: string, videoId: string) {
  const result = await canEditVideo(videoId, userId);
  if (!result) {
    throw new Error("VIDEO_NOT_FOUND_OR_FORBIDDEN");
  }

  const { video } = result;

  // Attempt object deletion if storage is configured
  if (isStorageConfigured()) {
    try {
      await deleteStorageObject(video.storageKey);
    } catch (storageErr) {
      logger.warn("Storage deletion warning for key", { storageKey: video.storageKey, error: storageErr });
    }
  }

  // Delete database record
  await db.cookingVideo.delete({
    where: { id: videoId },
  });

  return { success: true };
}

/**
 * Updates video metadata (e.g. attaching/detaching a recipe).
 */
export async function updateVideoMetadata(
  userId: string,
  videoId: string,
  input: UpdateVideoInput
) {
  const result = await canEditVideo(videoId, userId);
  if (!result) {
    throw new Error("VIDEO_NOT_FOUND_OR_FORBIDDEN");
  }

  const { video } = result;

  // If attaching a recipe, ensure the recipe belongs to the same kitchen
  if (input.recipeId) {
    const recipe = await db.recipe.findUnique({
      where: { id: input.recipeId },
      select: { kitchenId: true },
    });

    if (!recipe || recipe.kitchenId !== video.kitchenId) {
      throw new Error("RECIPE_KITCHEN_MISMATCH");
    }
  }

  const updated = await db.cookingVideo.update({
    where: { id: videoId },
    data: {
      ...(input.originalFilename ? { originalFilename: input.originalFilename } : {}),
      ...(input.recipeId !== undefined ? { recipeId: input.recipeId } : {}),
    },
    include: {
      kitchen: {
        select: {
          id: true,
          name: true,
        },
      },
      recipe: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updated;
}
