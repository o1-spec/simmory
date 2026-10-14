import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { completeReview, ReviewError } from "@/lib/services/reviews";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
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

  const { reviewId } = await context.params;
  if (!reviewId) {
    return NextResponse.json({ error: "Missing review identifier" }, { status: 400 });
  }

  try {
    const completedReview = await completeReview(reviewId, session.user.id);
    return NextResponse.json(
      {
        review: completedReview,
        message: "Review completed successfully. You can now convert it into a structured recipe.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to complete review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
