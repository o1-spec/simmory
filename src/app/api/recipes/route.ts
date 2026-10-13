import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { createRecipeSchema } from "@/lib/validations/recipe";
import { listUserRecipes, createRecipe } from "@/lib/services/recipes";
import { RecipeStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kitchenId = searchParams.get("kitchenId") || undefined;
  const statusParam = searchParams.get("status") || undefined;
  const query = searchParams.get("q") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limit = parseInt(searchParams.get("limit") || "12", 10) || 12;

  let status: RecipeStatus | undefined;
  if (statusParam && Object.values(RecipeStatus).includes(statusParam as RecipeStatus)) {
    status = statusParam as RecipeStatus;
  }

  try {
    const result = await listUserRecipes(session.user.id, {
      kitchenId,
      status,
      query,
      page,
      limit,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("List recipes error:", error);
    return NextResponse.json(
      { error: "Failed to list recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const parseResult = createRecipeSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const recipe = await createRecipe(session.user.id, parseResult.data);
    if (!recipe) {
      return NextResponse.json(
        { error: "Target kitchen not found or you lack permission to add recipes" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        recipe,
        message: "Recipe preserved successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create recipe error:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
