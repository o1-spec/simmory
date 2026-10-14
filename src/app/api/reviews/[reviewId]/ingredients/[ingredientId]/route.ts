import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { deleteReviewedIngredient, ReviewError } from "@/lib/services/reviews";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string; ingredientId: string }> }
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

  const { reviewId, ingredientId } = await context.params;
  if (!reviewId || !ingredientId) {
    return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
  }

  try {
    const result = await deleteReviewedIngredient(reviewId, ingredientId, session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to delete ingredient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
