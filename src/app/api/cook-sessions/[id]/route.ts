import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { updateCookingSessionSchema } from "@/lib/validations/cook-session";
import {
  getCookingSessionById,
  updateCookingSession,
  CookSessionError,
} from "@/lib/services/cook-sessions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id: sessionId } = await context.params;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    const cookSession = await getCookingSessionById(sessionId, session.user.id);
    return NextResponse.json({ session: cookSession }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to load cooking session";
    return NextResponse.json({ error: message }, { status: 500 });
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

  const { id: sessionId } = await context.params;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    const json = await request.json();
    const result = updateCookingSessionSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateCookingSession(
      sessionId,
      session.user.id,
      result.data
    );

    return NextResponse.json({ session: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update cooking session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
