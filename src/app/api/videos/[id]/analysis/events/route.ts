import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getProposedCookingEvents } from "@/lib/services/ai-analysis";
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
    const events = await getProposedCookingEvents(id, session.user.id);
    if (!events) {
      return NextResponse.json(
        { error: "Video not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { events },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error: unknown) {
    logger.error("GET proposed events error", { error });
    return NextResponse.json(
      { error: "Failed to retrieve proposed cooking events" },
      { status: 500 }
    );
  }
}
