import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { updateProfileSchema } from "@/lib/auth/schemas";
import { validateSameOrigin } from "@/lib/auth/origin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name } = parseResult.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        user: updatedUser,
        message: "Profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Profile update error", { error });
    return NextResponse.json(
      { error: "An unexpected error occurred while updating profile" },
      { status: 500 }
    );
  }
}
