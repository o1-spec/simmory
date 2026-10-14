import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/schemas";
import { attachAuthCookiesToResponse } from "@/lib/auth/cookies";
import { validateSameOrigin } from "@/lib/auth/origin";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = parseResult.data;

    // Check for existing account
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // Atomically create user and default family kitchen
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      const defaultKitchen = await tx.kitchen.create({
        data: {
          name: `${newUser.name}'s Kitchen`,
          description: "Primary private family archive",
          ownerId: newUser.id,
        },
      });

      await tx.kitchenMember.create({
        data: {
          kitchenId: defaultKitchen.id,
          userId: newUser.id,
          role: "OWNER",
        },
      });

      return newUser;
    });

    // Establish authenticated session
    const authResult = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        message: "Registration successful",
      },
      { status: 201 }
    );

    return attachAuthCookiesToResponse(
      response,
      authResult.accessToken,
      authResult.rawRefreshToken
    );
  } catch (error) {
    logger.error("Registration error", { error });
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
