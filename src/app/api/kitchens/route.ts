import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { createKitchenSchema } from "@/lib/validations/kitchen";
import { listUserKitchens, createKitchen } from "@/lib/services/kitchens";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const kitchens = await listUserKitchens(session.user.id);
    return NextResponse.json({ kitchens }, { status: 200 });
  } catch (error) {
    logger.error("List kitchens error", { error });
    return NextResponse.json(
      { error: "Failed to retrieve family kitchens" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const parseResult = createKitchenSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { kitchen } = await createKitchen(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        kitchen,
        message: "Family kitchen created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create kitchen error", { error });
    return NextResponse.json(
      { error: "Failed to create family kitchen" },
      { status: 500 }
    );
  }
}
