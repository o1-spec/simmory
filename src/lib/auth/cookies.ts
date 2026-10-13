import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "simmory_access_token";
export const REFRESH_COOKIE_NAME = "simmory_refresh_token";

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function getCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Sets access and refresh cookies using Next.js 16 async cookies()
 */
export async function setAuthCookies(
  accessToken: string,
  rawRefreshToken: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    ACCESS_COOKIE_NAME,
    accessToken,
    getCookieOptions(ACCESS_TOKEN_MAX_AGE)
  );
  cookieStore.set(
    REFRESH_COOKIE_NAME,
    rawRefreshToken,
    getCookieOptions(REFRESH_TOKEN_MAX_AGE)
  );
}

/**
 * Clears access and refresh cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    maxAge: 0,
  });
  cookieStore.set(REFRESH_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    maxAge: 0,
  });
}

/**
 * Helper to attach auth cookies to a NextResponse instance
 */
export function attachAuthCookiesToResponse(
  response: NextResponse,
  accessToken: string,
  rawRefreshToken: string
): NextResponse {
  response.cookies.set(
    ACCESS_COOKIE_NAME,
    accessToken,
    getCookieOptions(ACCESS_TOKEN_MAX_AGE)
  );
  response.cookies.set(
    REFRESH_COOKIE_NAME,
    rawRefreshToken,
    getCookieOptions(REFRESH_TOKEN_MAX_AGE)
  );
  return response;
}

/**
 * Helper to expire auth cookies on a NextResponse instance
 */
export function clearAuthCookiesOnResponse(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
