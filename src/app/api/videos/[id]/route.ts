import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { updateVideoSchema } from "@/lib/validations/video";
import {
  getVideoDetails,
  deleteVideo,
  updateVideoMetadata,
} from "@/lib/services/videos";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    const details = await getVideoDetails(session.user.id, id);
    if (!details) {
      return NextResponse.json(
        { error: "Video not found or you lack permission to view it" },
        { status: 404 }
      );
    }

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    logger.error("Get video details error", { error });
    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parseResult = updateVideoSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const video = await updateVideoMetadata(session.user.id, id, parseResult.data);

    return NextResponse.json(
      {
        video,
        message: "Video metadata updated successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "VIDEO_NOT_FOUND_OR_FORBIDDEN") {
        return NextResponse.json(
          { error: "Video not found or you lack permission to edit it" },
          { status: 404 }
        );
      }
      if (error.message === "RECIPE_KITCHEN_MISMATCH") {
        return NextResponse.json(
          { error: "The selected recipe does not belong to the same kitchen" },
          { status: 400 }
        );
      }
    }

    logger.error("Update video error", { error });
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    await deleteVideo(session.user.id, id);

    return NextResponse.json(
      { message: "Cooking video removed successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "VIDEO_NOT_FOUND_OR_FORBIDDEN") {
      return NextResponse.json(
        { error: "Video not found or you lack permission to delete it" },
        { status: 404 }
      );
    }

    logger.error("Delete video error", { error });
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
