import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth/session";
import {
  REFRESH_COOKIE_NAME,
  attachAuthCookiesToResponse,
  clearAuthCookiesOnResponse,
} from "@/lib/auth/cookies";
import { validateSameOrigin } from "@/lib/auth/origin";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  const rawRefreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!rawRefreshToken) {
    const response = NextResponse.json(
      { error: "Refresh token missing" },
      { status: 401 }
    );
    return clearAuthCookiesOnResponse(response);
  }

  try {
    const authResult = await rotateRefreshToken(rawRefreshToken);

    if (!authResult) {
      const response = NextResponse.json(
        { error: "Session expired or invalid" },
        { status: 401 }
      );
      return clearAuthCookiesOnResponse(response);
    }

    const response = NextResponse.json(
      { message: "Session refreshed successfully" },
      { status: 200 }
    );

    return attachAuthCookiesToResponse(
      response,
      authResult.accessToken,
      authResult.rawRefreshToken
    );
  } catch (error) {
    logger.error("Token refresh error", { error });
    const response = NextResponse.json(
      { error: "An unexpected error occurred during session refresh" },
      { status: 500 }
    );
    return clearAuthCookiesOnResponse(response);
  }
}
