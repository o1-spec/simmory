import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getLatestAIAnalysis } from "@/lib/services/ai-analysis";
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
    const analysis = await getLatestAIAnalysis(id, session.user.id);
    if (!analysis) {
      return NextResponse.json(
        { error: "AI analysis not found or not yet processed" },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    logger.error("GET AI analysis error", { error });
    return NextResponse.json(
      { error: "Failed to retrieve AI analysis" },
      { status: 500 }
    );
  }
}
