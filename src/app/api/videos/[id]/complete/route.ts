import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { completeVideoUpload } from "@/lib/services/videos";
import { StorageNotConfiguredError } from "@/lib/storage/r2";
import { logger } from "@/lib/logger";

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

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    const video = await completeVideoUpload(session.user.id, id);

    return NextResponse.json(
      {
        video,
        message: "Your video has been uploaded successfully.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        {
          error: "Storage not configured",
          message: "Cloudflare R2 / S3 storage credentials are not configured.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "VIDEO_NOT_FOUND_OR_FORBIDDEN") {
        return NextResponse.json(
          { error: "Video not found or you lack permission to complete this upload" },
          { status: 404 }
        );
      }
      if (error.message === "OBJECT_NOT_FOUND_IN_STORAGE") {
        return NextResponse.json(
          {
            error:
              "Uploaded video object was not found in storage. Direct upload may have failed or timed out.",
          },
          { status: 400 }
        );
      }
      if (error.message === "VIDEO_DELETED") {
        return NextResponse.json({ error: "Video has been deleted" }, { status: 410 });
      }
    }

    logger.error("Complete video upload error", { error });
    return NextResponse.json(
      { error: "Failed to complete video upload" },
      { status: 500 }
    );
  }
}
