import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { triggerAiAnalysis } from "@/lib/services/jobs";

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
    const job = await triggerAiAnalysis(session.user.id, id);

    return NextResponse.json(
      {
        job,
        message: "AI video analysis and recipe reconstruction has been queued.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "VIDEO_NOT_FOUND_OR_FORBIDDEN") {
        return NextResponse.json(
          { error: "Video not found or you lack OWNER/EDITOR permission to analyze this video." },
          { status: 404 }
        );
      }
      if (error.message === "VIDEO_NOT_UPLOADED") {
        return NextResponse.json(
          { error: "Cannot analyze video before upload has completed." },
          { status: 400 }
        );
      }
      if (error.message.startsWith("VIDEO_NOT_VALIDATED")) {
        return NextResponse.json(
          { error: "Only media-validated videos can be analyzed by AI." },
          { status: 400 }
        );
      }
    }

    console.error("Trigger AI analysis error:", error);
    return NextResponse.json(
      { error: "Failed to queue AI analysis" },
      { status: 500 }
    );
  }
}
