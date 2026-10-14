import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { triggerVideoValidation } from "@/lib/services/jobs";
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
    const job = await triggerVideoValidation(session.user.id, id);

    return NextResponse.json(
      {
        job,
        message: "Video validation has been queued.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "VIDEO_NOT_FOUND_OR_FORBIDDEN") {
        return NextResponse.json(
          { error: "Video not found or you lack permission to trigger processing" },
          { status: 404 }
        );
      }
      if (error.message === "VIDEO_NOT_UPLOADED") {
        return NextResponse.json(
          { error: "Cannot validate video before upload has been completed." },
          { status: 400 }
        );
      }
    }

    logger.error("Trigger video validation error", { error });
    return NextResponse.json(
      { error: "Failed to queue video validation" },
      { status: 500 }
    );
  }
}
