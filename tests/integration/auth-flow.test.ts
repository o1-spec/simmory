import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testDb, clearTestDatabase } from "../setup";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  rotateRefreshToken,
  revokeSession,
} from "@/lib/auth/session";
import { verifyAccessToken, hashToken } from "@/lib/auth/jwt";

describe("Real PostgreSQL Database Authentication Flow", () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("should create user, hash password, and establish default kitchen in PostgreSQL", async () => {
    const rawPassword = "FamilySecretPassword2026!";
    const passwordHash = await hashPassword(rawPassword);

    const user = await testDb.user.create({
      data: {
        name: "Abuela Rosa",
        email: "rosa@garcia-kitchen.com",
        passwordHash,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("rosa@garcia-kitchen.com");
    expect(await verifyPassword(rawPassword, user.passwordHash)).toBe(true);

    // Create default kitchen & membership
    const kitchen = await testDb.kitchen.create({
      data: {
        name: "Rosa's Kitchen",
        ownerId: user.id,
      },
    });

    const member = await testDb.kitchenMember.create({
      data: {
        kitchenId: kitchen.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    expect(member.kitchenId).toBe(kitchen.id);
    expect(member.userId).toBe(user.id);
    expect(member.role).toBe("OWNER");
  });

  it("should reject duplicate email registration at the database constraint level", async () => {
    const passwordHash = await hashPassword("ValidPassword123!");

    await testDb.user.create({
      data: {
        name: "User One",
        email: "duplicate@example.com",
        passwordHash,
      },
    });

    await expect(
      testDb.user.create({
        data: {
          name: "User Two",
          email: "duplicate@example.com",
          passwordHash,
        },
      })
    ).rejects.toThrow();
  });

  it("should create a session and verify the signed access token against DB session", async () => {
    const user = await testDb.user.create({
      data: {
        name: "Maria",
        email: "maria@example.com",
        passwordHash: await hashPassword("Pass1234!"),
      },
    });

    const authResult = await createSession(user.id);

    expect(authResult.accessToken).toBeDefined();
    expect(authResult.rawRefreshToken).toBeDefined();

    // Verify token claims
    const verified = await verifyAccessToken(authResult.accessToken);
    expect(verified?.sub).toBe(user.id);
    expect(verified?.sessionId).toBe(authResult.sessionId);

    // Verify session persisted in PostgreSQL
    const sessionInDb = await testDb.refreshSession.findUnique({
      where: { id: authResult.sessionId },
    });
    expect(sessionInDb).not.toBeNull();
    expect(sessionInDb?.userId).toBe(user.id);
    expect(sessionInDb?.revokedAt).toBeNull();
    expect(sessionInDb?.tokenHash).toBe(hashToken(authResult.rawRefreshToken));
  });

  it("should rotate refresh tokens and invalidate the previous token", async () => {
    const user = await testDb.user.create({
      data: {
        name: "Carlos",
        email: "carlos@example.com",
        passwordHash: await hashPassword("Pass1234!"),
      },
    });

    // 1. Initial login
    const initialSession = await createSession(user.id);

    // 2. Rotate token
    const rotatedSession = await rotateRefreshToken(initialSession.rawRefreshToken);
    expect(rotatedSession).not.toBeNull();
    expect(rotatedSession?.rawRefreshToken).not.toBe(initialSession.rawRefreshToken);

    // Verify old session is marked as revoked in DB
    const oldSessionInDb = await testDb.refreshSession.findUnique({
      where: { id: initialSession.sessionId },
    });
    expect(oldSessionInDb?.revokedAt).not.toBeNull();
    expect(oldSessionInDb?.lastUsedAt).not.toBeNull();

    // Verify new session is active
    const newSessionInDb = await testDb.refreshSession.findUnique({
      where: { id: rotatedSession?.sessionId },
    });
    expect(newSessionInDb?.revokedAt).toBeNull();
  });

  it("should detect refresh token replay and revoke all user sessions", async () => {
    const user = await testDb.user.create({
      data: {
        name: "Replay Target",
        email: "replay@example.com",
        passwordHash: await hashPassword("Pass1234!"),
      },
    });

    // 1. Legitimate user logs in on device A
    const sessionA = await createSession(user.id);

    // 2. Legitimate user logs in on device B
    const sessionB = await createSession(user.id);
    expect(sessionB.sessionId).toBeDefined();

    // 3. User rotates token on device A
    const rotatedA = await rotateRefreshToken(sessionA.rawRefreshToken);
    expect(rotatedA).not.toBeNull();

    // 4. Attacker attempts to replay the OLD sessionA token!
    const replayAttempt = await rotateRefreshToken(sessionA.rawRefreshToken);
    expect(replayAttempt).toBeNull();

    // 5. Replay detection must revoke ALL remaining sessions for that user!
    const allSessions = await testDb.refreshSession.findMany({
      where: { userId: user.id },
    });

    for (const session of allSessions) {
      expect(session.revokedAt).not.toBeNull();
    }
  });

  it("should revoke session on logout", async () => {
    const user = await testDb.user.create({
      data: {
        name: "Logout User",
        email: "logout@example.com",
        passwordHash: await hashPassword("Pass1234!"),
      },
    });

    const session = await createSession(user.id);
    await revokeSession(session.sessionId);

    const sessionInDb = await testDb.refreshSession.findUnique({
      where: { id: session.sessionId },
    });
    expect(sessionInDb?.revokedAt).not.toBeNull();

    // Rotation after logout must fail
    const attempt = await rotateRefreshToken(session.rawRefreshToken);
    expect(attempt).toBeNull();
  });

  it("should enforce multi-user resource boundary isolation", async () => {
    const userA = await testDb.user.create({
      data: {
        name: "User A",
        email: "user.a@example.com",
        passwordHash: await hashPassword("Pass1234!"),
      },
    });

    const userB = await testDb.user.create({
      data: {
        name: "User B",
        email: "user.b@example.com",
        passwordHash: await hashPassword("Pass1234!"),
      },
    });

    // User A creates Kitchen A
    const kitchenA = await testDb.kitchen.create({
      data: {
        name: "Kitchen A",
        ownerId: userA.id,
      },
    });

    await testDb.kitchenMember.create({
      data: {
        kitchenId: kitchenA.id,
        userId: userA.id,
        role: "OWNER",
      },
    });

    // User A adds a recipe to Kitchen A
    await testDb.recipe.create({
      data: {
        kitchenId: kitchenA.id,
        createdById: userA.id,
        title: "User A Secret Recipe",
        status: "VERIFIED",
      },
    });

    // Query User B's accessible kitchens
    const userBKitchens = await testDb.kitchen.findMany({
      where: {
        members: {
          some: { userId: userB.id },
        },
      },
    });

    // User B should NOT see Kitchen A
    expect(userBKitchens.length).toBe(0);

    // Query User B's recipes
    const userBRecipes = await testDb.recipe.findMany({
      where: {
        createdById: userB.id,
      },
    });
    expect(userBRecipes.length).toBe(0);
  });
});
