import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { getOrCreateReviewForVideo, ReviewError } from "@/lib/services/reviews";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id: videoId } = await context.params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    const review = await getOrCreateReviewForVideo(videoId, session.user.id);
    return NextResponse.json({ review }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to load review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

  const { id: videoId } = await context.params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    const review = await getOrCreateReviewForVideo(videoId, session.user.id);
    return NextResponse.json({ review }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to initialize review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
