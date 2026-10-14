import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import {
  getRecipeCookAlongData,
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

  const { id: recipeId } = await context.params;
  if (!recipeId) {
    return NextResponse.json({ error: "Missing recipe ID" }, { status: 400 });
  }

  try {
    const data = await getRecipeCookAlongData(recipeId, session.user.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof CookSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to load cook-along data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
