import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { changePasswordSchema } from "@/lib/auth/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { validateSameOrigin } from "@/lib/auth/origin";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
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
    const parseResult = changePasswordSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Fetch existing password hash
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password with Argon2id
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and revoke all other active sessions for security
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await revokeAllUserSessions(user.id, session.sessionId);

    return NextResponse.json(
      {
        message:
          "Password updated successfully. All other active sessions have been signed out.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while changing password" },
      { status: 500 }
    );
  }
}
