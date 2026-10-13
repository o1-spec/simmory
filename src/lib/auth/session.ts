import { db } from "@/lib/db";
import {
  generateOpaqueRefreshToken,
  hashToken,
  signAccessToken,
  REFRESH_TOKEN_TTL_MS,
} from "./jwt";

export interface SessionAuthResult {
  accessToken: string;
  rawRefreshToken: string;
  userId: string;
  sessionId: string;
}

/**
 * Creates a brand new RefreshSession in the database and generates both tokens.
 */
export async function createSession(userId: string): Promise<SessionAuthResult> {
  const rawRefreshToken = generateOpaqueRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const session = await db.refreshSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    userId,
    sessionId: session.id,
  });

  return {
    accessToken,
    rawRefreshToken,
    userId,
    sessionId: session.id,
  };
}

/**
 * Rotates an existing refresh token with strict replay detection.
 * If an already-revoked token is used, all active sessions for that user are revoked.
 */
export async function rotateRefreshToken(
  rawRefreshToken: string
): Promise<SessionAuthResult | null> {
  const tokenHash = hashToken(rawRefreshToken);

  const existingSession = await db.refreshSession.findUnique({
    where: { tokenHash },
  });

  if (!existingSession) {
    return null;
  }

  // Token Replay Detection:
  // If an already revoked token is used, this may indicate token theft!
  if (existingSession.revokedAt !== null) {
    // Invalidate all active sessions for this compromised user
    await db.refreshSession.updateMany({
      where: {
        userId: existingSession.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return null;
  }

  // Check expiration
  if (existingSession.expiresAt.getTime() < Date.now()) {
    await db.refreshSession.update({
      where: { id: existingSession.id },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // Atomic rotation transaction
  const newRawRefreshToken = generateOpaqueRefreshToken();
  const newTokenHash = hashToken(newRawRefreshToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const [, newSession] = await db.$transaction([
    // Invalidate old session
    db.refreshSession.update({
      where: { id: existingSession.id },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    }),
    // Create rotated session
    db.refreshSession.create({
      data: {
        userId: existingSession.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const newAccessToken = await signAccessToken({
    userId: existingSession.userId,
    sessionId: newSession.id,
  });

  return {
    accessToken: newAccessToken,
    rawRefreshToken: newRawRefreshToken,
    userId: existingSession.userId,
    sessionId: newSession.id,
  };
}

/**
 * Revoke a single refresh session (used on logout)
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db.refreshSession.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoke all active sessions for a user (used after password change or security events)
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<void> {
  await db.refreshSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
