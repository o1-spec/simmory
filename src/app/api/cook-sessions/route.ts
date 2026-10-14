import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { startCookingSessionSchema } from "@/lib/validations/cook-session";
import {
  getOrCreateCookingSession,
  CookSessionError,
} from "@/lib/services/cook-sessions";

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
    const json = await request.json();
    const result = startCookingSessionSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { recipeId, forceNew } = result.data;
    const cookSession = await getOrCreateCookingSession(
      recipeId,
      session.user.id,
      forceNew
    );

    return NextResponse.json({ session: cookSession }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to start cooking session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
