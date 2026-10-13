import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import {
  signAccessToken,
  verifyAccessToken,
  generateOpaqueRefreshToken,
  hashToken,
} from "@/lib/auth/jwt";
import { env } from "@/lib/env";

describe("JWT & Token Utilities (jose)", () => {
  it("should sign and verify valid access tokens with required claims", async () => {
    const payload = {
      userId: "11111111-2222-3333-4444-555555555555",
      sessionId: "aaaa-bbbb-cccc-dddd",
    };

    const token = await signAccessToken(payload);
    expect(typeof token).toBe("string");

    const verified = await verifyAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(payload.userId);
    expect(verified?.sessionId).toBe(payload.sessionId);
    expect(verified?.iss).toBe(env.JWT_ISSUER);
    expect(verified?.aud).toBe(env.JWT_AUDIENCE);
  });

  it("should reject expired access tokens", async () => {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    // Create an expired token (expired 10 seconds ago)
    const expiredToken = await new SignJWT({ sessionId: "test-session" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setIssuer(env.JWT_ISSUER)
      .setAudience(env.JWT_AUDIENCE)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);

    const verified = await verifyAccessToken(expiredToken);
    expect(verified).toBeNull();
  });

  it("should reject tokens with wrong issuer or audience", async () => {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const forgedToken = await new SignJWT({ sessionId: "test-session" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setIssuer("attacker-issuer")
      .setAudience(env.JWT_AUDIENCE)
      .setExpirationTime("15m")
      .sign(secret);

    const verified = await verifyAccessToken(forgedToken);
    expect(verified).toBeNull();
  });

  it("should reject completely malformed token strings", async () => {
    expect(await verifyAccessToken("invalid.jwt.token")).toBeNull();
    expect(await verifyAccessToken("")).toBeNull();
  });

  it("should generate cryptographically strong opaque refresh tokens and hash them consistently", () => {
    const token1 = generateOpaqueRefreshToken();
    const token2 = generateOpaqueRefreshToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(40);

    const hash1a = hashToken(token1);
    const hash1b = hashToken(token1);
    const hash2 = hashToken(token2);

    expect(hash1a).toBe(hash1b);
    expect(hash1a).not.toBe(hash2);
    expect(hash1a.length).toBe(64); // SHA-256 hex length
  });
});
