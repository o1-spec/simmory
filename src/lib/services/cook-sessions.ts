import { db } from "@/lib/db";
import { CookingSessionStatus } from "@/generated/prisma/client";
import { getVideoPlaybackUrl } from "@/lib/services/videos";

export class CookSessionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "CookSessionError";
  }
}

/**
 * Checks if user is a member of the kitchen (OWNER, EDITOR, or VIEWER).
 */
async function getKitchenRole(kitchenId: string, userId: string) {
  const membership = await db.kitchenMember.findUnique({
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
 * Retrieves the recipe and verifies that the user has kitchen access.
 */
async function getRecipeWithAccess(recipeId: string, userId: string) {
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    include: {
      kitchen: true,
      ingredients: { orderBy: { position: "asc" } },
      steps: {
        orderBy: { position: "asc" },
        include: {
          evidence: {
            include: {
              video: {
                select: {
                  id: true,
                  originalFilename: true,
                  duration: true,
                  storageKey: true,
                  uploadStatus: true,
                  processingStatus: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!recipe) {
    throw new CookSessionError("Recipe not found", 404);
  }

  const role = await getKitchenRole(recipe.kitchenId, userId);
  if (!role) {
    throw new CookSessionError("You do not have access to this kitchen", 403);
  }

  return { recipe, role };
}

/**
 * Gets or starts an active cooking session for a user on a recipe.
 */
export async function getOrCreateCookingSession(
  recipeId: string,
  userId: string,
  forceNew: boolean = false
) {
  const { recipe } = await getRecipeWithAccess(recipeId, userId);

  if (!forceNew) {
    // Check for an active (IN_PROGRESS or PAUSED) session for this user and recipe
    const existingSession = await db.cookingSession.findFirst({
      where: {
        recipeId,
        userId,
        status: { in: ["IN_PROGRESS", "PAUSED"] },
      },
      include: {
        sessionSteps: true,
        sessionIngredients: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existingSession) {
      return existingSession;
    }
  } else {
    // If forcing a new session, mark any previous incomplete session as ABANDONED
    await db.cookingSession.updateMany({
      where: {
        recipeId,
        userId,
        status: { in: ["IN_PROGRESS", "PAUSED"] },
      },
      data: {
        status: "ABANDONED",
      },
    });
  }

  // Create new session starting at the first step if one exists
  const firstStep = recipe.steps[0];
  const newSession = await db.cookingSession.create({
    data: {
      recipeId,
      userId,
      kitchenId: recipe.kitchenId,
      status: "IN_PROGRESS",
      currentStepId: firstStep?.id || null,
      currentStepPosition: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      version: 1,
    },
    include: {
      sessionSteps: true,
      sessionIngredients: true,
    },
  });

  return newSession;
}

/**
 * Retrieves a specific cooking session by ID, verifying user ownership.
 */
export async function getCookingSessionById(sessionId: string, userId: string) {
  const session = await db.cookingSession.findUnique({
    where: { id: sessionId },
    include: {
      sessionSteps: true,
      sessionIngredients: true,
      recipe: {
        include: {
          kitchen: true,
          ingredients: { orderBy: { position: "asc" } },
          steps: {
            orderBy: { position: "asc" },
            include: {
              evidence: {
                include: {
                  video: {
                    select: {
                      id: true,
                      originalFilename: true,
                      duration: true,
                      storageKey: true,
                      uploadStatus: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new CookSessionError("Cooking session not found", 404);
  }

  // User must own the session
  if (session.userId !== userId) {
    throw new CookSessionError("You do not have access to this cooking session", 403);
  }

  // Also confirm user is still a member of the kitchen
  const role = await getKitchenRole(session.kitchenId, userId);
  if (!role) {
    throw new CookSessionError("You are no longer a member of this kitchen", 403);
  }

  return session;
}

/**
 * Updates an active cooking session's current step, position, or status.
 */
export async function updateCookingSession(
  sessionId: string,
  userId: string,
  data: {
    currentStepId?: string | null;
    currentStepPosition?: number;
    status?: CookingSessionStatus;
    expectedVersion?: number;
  }
) {
  const session = await db.cookingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new CookSessionError("Cooking session not found", 404);
  }

  if (session.userId !== userId) {
    throw new CookSessionError("You do not have access to this cooking session", 403);
  }

  if (
    data.expectedVersion !== undefined &&
    session.version !== data.expectedVersion
  ) {
    throw new CookSessionError(
      `Conflict: Session version mismatch. Expected ${data.expectedVersion}, found ${session.version}.`,
      409
    );
  }

  // If setting a step ID, verify that the step belongs to the recipe
  if (data.currentStepId) {
    const step = await db.recipeStep.findFirst({
      where: { id: data.currentStepId, recipeId: session.recipeId },
    });
    if (!step) {
      throw new CookSessionError("Step does not belong to this recipe", 400);
    }
  }

  const updated = await db.cookingSession.update({
    where: { id: sessionId },
    data: {
      currentStepId: data.currentStepId !== undefined ? data.currentStepId : session.currentStepId,
      currentStepPosition:
        data.currentStepPosition !== undefined ? data.currentStepPosition : session.currentStepPosition,
      status: data.status || session.status,
      lastActivityAt: new Date(),
      version: { increment: 1 },
    },
    include: {
      sessionSteps: true,
      sessionIngredients: true,
    },
  });

  return updated;
}

/**
 * Toggles or sets completion status for a step in a cooking session.
 */
export async function setSessionStepCompletion(
  sessionId: string,
  stepId: string,
  userId: string,
  completed: boolean
) {
  const session = await db.cookingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new CookSessionError("Cooking session not found", 404);
  }

  if (session.userId !== userId) {
    throw new CookSessionError("You do not have access to this cooking session", 403);
  }

  // Verify step belongs to recipe
  const step = await db.recipeStep.findFirst({
    where: { id: stepId, recipeId: session.recipeId },
  });

  if (!step) {
    throw new CookSessionError("Step does not belong to this recipe", 400);
  }

  // Upsert step completion record
  const sessionStep = await db.cookingSessionStep.upsert({
    where: {
      sessionId_stepId: {
        sessionId,
        stepId,
      },
    },
    update: {
      completed,
      completedAt: new Date(),
    },
    create: {
      sessionId,
      stepId,
      completed,
      completedAt: new Date(),
    },
  });

  // Touch session lastActivityAt
  await db.cookingSession.update({
    where: { id: sessionId },
    data: {
      lastActivityAt: new Date(),
      version: { increment: 1 },
    },
  });

  return sessionStep;
}

/**
 * Toggles or sets checked status for an ingredient checklist item in a cooking session.
 */
export async function setSessionIngredientChecked(
  sessionId: string,
  ingredientId: string,
  userId: string,
  checked: boolean
) {
  const session = await db.cookingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new CookSessionError("Cooking session not found", 404);
  }

  if (session.userId !== userId) {
    throw new CookSessionError("You do not have access to this cooking session", 403);
  }

  // Verify ingredient belongs to recipe
  const ingredient = await db.recipeIngredient.findFirst({
    where: { id: ingredientId, recipeId: session.recipeId },
  });

  if (!ingredient) {
    throw new CookSessionError("Ingredient does not belong to this recipe", 400);
  }

  const sessionIngredient = await db.cookingSessionIngredient.upsert({
    where: {
      sessionId_ingredientId: {
        sessionId,
        ingredientId,
      },
    },
    update: {
      checked,
      checkedAt: new Date(),
    },
    create: {
      sessionId,
      ingredientId,
      checked,
      checkedAt: new Date(),
    },
  });

  // Touch session lastActivityAt
  await db.cookingSession.update({
    where: { id: sessionId },
    data: {
      lastActivityAt: new Date(),
      version: { increment: 1 },
    },
  });

  return sessionIngredient;
}

/**
 * Completes a cooking session.
 */
export async function completeCookingSession(sessionId: string, userId: string) {
  const session = await db.cookingSession.findUnique({
    where: { id: sessionId },
    include: {
      recipe: {
        include: {
          steps: true,
        },
      },
      sessionSteps: true,
    },
  });

  if (!session) {
    throw new CookSessionError("Cooking session not found", 404);
  }

  if (session.userId !== userId) {
    throw new CookSessionError("You do not have access to this cooking session", 403);
  }

  const now = new Date();
  const completed = await db.cookingSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      completedAt: now,
      lastActivityAt: now,
      version: { increment: 1 },
    },
    include: {
      sessionSteps: true,
      sessionIngredients: true,
    },
  });

  const totalSteps = session.recipe.steps.length;
  const completedStepsCount = completed.sessionSteps.filter((s) => s.completed).length;
  const elapsedSeconds = Math.max(
    0,
    Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000)
  );

  return {
    session: completed,
    summary: {
      totalSteps,
      completedStepsCount,
      elapsedSeconds,
      recipeTitle: session.recipe.title,
      cookName: session.recipe.cookName,
      story: session.recipe.story,
    },
  };
}

/**
 * Returns full cook-along normalized data for a recipe, including signed playback URLs
 * where videos are linked to steps and storage is configured.
 */
export async function getRecipeCookAlongData(recipeId: string, userId: string) {
  const { recipe } = await getRecipeWithAccess(recipeId, userId);

  // Find active or latest session for this user
  const latestSession = await db.cookingSession.findFirst({
    where: {
      recipeId,
      userId,
      status: { in: ["IN_PROGRESS", "PAUSED"] },
    },
    include: {
      sessionSteps: true,
      sessionIngredients: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Extract unique video IDs across step evidences
  const videoIds = new Set<string>();
  for (const step of recipe.steps) {
    for (const ev of step.evidence) {
      if (ev.videoId) {
        videoIds.add(ev.videoId);
      }
    }
  }

  // Attempt to generate signed playback URLs for each video
  const videoPlaybackUrls: Record<string, string | null> = {};
  for (const videoId of videoIds) {
    try {
      const result = await getVideoPlaybackUrl(userId, videoId);
      videoPlaybackUrls[videoId] = result.playbackUrl;
    } catch {
      // If storage is not configured or video is not uploaded, store null safely
      videoPlaybackUrls[videoId] = null;
    }
  }

  return {
    recipe: {
      id: recipe.id,
      kitchenId: recipe.kitchenId,
      kitchenName: recipe.kitchen.name,
      title: recipe.title,
      description: recipe.description,
      cookName: recipe.cookName,
      story: recipe.story,
      origin: recipe.origin,
      notes: recipe.notes,
      status: recipe.status,
      cookVerified: recipe.cookVerified,
      cookVerifiedAt: recipe.cookVerifiedAt,
      cookVerifiedBy: recipe.cookVerifiedBy,
      reviewedAt: recipe.reviewedAt,
      ingredients: recipe.ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        notes: ing.notes,
        position: ing.position,
      })),
      steps: recipe.steps.map((st) => ({
        id: st.id,
        instruction: st.instruction,
        position: st.position,
        duration: st.duration,
        sensoryCue: st.sensoryCue,
        notes: st.notes,
        videoTimestampStart: st.videoTimestampStart,
        videoTimestampEnd: st.videoTimestampEnd,
        evidence: st.evidence.map((ev) => ({
          id: ev.id,
          videoId: ev.videoId,
          videoFilename: ev.video.originalFilename,
          duration: ev.video.duration,
          startTimestamp: ev.startTimestamp,
          endTimestamp: ev.endTimestamp,
          evidenceFrames: ev.evidenceFrames,
          transcriptSegments: ev.transcriptSegments,
        })),
      })),
    },
    activeSession: latestSession || null,
    videoPlaybackUrls,
  };
}
