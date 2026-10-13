import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getVideoPlaybackUrl } from "@/lib/services/videos";
import { StorageNotConfiguredError } from "@/lib/storage/r2";

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
    const result = await getVideoPlaybackUrl(session.user.id, id);

    const response = NextResponse.json(
      {
        playbackUrl: result.playbackUrl,
        expiresInSeconds: result.expiresInSeconds,
      },
      { status: 200 }
    );

    // Ensure the signed temporary bearer URL is never cached by downstream proxies or browsers
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        {
          error: "Storage not configured",
          message:
            "Cloudflare R2 / S3 storage credentials are not configured for playback.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "VIDEO_NOT_FOUND_OR_FORBIDDEN") {
        return NextResponse.json(
          { error: "Video not found or you lack permission to view this video" },
          { status: 404 }
        );
      }
      if (error.message === "VIDEO_NOT_UPLOADED") {
        return NextResponse.json(
          { error: "Video upload is still pending or has not completed." },
          { status: 400 }
        );
      }
    }

    console.error("Video playback URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate video playback URL" },
      { status: 500 }
    );
  }
}
