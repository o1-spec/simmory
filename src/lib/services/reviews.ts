import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export class ReviewError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

/**
 * Checks if the user is a member of the kitchen and returns their role.
 */
async function getKitchenMemberRole(kitchenId: string, userId: string) {
  const membership = await prisma.kitchenMember.findUnique({
    where: {
      kitchenId_userId: {
        kitchenId,
        userId,
      },
    },
  });

  return membership?.role || null;
}

/**
 * Checks if the user is an OWNER or EDITOR of the kitchen.
 */
function canEditReview(role: string | null): boolean {
  return role === "OWNER" || role === "EDITOR" || role === "ADMIN";
}

/**
 * Retrieves or creates a CookingReview for the given video.
 * If creating, copies proposed events and clarification questions from the latest completed AI analysis.
 */
export async function getOrCreateReviewForVideo(videoId: string, userId: string) {
  // 1. Verify video and kitchen access
  const video = await prisma.cookingVideo.findUnique({
    where: { id: videoId },
    include: { kitchen: true },
  });

  if (!video) {
    throw new ReviewError("Video not found", 404);
  }

  const role = await getKitchenMemberRole(video.kitchenId, userId);
  if (!role) {
    throw new ReviewError("You do not have access to this kitchen", 403);
  }

  // 2. Check for existing review
  const existingReview = await prisma.cookingReview.findFirst({
    where: { videoId },
    include: {
      events: { orderBy: { position: "asc" } },
      clarifications: { orderBy: { createdAt: "asc" } },
      ingredients: { orderBy: { position: "asc" } },
      video: {
        select: {
          id: true,
          originalFilename: true,
          duration: true,
          storageKey: true,
          kitchenId: true,
        },
      },
      analysis: {
        select: {
          id: true,
          status: true,
          speechStatus: true,
          summary: true,
          samplingStrategy: true,
          coverageRatio: true,
          sampledTimeRange: true,
          whisperModel: true,
          visionModel: true,
          createdAt: true,
        },
      },
      recipe: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingReview) {
    return existingReview;
  }

  // 3. To initialize a review, user must be OWNER or EDITOR
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can initialize a recipe review", 403);
  }

  // 4. Find latest completed AI analysis
  const latestAnalysis = await prisma.aIAnalysis.findFirst({
    where: { videoId, status: "COMPLETED" },
    include: {
      proposedEvents: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestAnalysis) {
    throw new ReviewError(
      "No completed AI analysis found for this video. Analysis must complete before review.",
      400
    );
  }

  // 5. Initialize review atomically from proposed events
  return await prisma.$transaction(async (tx) => {
    const review = await tx.cookingReview.create({
      data: {
        videoId,
        analysisId: latestAnalysis.id,
        kitchenId: video.kitchenId,
        reviewerId: userId,
        status: "IN_PROGRESS",
      },
    });

    for (const proposed of latestAnalysis.proposedEvents) {
      const timestamps = Array.isArray(proposed.observedTimestamps)
        ? (proposed.observedTimestamps as number[])
        : [];
      const startTimestamp = timestamps.length > 0 ? Number(timestamps[0]) : 0.0;
      const endTimestamp =
        timestamps.length > 1 ? Number(timestamps[timestamps.length - 1]) : null;

      const createdEvent = await tx.reviewedCookingEvent.create({
        data: {
          reviewId: review.id,
          sourceProposedEventId: proposed.id,
          position: proposed.position,
          title: proposed.title,
          description: proposed.description,
          originalAiTitle: proposed.title,
          originalAiDescription: proposed.description,
          startTimestamp,
          endTimestamp,
          status: "UNREVIEWED",
          evidenceFrames: proposed.evidenceFrames as Prisma.InputJsonValue,
          transcriptSegments: (proposed.evidenceTranscripts || []) as Prisma.InputJsonValue,
        },
      });

      // If proposed event had a question for the cook, create an unanswered clarification
      if (proposed.questionForCook && proposed.questionForCook.trim().length > 0) {
        await tx.cookingClarification.create({
          data: {
            reviewId: review.id,
            eventId: createdEvent.id,
            question: proposed.questionForCook.trim(),
            status: "UNANSWERED",
            source: "AI_GENERATED",
          },
        });
      }
    }

    return await tx.cookingReview.findUniqueOrThrow({
      where: { id: review.id },
      include: {
        events: { orderBy: { position: "asc" } },
        clarifications: { orderBy: { createdAt: "asc" } },
        ingredients: { orderBy: { position: "asc" } },
        video: {
          select: {
            id: true,
            originalFilename: true,
            duration: true,
            storageKey: true,
            kitchenId: true,
          },
        },
        analysis: {
          select: {
            id: true,
            status: true,
            speechStatus: true,
            summary: true,
            samplingStrategy: true,
            coverageRatio: true,
            sampledTimeRange: true,
            whisperModel: true,
            visionModel: true,
            createdAt: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  });
}

/**
 * Retrieves a review by ID, ensuring kitchen access.
 */
export async function getReviewById(reviewId: string, userId: string) {
  const review = await prisma.cookingReview.findUnique({
    where: { id: reviewId },
    include: {
      events: { orderBy: { position: "asc" } },
      clarifications: { orderBy: { createdAt: "asc" } },
      ingredients: { orderBy: { position: "asc" } },
      video: {
        select: {
          id: true,
          originalFilename: true,
          duration: true,
          storageKey: true,
          kitchenId: true,
        },
      },
      analysis: {
        select: {
          id: true,
          status: true,
          speechStatus: true,
          summary: true,
          samplingStrategy: true,
          coverageRatio: true,
          sampledTimeRange: true,
          whisperModel: true,
          visionModel: true,
          createdAt: true,
        },
      },
      recipe: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!review) {
    throw new ReviewError("Review not found", 404);
  }

  const role = await getKitchenMemberRole(review.kitchenId, userId);
  if (!role) {
    throw new ReviewError("You do not have access to this review", 403);
  }

  return { review, role };
}

/**
 * Updates review metadata, notes, or cook verification attestation.
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: {
    notes?: string;
    cookVerified?: boolean;
    cookVerifiedBy?: string;
    expectedVersion?: number;
  }
) {
  const { review, role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can edit reviews", 403);
  }

  if (data.expectedVersion && review.version !== data.expectedVersion) {
    throw new ReviewError(
      "Conflict: This review was updated by another session. Please reload to see the latest changes.",
      409
    );
  }

  const updateData: Prisma.CookingReviewUpdateInput = {
    version: { increment: 1 },
  };

  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  if (data.cookVerified !== undefined) {
    updateData.cookVerified = data.cookVerified;
    if (data.cookVerified) {
      updateData.cookVerifiedBy = data.cookVerifiedBy || "Original Cook";
      updateData.cookVerifiedAt = new Date();
    } else {
      updateData.cookVerifiedBy = null;
      updateData.cookVerifiedAt = null;
    }
  }

  return await prisma.cookingReview.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      events: { orderBy: { position: "asc" } },
      clarifications: { orderBy: { createdAt: "asc" } },
      ingredients: { orderBy: { position: "asc" } },
    },
  });
}

/**
 * Updates a reviewed cooking event (accept, edit, reject, adjust times).
 */
export async function updateReviewedEvent(
  reviewId: string,
  eventId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    startTimestamp?: number;
    endTimestamp?: number | null;
    status?: "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED";
    humanClarification?: string | null;
    sensoryCue?: string | null;
  }
) {
  const { review, role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can edit events", 403);
  }

  const event = await prisma.reviewedCookingEvent.findUnique({
    where: { id: eventId },
  });

  if (!event || event.reviewId !== reviewId) {
    throw new ReviewError("Event not found in this review", 404);
  }

  // Validate timestamps against video duration if changed
  const videoDuration = review.video.duration || 3600.0;
  const start = data.startTimestamp !== undefined ? data.startTimestamp : event.startTimestamp;
  const end = data.endTimestamp !== undefined ? data.endTimestamp : event.endTimestamp;

  if (start < 0) {
    throw new ReviewError("Start timestamp must be non-negative", 400);
  }

  if (end !== null && end !== undefined) {
    if (end < start) {
      throw new ReviewError("End timestamp must be greater than or equal to start timestamp", 400);
    }
    if (end > videoDuration + 10.0) {
      throw new ReviewError(`End timestamp exceeds video duration (${videoDuration}s)`, 400);
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.reviewedCookingEvent.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.startTimestamp !== undefined ? { startTimestamp: data.startTimestamp } : {}),
        ...(data.endTimestamp !== undefined ? { endTimestamp: data.endTimestamp } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.humanClarification !== undefined ? { humanClarification: data.humanClarification } : {}),
        ...(data.sensoryCue !== undefined ? { sensoryCue: data.sensoryCue } : {}),
      },
    });

    await tx.cookingReview.update({
      where: { id: reviewId },
      data: { version: { increment: 1 }, updatedAt: new Date() },
    });

    return updated;
  });
}

/**
 * Adds a new human-authored event to the review.
 */
export async function addReviewedEvent(
  reviewId: string,
  userId: string,
  data: {
    title: string;
    description: string;
    startTimestamp: number;
    endTimestamp?: number | null;
    sensoryCue?: string | null;
    humanClarification?: string | null;
  }
) {
  const { review, role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can add events", 403);
  }

  const videoDuration = review.video.duration || 3600.0;
  if (data.startTimestamp < 0 || data.startTimestamp > videoDuration + 10.0) {
    throw new ReviewError("Start timestamp is out of range for this video", 400);
  }

  if (data.endTimestamp !== null && data.endTimestamp !== undefined) {
    if (data.endTimestamp < data.startTimestamp) {
      throw new ReviewError("End timestamp cannot be earlier than start timestamp", 400);
    }
    if (data.endTimestamp > videoDuration + 10.0) {
      throw new ReviewError(`End timestamp exceeds video duration (${videoDuration}s)`, 400);
    }
  }

  const maxPosition = await prisma.reviewedCookingEvent.aggregate({
    where: { reviewId },
    _max: { position: true },
  });

  const nextPosition = (maxPosition._max.position ?? -1) + 1;

  return await prisma.$transaction(async (tx) => {
    const newEvent = await tx.reviewedCookingEvent.create({
      data: {
        reviewId,
        sourceProposedEventId: null,
        position: nextPosition,
        title: data.title,
        description: data.description,
        originalAiTitle: null,
        originalAiDescription: null,
        startTimestamp: data.startTimestamp,
        endTimestamp: data.endTimestamp || null,
        status: "EDITED", // Human-authored events are considered reviewed
        sensoryCue: data.sensoryCue || null,
        humanClarification: data.humanClarification || null,
        evidenceFrames: [] as Prisma.InputJsonValue,
        transcriptSegments: [] as Prisma.InputJsonValue,
      },
    });

    await tx.cookingReview.update({
      where: { id: reviewId },
      data: { version: { increment: 1 }, updatedAt: new Date() },
    });

    return newEvent;
  });
}

/**
 * Rejects an AI event or permanently deletes a purely human-authored event.
 */
export async function removeOrRejectReviewedEvent(
  reviewId: string,
  eventId: string,
  userId: string
) {
  const { role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can remove events", 403);
  }

  const event = await prisma.reviewedCookingEvent.findUnique({
    where: { id: eventId },
  });

  if (!event || event.reviewId !== reviewId) {
    throw new ReviewError("Event not found in this review", 404);
  }

  return await prisma.$transaction(async (tx) => {
    if (event.sourceProposedEventId) {
      // Preserve AI audit trail: mark as REJECTED rather than deleting
      await tx.reviewedCookingEvent.update({
        where: { id: eventId },
        data: { status: "REJECTED" },
      });
    } else {
      // User-added event can be permanently deleted
      await tx.reviewedCookingEvent.delete({
        where: { id: eventId },
      });
    }

    await tx.cookingReview.update({
      where: { id: reviewId },
      data: { version: { increment: 1 }, updatedAt: new Date() },
    });

    return { success: true };
  });
}

/**
 * Reorders reviewed events.
 */
export async function reorderReviewedEvents(
  reviewId: string,
  userId: string,
  eventIds: string[]
) {
  const { role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can reorder events", 403);
  }

  return await prisma.$transaction(async (tx) => {
    for (let index = 0; index < eventIds.length; index++) {
      await tx.reviewedCookingEvent.updateMany({
        where: { id: eventIds[index], reviewId },
        data: { position: index },
      });
    }

    await tx.cookingReview.update({
      where: { id: reviewId },
      data: { version: { increment: 1 }, updatedAt: new Date() },
    });

    return { success: true };
  });
}

/**
 * Saves or updates a clarification question & answer.
 */
export async function saveClarification(
  reviewId: string,
  userId: string,
  data: {
    clarificationId?: string;
    eventId?: string | null;
    question?: string;
    answer?: string;
    status?: "UNANSWERED" | "ANSWERED" | "UNKNOWN" | "NOT_APPLICABLE";
  }
) {
  const { role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can answer questions", 403);
  }

  return await prisma.$transaction(async (tx) => {
    if (data.clarificationId) {
      const existing = await tx.cookingClarification.findUnique({
        where: { id: data.clarificationId },
      });
      if (!existing || existing.reviewId !== reviewId) {
        throw new ReviewError("Clarification question not found in this review", 404);
      }

      const answer = data.answer !== undefined ? data.answer : existing.answer;
      let status = data.status || existing.status;
      if (answer && answer.trim().length > 0 && status === "UNANSWERED") {
        status = "ANSWERED";
      }

      return await tx.cookingClarification.update({
        where: { id: data.clarificationId },
        data: {
          ...(data.question ? { question: data.question } : {}),
          answer,
          status,
        },
      });
    } else {
      if (!data.question || data.question.trim().length === 0) {
        throw new ReviewError("Question text is required", 400);
      }

      const status =
        data.status || (data.answer && data.answer.trim().length > 0 ? "ANSWERED" : "UNANSWERED");

      return await tx.cookingClarification.create({
        data: {
          reviewId,
          eventId: data.eventId || null,
          question: data.question.trim(),
          answer: data.answer || null,
          status,
          source: "HUMAN_ADDED",
        },
      });
    }
  });
}

/**
 * Saves or updates a reviewed ingredient with traditional measurement support.
 */
export async function saveReviewedIngredient(
  reviewId: string,
  userId: string,
  data: {
    ingredientId?: string;
    name: string;
    quantity?: string | null;
    notes?: string | null;
    provenance?: "SPOKEN_INSTRUCTION" | "VISUALLY_SUGGESTED" | "HUMAN_SUPPLIED" | "HUMAN_CONFIRMED";
    isUnknownQuantity?: boolean;
    position?: number;
  }
) {
  const { role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can edit ingredients", 403);
  }

  return await prisma.$transaction(async (tx) => {
    if (data.ingredientId) {
      return await tx.reviewedIngredient.update({
        where: { id: data.ingredientId },
        data: {
          name: data.name,
          quantity: data.quantity || null,
          notes: data.notes || null,
          provenance: data.provenance || "HUMAN_CONFIRMED",
          isUnknownQuantity: data.isUnknownQuantity ?? false,
          ...(data.position !== undefined ? { position: data.position } : {}),
        },
      });
    } else {
      const maxPos = await tx.reviewedIngredient.aggregate({
        where: { reviewId },
        _max: { position: true },
      });
      const position = data.position ?? (maxPos._max.position ?? -1) + 1;

      return await tx.reviewedIngredient.create({
        data: {
          reviewId,
          name: data.name,
          quantity: data.quantity || null,
          notes: data.notes || null,
          provenance: data.provenance || "HUMAN_SUPPLIED",
          isUnknownQuantity: data.isUnknownQuantity ?? false,
          position,
        },
      });
    }
  });
}

/**
 * Deletes a reviewed ingredient.
 */
export async function deleteReviewedIngredient(
  reviewId: string,
  ingredientId: string,
  userId: string
) {
  const { role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can delete ingredients", 403);
  }

  await prisma.reviewedIngredient.delete({
    where: { id: ingredientId },
  });

  return { success: true };
}

/**
 * Completes a review after validating that all proposed events have been explicitly reviewed.
 */
export async function completeReview(reviewId: string, userId: string) {
  const { review, role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can complete a review", 403);
  }

  if (review.events.length === 0) {
    throw new ReviewError("Cannot complete a review with no events", 400);
  }

  const unreviewedCount = review.events.filter((e) => e.status === "UNREVIEWED").length;
  if (unreviewedCount > 0) {
    throw new ReviewError(
      `Cannot complete review: ${unreviewedCount} event(s) have not been reviewed yet. Please Accept, Edit, or Reject each event.`,
      400
    );
  }

  return await prisma.cookingReview.update({
    where: { id: reviewId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      version: { increment: 1 },
    },
    include: {
      events: { orderBy: { position: "asc" } },
      clarifications: { orderBy: { createdAt: "asc" } },
      ingredients: { orderBy: { position: "asc" } },
    },
  });
}

/**
 * Converts a completed or in-progress review into structured Recipe, RecipeIngredient,
 * RecipeStep, and RecipeEvidence records.
 */
export async function convertReviewToRecipe(
  reviewId: string,
  userId: string,
  options: {
    mode: "CREATE_NEW" | "MERGE_EXISTING";
    targetRecipeId?: string;
    title?: string;
    cookName?: string;
    story?: string;
    origin?: string;
    notes?: string;
  }
) {
  const { review, role } = await getReviewById(reviewId, userId);
  if (!canEditReview(role)) {
    throw new ReviewError("Only kitchen owners or editors can convert a review to a recipe", 403);
  }

  // Only ACCEPTED and EDITED events become cooking steps. REJECTED are strictly excluded!
  const validEvents = review.events.filter(
    (e) => e.status === "ACCEPTED" || e.status === "EDITED"
  );

  if (validEvents.length === 0) {
    throw new ReviewError(
      "No accepted or edited cooking events found. At least one event must be accepted or edited before creating a recipe.",
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
    let recipeId: string;

    if (options.mode === "MERGE_EXISTING") {
      if (!options.targetRecipeId) {
        throw new ReviewError("Target recipe ID is required for MERGE_EXISTING mode", 400);
      }
      const existing = await tx.recipe.findUnique({
        where: { id: options.targetRecipeId },
      });
      if (!existing || existing.kitchenId !== review.kitchenId) {
        throw new ReviewError("Target recipe not found in this kitchen", 404);
      }

      recipeId = existing.id;

      // Update recipe review tracking without deleting hand-written content
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          sourceReviewId: review.id,
          reviewedAt: new Date(),
          reviewedById: userId,
          ...(review.cookVerified
            ? {
                cookVerified: true,
                cookVerifiedBy: review.cookVerifiedBy,
                cookVerifiedAt: review.cookVerifiedAt,
                status: "VERIFIED_BY_COOK",
              }
            : { status: "REVIEW_PENDING" }),
        },
      });
    } else {
      // CREATE_NEW mode
      const recipeTitle =
        options.title ||
        review.video.originalFilename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") ||
        "Reconstructed Family Recipe";

      const newRecipe = await tx.recipe.create({
        data: {
          kitchenId: review.kitchenId,
          title: recipeTitle,
          description: `Preserved cooking reconstruction from video recording.`,
          cookName: options.cookName || "Family Cook",
          story: options.story || review.notes || null,
          origin: options.origin || null,
          notes: options.notes || null,
          createdById: userId,
          sourceReviewId: review.id,
          reviewedAt: new Date(),
          reviewedById: userId,
          cookVerified: review.cookVerified,
          cookVerifiedBy: review.cookVerifiedBy,
          cookVerifiedAt: review.cookVerifiedAt,
          status: review.cookVerified ? "VERIFIED_BY_COOK" : "REVIEW_PENDING",
        },
      });

      recipeId = newRecipe.id;

      // Associate video with recipe
      await tx.cookingVideo.update({
        where: { id: review.videoId },
        data: { recipeId: newRecipe.id },
      });
    }

    // Determine starting positions if merging
    const existingStepsCount = await tx.recipeStep.count({
      where: { recipeId },
    });
    const existingIngCount = await tx.recipeIngredient.count({
      where: { recipeId },
    });

    // 1. Create RecipeStep & RecipeEvidence for each accepted/edited event
    for (let idx = 0; idx < validEvents.length; idx++) {
      const ev = validEvents[idx];
      const position = existingStepsCount + idx;

      const step = await tx.recipeStep.create({
        data: {
          recipeId,
          instruction: ev.description,
          position,
          sensoryCue: ev.sensoryCue || null,
          notes: ev.humanClarification || null,
          videoTimestampStart: Math.round(ev.startTimestamp),
          videoTimestampEnd: ev.endTimestamp ? Math.round(ev.endTimestamp) : null,
        },
      });

      // Link evidence
      await tx.recipeEvidence.create({
        data: {
          recipeStepId: step.id,
          videoId: review.videoId,
          analysisId: review.analysisId,
          sourceEventId: ev.id,
          evidenceFrames: ev.evidenceFrames as Prisma.InputJsonValue,
          transcriptSegments: (ev.transcriptSegments || []) as Prisma.InputJsonValue,
          startTimestamp: ev.startTimestamp,
          endTimestamp: ev.endTimestamp || null,
        },
      });
    }

    // 2. Create RecipeIngredient records from reviewed ingredients
    for (let idx = 0; idx < review.ingredients.length; idx++) {
      const ing = review.ingredients[idx];
      const position = existingIngCount + idx;

      await tx.recipeIngredient.create({
        data: {
          recipeId,
          name: ing.name,
          quantity: ing.isUnknownQuantity ? "Amount unknown (to taste)" : ing.quantity || null,
          notes: ing.notes || null,
          position,
        },
      });
    }

    // 3. Link review to recipe
    await tx.cookingReview.update({
      where: { id: reviewId },
      data: {
        recipeId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Return the full recipe
    return await tx.recipe.findUniqueOrThrow({
      where: { id: recipeId },
      include: {
        ingredients: { orderBy: { position: "asc" } },
        steps: {
          orderBy: { position: "asc" },
          include: { evidence: true },
        },
        videos: true,
      },
    });
  });
}
