import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import {
  updateReviewedEvent,
  removeOrRejectReviewedEvent,
  ReviewError,
} from "@/lib/services/reviews";
import { updateReviewedEventSchema } from "@/lib/validations/review";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string; eventId: string }> }
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

  const { reviewId, eventId } = await context.params;
  if (!reviewId || !eventId) {
    return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateReviewedEventSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  try {
    const updatedEvent = await updateReviewedEvent(
      reviewId,
      eventId,
      session.user.id,
      parseResult.data
    );
    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string; eventId: string }> }
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

  const { reviewId, eventId } = await context.params;
  if (!reviewId || !eventId) {
    return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
  }

  try {
    const result = await removeOrRejectReviewedEvent(reviewId, eventId, session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to remove event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
