import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as refreshHandler } from "@/app/api/auth/refresh/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

describe("Authentication Route Handlers Integration", () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("POST /api/auth/register should create user and set secure cookies", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Elena Rostova",
        email: "elena@example.com",
        password: "SecureFamilyPassword2026!",
        confirmPassword: "SecureFamilyPassword2026!",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.user.name).toBe("Elena Rostova");
    expect(data.user.email).toBe("elena@example.com");

    // Verify Set-Cookie headers
    const cookies = res.headers.getSetCookie();
    expect(cookies.some((c) => c.includes("simmory_access_token="))).toBe(true);
    expect(cookies.some((c) => c.includes("simmory_refresh_token="))).toBe(true);
  });

  it("POST /api/auth/register should reject duplicate emails with 409", async () => {
    const payload = {
      name: "Elena Rostova",
      email: "elena@example.com",
      password: "SecureFamilyPassword2026!",
      confirmPassword: "SecureFamilyPassword2026!",
    };

    const req1 = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify(payload),
    });
    await registerHandler(req1);

    const req2 = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify(payload),
    });
    const res2 = await registerHandler(req2);
    expect(res2.status).toBe(409);
    const data = await res2.json();
    expect(data.error).toContain("already exists");
  });

  it("POST /api/auth/login should authenticate valid user and reject invalid password", async () => {
    // 1. Register user
    const regReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Marco Silva",
        email: "marco@example.com",
        password: "CorrectPassword123!",
        confirmPassword: "CorrectPassword123!",
      }),
    });
    await registerHandler(regReq);

    // 2. Test failed login
    const badLoginReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        email: "marco@example.com",
        password: "WrongPassword456!",
      }),
    });
    const badRes = await loginHandler(badLoginReq);
    expect(badRes.status).toBe(401);

    // 3. Test successful login
    const goodLoginReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        email: "marco@example.com",
        password: "CorrectPassword123!",
      }),
    });
    const goodRes = await loginHandler(goodLoginReq);
    expect(goodRes.status).toBe(200);
    const goodData = await goodRes.json();
    expect(goodData.user.name).toBe("Marco Silva");
  });

  it("POST /api/auth/refresh should rotate valid refresh cookies", async () => {
    // Register to get initial cookies
    const regReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Sofia",
        email: "sofia@example.com",
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });
    const regRes = await registerHandler(regReq);

    // Extract refresh cookie value
    const cookies = regRes.headers.getSetCookie();
    const refreshCookie = cookies.find((c) => c.includes(`${REFRESH_COOKIE_NAME}=`));
    const tokenMatch = refreshCookie?.match(new RegExp(`${REFRESH_COOKIE_NAME}=([^;]+)`));
    const rawRefreshToken = tokenMatch ? tokenMatch[1] : "";

    expect(rawRefreshToken).toBeTruthy();

    const refreshReq = new NextRequest("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: `${REFRESH_COOKIE_NAME}=${rawRefreshToken}`,
      },
    });

    const refreshRes = await refreshHandler(refreshReq);
    expect(refreshRes.status).toBe(200);

    const newCookies = refreshRes.headers.getSetCookie();
    expect(newCookies.some((c) => c.includes(`${REFRESH_COOKIE_NAME}=`))).toBe(true);
  });

  it("POST /api/auth/logout should clear authentication cookies", async () => {
    const logoutReq = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });

    const logoutRes = await logoutHandler(logoutReq);
    expect(logoutRes.status).toBe(200);

    const cookies = logoutRes.headers.getSetCookie();
    expect(cookies.some((c) => c.includes("simmory_access_token=;"))).toBe(true);
    expect(cookies.some((c) => c.includes("simmory_refresh_token=;"))).toBe(true);
  });
});
