import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import {
  completeCookingSession,
  CookSessionError,
} from "@/lib/services/cook-sessions";

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

  const { id: sessionId } = await context.params;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    const result = await completeCookingSession(sessionId, session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to complete cooking session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
