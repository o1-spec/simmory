import { db } from "@/lib/db";
import { KitchenRole } from "@/generated/prisma/client";

export function isOwner(role: KitchenRole): boolean {
  return role === "OWNER";
}

export function isEditor(role: KitchenRole): boolean {
  return role === "OWNER" || role === "EDITOR" || role === "ADMIN";
}

export function isViewer(role: KitchenRole): boolean {
  return role === "OWNER" || role === "EDITOR" || role === "VIEWER" || role === "ADMIN" || role === "MEMBER";
}

/**
 * Returns the user's membership in a kitchen, or null if the user is not a member.
 */
export async function getKitchenMembership(userId: string, kitchenId: string) {
  return db.kitchenMember.findUnique({
    where: {
      kitchenId_userId: {
        kitchenId,
        userId,
      },
    },
    include: {
      kitchen: true,
    },
  });
}

/**
 * Verifies that the user has at least viewer membership in the kitchen.
 */
export async function requireKitchenMember(userId: string, kitchenId: string) {
  const membership = await getKitchenMembership(userId, kitchenId);
  if (!membership) {
    return null;
  }
  return membership;
}

/**
 * Verifies that the user has editor or owner permissions in the kitchen.
 */
export async function requireKitchenEditor(userId: string, kitchenId: string) {
  const membership = await getKitchenMembership(userId, kitchenId);
  if (!membership || !isEditor(membership.role)) {
    return null;
  }
  return membership;
}

/**
 * Verifies that the user is the owner of the kitchen.
 */
export async function requireKitchenOwner(userId: string, kitchenId: string) {
  const membership = await getKitchenMembership(userId, kitchenId);
  if (!membership || !isOwner(membership.role)) {
    return null;
  }
  return membership;
}

/**
 * Retrieves a recipe if and only if the requesting user belongs to the recipe's kitchen.
 * Prevents Insecure Direct Object References (IDOR).
 */
export async function getRecipeWithAccess(recipeId: string, userId: string) {
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    include: {
      kitchen: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
      ingredients: {
        orderBy: { position: "asc" },
      },
      steps: {
        orderBy: { position: "asc" },
      },
      videos: {
        select: {
          id: true,
          originalFilename: true,
          uploadStatus: true,
          processingStatus: true,
          createdAt: true,
          actualSize: true,
          expectedSize: true,
        },
        orderBy: { createdAt: "desc" },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!recipe) {
    return null;
  }

  // Check if user is a member of this kitchen
  const membership = await getKitchenMembership(userId, recipe.kitchenId);
  if (!membership) {
    return null;
  }

  return { recipe, membership };
}

/**
 * Checks whether the user can edit or delete a recipe (must be owner or editor of the recipe's kitchen).
 */
export async function canEditRecipe(recipeId: string, userId: string) {
  const result = await getRecipeWithAccess(recipeId, userId);
  if (!result) {
    return null;
  }

  if (!isEditor(result.membership.role)) {
    return null;
  }

  return result;
}

/**
 * Retrieves a cooking video if and only if the requesting user belongs to the video's kitchen.
 * Prevents Insecure Direct Object References (IDOR).
 */
export async function getVideoWithAccess(videoId: string, userId: string) {
  const video = await db.cookingVideo.findUnique({
    where: { id: videoId },
    include: {
      kitchen: {
        select: {
          id: true,
          name: true,
          ownerId: true,
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
          email: true,
        },
      },
    },
  });

  if (!video) {
    return null;
  }

  // Check if user is a member of this kitchen
  const membership = await getKitchenMembership(userId, video.kitchenId);
  if (!membership) {
    return null;
  }

  return { video, membership };
}

/**
 * Checks whether the user can edit or delete a video (must be owner or editor of the video's kitchen).
 */
export async function canEditVideo(videoId: string, userId: string) {
  const result = await getVideoWithAccess(videoId, userId);
  if (!result) {
    return null;
  }

  if (!isEditor(result.membership.role)) {
    return null;
  }

  return result;
}

