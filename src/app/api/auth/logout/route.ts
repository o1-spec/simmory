import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, hashToken } from "@/lib/auth/jwt";
import { revokeSession } from "@/lib/auth/session";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookiesOnResponse,
} from "@/lib/auth/cookies";
import { validateSameOrigin } from "@/lib/auth/origin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  try {
    const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload?.sessionId) {
        await revokeSession(payload.sessionId);
      }
    } else if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const session = await db.refreshSession.findUnique({
        where: { tokenHash },
      });
      if (session) {
        await revokeSession(session.id);
      }
    }

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    logger.error("Logout error", { error });
    // Still clear cookies even if DB revocation throws
    const response = NextResponse.json(
      { message: "Logged out" },
      { status: 200 }
    );
    return clearAuthCookiesOnResponse(response);
  }
}
