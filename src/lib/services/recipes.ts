import { db } from "@/lib/db";
import { CreateRecipeInput, UpdateRecipeInput } from "@/lib/validations/recipe";
import { requireKitchenEditor, canEditRecipe, getRecipeWithAccess } from "@/lib/auth/permissions";
import { RecipeStatus } from "@/generated/prisma/client";

export interface ListRecipesOptions {
  kitchenId?: string;
  status?: RecipeStatus;
  query?: string;
  page?: number;
  limit?: number;
}

export async function listUserRecipes(userId: string, options: ListRecipesOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 12));
  const skip = (page - 1) * limit;

  // Get all kitchens the user is a member of
  const userMemberships = await db.kitchenMember.findMany({
    where: { userId },
    select: { kitchenId: true },
  });

  const accessibleKitchenIds = userMemberships.map((m) => m.kitchenId);

  if (accessibleKitchenIds.length === 0) {
    return {
      recipes: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  // If specific kitchen requested, verify it is accessible
  if (options.kitchenId && !accessibleKitchenIds.includes(options.kitchenId)) {
    return {
      recipes: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  const whereClause: Record<string, unknown> = {
    kitchenId: options.kitchenId ? options.kitchenId : { in: accessibleKitchenIds },
  };

  if (options.status) {
    whereClause.status = options.status;
  }

  if (options.query && options.query.trim().length > 0) {
    const q = options.query.trim();
    whereClause.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { cookName: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { origin: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, recipes] = await Promise.all([
    db.recipe.count({ where: whereClause }),
    db.recipe.findMany({
      where: whereClause,
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            ingredients: true,
            steps: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    recipes: recipes.map((r) => ({
      id: r.id,
      title: r.title,
      cookName: r.cookName,
      description: r.description,
      story: r.story,
      origin: r.origin,
      notes: r.notes,
      status: r.status,
      kitchenId: r.kitchenId,
      kitchenName: r.kitchen.name,
      createdById: r.createdById,
      authorName: r.createdBy.name,
      ingredientCount: r._count.ingredients,
      stepCount: r._count.steps,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRecipeDetails(recipeId: string, userId: string) {
  const result = await getRecipeWithAccess(recipeId, userId);
  if (!result) {
    return null;
  }

  const { recipe, membership } = result;

  return {
    ...recipe,
    myRole: membership.role,
    canEdit: membership.role === "OWNER" || membership.role === "EDITOR" || membership.role === "ADMIN",
  };
}

export async function createRecipe(userId: string, input: CreateRecipeInput) {
  // Check permission on target kitchen
  const editorCheck = await requireKitchenEditor(userId, input.kitchenId);
  if (!editorCheck) {
    return null;
  }

  return db.$transaction(async (tx) => {
    const recipe = await tx.recipe.create({
      data: {
        kitchenId: input.kitchenId,
        title: input.title,
        cookName: input.cookName,
        description: input.description || null,
        story: input.story || null,
        origin: input.origin || null,
        notes: input.notes || null,
        createdById: userId,
        status: "DRAFT",
      },
    });

    if (input.ingredients && input.ingredients.length > 0) {
      await tx.recipeIngredient.createMany({
        data: input.ingredients.map((ing, index) => ({
          recipeId: recipe.id,
          name: ing.name,
          quantity: ing.quantity || null,
          notes: ing.notes || null,
          position: ing.position !== undefined ? ing.position : index,
        })),
      });
    }

    if (input.steps && input.steps.length > 0) {
      await tx.recipeStep.createMany({
        data: input.steps.map((st, index) => ({
          recipeId: recipe.id,
          instruction: st.instruction,
          sensoryCue: st.sensoryCue || null,
          duration: st.duration || null,
          notes: st.notes || null,
          position: st.position !== undefined ? st.position : index,
        })),
      });
    }

    return tx.recipe.findUnique({
      where: { id: recipe.id },
      include: {
        ingredients: { orderBy: { position: "asc" } },
        steps: { orderBy: { position: "asc" } },
        kitchen: { select: { id: true, name: true } },
      },
    });
  });
}

export async function updateRecipe(
  recipeId: string,
  userId: string,
  input: UpdateRecipeInput
) {
  const canEdit = await canEditRecipe(recipeId, userId);
  if (!canEdit) {
    return null;
  }

  return db.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id: recipeId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.cookName !== undefined && { cookName: input.cookName }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.story !== undefined && { story: input.story || null }),
        ...(input.origin !== undefined && { origin: input.origin || null }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      },
    });

    if (input.ingredients !== undefined) {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId },
      });

      if (input.ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: input.ingredients.map((ing, index) => ({
            recipeId,
            name: ing.name,
            quantity: ing.quantity || null,
            notes: ing.notes || null,
            position: ing.position !== undefined ? ing.position : index,
          })),
        });
      }
    }

    if (input.steps !== undefined) {
      await tx.recipeStep.deleteMany({
        where: { recipeId },
      });

      if (input.steps.length > 0) {
        await tx.recipeStep.createMany({
          data: input.steps.map((st, index) => ({
            recipeId,
            instruction: st.instruction,
            sensoryCue: st.sensoryCue || null,
            duration: st.duration || null,
            notes: st.notes || null,
            position: st.position !== undefined ? st.position : index,
          })),
        });
      }
    }

    return tx.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { orderBy: { position: "asc" } },
        steps: { orderBy: { position: "asc" } },
        kitchen: { select: { id: true, name: true } },
      },
    });
  });
}

export async function deleteRecipe(recipeId: string, userId: string) {
  const canEdit = await canEditRecipe(recipeId, userId);
  if (!canEdit) {
    return false;
  }

  await db.recipe.delete({
    where: { id: recipeId },
  });

  return true;
}
