import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { initiateVideoUploadSchema } from "@/lib/validations/video";
import { initiateVideoUpload } from "@/lib/services/videos";
import { StorageNotConfiguredError } from "@/lib/storage/r2";

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
    const parseResult = initiateVideoUploadSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await initiateVideoUpload(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        video: result.video,
        uploadUrl: result.uploadUrl,
        storageKey: result.storageKey,
        expiresInSeconds: result.expiresInSeconds,
        uploadExpiresAt: result.uploadExpiresAt,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        {
          error: "Storage not configured",
          message:
            "Cloudflare R2 / S3 storage credentials are not configured. Please supply R2 environment variables.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED_KITCHEN_ACCESS") {
        return NextResponse.json(
          { error: "You do not have permission to upload videos to this kitchen" },
          { status: 403 }
        );
      }
      if (error.message === "RECIPE_KITCHEN_MISMATCH") {
        return NextResponse.json(
          { error: "The selected recipe does not belong to this family kitchen" },
          { status: 400 }
        );
      }
    }

    console.error("Initiate video upload error:", error);
    return NextResponse.json(
      { error: "Failed to initiate video upload" },
      { status: 500 }
    );
  }
}
