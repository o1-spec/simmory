import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "./jwt";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  setAuthCookies,
} from "./cookies";
import { rotateRefreshToken } from "./session";
import { sanitizeRedirectUrl } from "./redirect";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  user: SafeUser;
  sessionId: string;
}

/**
 * Returns the currently authenticated user session, or null if unauthenticated.
 * Transparently rotates valid refresh tokens when the access token has expired.
 */
export async function getCurrentUser(
  request?: NextRequest | Request
): Promise<UserSession | null> {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;

  if (request && "cookies" in request && typeof (request as NextRequest).cookies.get === "function") {
    accessToken = (request as NextRequest).cookies.get(ACCESS_COOKIE_NAME)?.value;
    refreshToken = (request as NextRequest).cookies.get(REFRESH_COOKIE_NAME)?.value;
  } else if (request && request.headers.has("cookie")) {
    const cookieHeader = request.headers.get("cookie") || "";
    const parsed = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, v.join("=")];
      })
    );
    accessToken = parsed[ACCESS_COOKIE_NAME];
    refreshToken = parsed[REFRESH_COOKIE_NAME];
  } else {
    try {
      const cookieStore = await cookies();
      accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
      refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    } catch {
      // Context outside request store
    }
  }

  // 1. Check access token
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const session = await db.refreshSession.findUnique({
        where: { id: payload.sessionId },
      });

      if (
        session &&
        session.revokedAt === null &&
        session.expiresAt.getTime() > Date.now()
      ) {
        const user = await db.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (user) {
          return { user, sessionId: session.id };
        }
      }
    }
  }

  // 2. Check refresh token if access token missing or expired
  if (refreshToken) {
    const rotated = await rotateRefreshToken(refreshToken);
    if (rotated) {
      // Set new cookies
      await setAuthCookies(rotated.accessToken, rotated.rawRefreshToken);

      const user = await db.user.findUnique({
        where: { id: rotated.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (user) {
        return { user, sessionId: rotated.sessionId };
      }
    }
  }

  return null;
}

/**
 * Server-side authoritative route protection.
 * If unauthenticated, safely redirects to /login with original destination.
 */
export async function requireUser(currentPath?: string): Promise<UserSession> {
  const session = await getCurrentUser();

  if (!session) {
    const destination = currentPath
      ? `/login?redirectTo=${encodeURIComponent(sanitizeRedirectUrl(currentPath))}`
      : "/login";
    redirect(destination);
  }

  return session;
}
