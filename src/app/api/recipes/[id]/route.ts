import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { updateRecipeSchema } from "@/lib/validations/recipe";
import {
  getRecipeDetails,
  updateRecipe,
  deleteRecipe,
} from "@/lib/services/recipes";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const recipe = await getRecipeDetails(id, session.user.id);
    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ recipe }, { status: 200 });
  } catch (error) {
    logger.error("Get recipe error", { error });
    return NextResponse.json(
      { error: "Failed to retrieve recipe details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parseResult = updateRecipeSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await updateRecipe(id, session.user.id, parseResult.data);
    if (!updated) {
      return NextResponse.json(
        { error: "Recipe not found or you lack permission to update it" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        recipe: updated,
        message: "Recipe updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Update recipe error", { error });
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await deleteRecipe(id, session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Recipe not found or you lack permission to delete it" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: "Recipe deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Delete recipe error", { error });
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
