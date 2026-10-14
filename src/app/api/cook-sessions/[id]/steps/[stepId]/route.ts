import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { setStepCompletionSchema } from "@/lib/validations/cook-session";
import {
  setSessionStepCompletion,
  CookSessionError,
} from "@/lib/services/cook-sessions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; stepId: string }> }
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

  const { id: sessionId, stepId } = await context.params;
  if (!sessionId || !stepId) {
    return NextResponse.json(
      { error: "Missing session ID or step ID" },
      { status: 400 }
    );
  }

  try {
    const json = await request.json();
    const result = setStepCompletionSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const sessionStep = await setSessionStepCompletion(
      sessionId,
      stepId,
      session.user.id,
      result.data.completed
    );

    return NextResponse.json({ step: sessionStep }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update step completion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
