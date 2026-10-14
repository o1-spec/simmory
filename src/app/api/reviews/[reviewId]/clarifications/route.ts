import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { saveClarification, ReviewError } from "@/lib/services/reviews";
import { saveClarificationSchema } from "@/lib/validations/review";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
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

  const { reviewId } = await context.params;
  if (!reviewId) {
    return NextResponse.json({ error: "Missing review identifier" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = saveClarificationSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  try {
    const clarification = await saveClarification(
      reviewId,
      session.user.id,
      parseResult.data
    );
    return NextResponse.json({ clarification }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to save clarification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
