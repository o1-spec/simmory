import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { setIngredientCheckSchema } from "@/lib/validations/cook-session";
import {
  setSessionIngredientChecked,
  CookSessionError,
} from "@/lib/services/cook-sessions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; ingredientId: string }> }
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

  const { id: sessionId, ingredientId } = await context.params;
  if (!sessionId || !ingredientId) {
    return NextResponse.json(
      { error: "Missing session ID or ingredient ID" },
      { status: 400 }
    );
  }

  try {
    const json = await request.json();
    const result = setIngredientCheckSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const sessionIngredient = await setSessionIngredientChecked(
      sessionId,
      ingredientId,
      session.user.id,
      result.data.checked
    );

    return NextResponse.json(
      { ingredient: sessionIngredient },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update ingredient checklist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
