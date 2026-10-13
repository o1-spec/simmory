import * as crypto from "node:crypto";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { env } from "@/lib/env";

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  sessionId: string;
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache the encoded secret key
const secretKey = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Sign a short-lived access JWT using jose and HS256
 */
export async function signAccessToken(payload: {
  userId: string;
  sessionId: string;
}): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ACCESS_TOKEN_TTL_SECONDS;

  return new SignJWT({
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secretKey);
}

/**
 * Verify and decode an access JWT, validating issuer, audience, and expiration
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (!payload.sub || !payload.sessionId) {
      return null;
    }

    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically secure, high-entropy opaque refresh token
 */
export function generateOpaqueRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

/**
 * Compute SHA-256 hash of a refresh token to safely store in the database
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
