import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password Hashing & Verification (Argon2id)", () => {
  it("should securely hash passwords and verify them correctly", async () => {
    const raw = "GrandmaRecipe2026!Secret";
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$argon2id$")).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);
  });

  it("should reject incorrect passwords", async () => {
    const raw = "CorrectPassword123!";
    const hash = await hashPassword(raw);

    const isMatch = await verifyPassword("WrongPassword456!", hash);
    expect(isMatch).toBe(false);
  });

  it("should gracefully handle malformed hash strings without throwing", async () => {
    const isMatch = await verifyPassword("anyPassword", "not_a_valid_hash");
    expect(isMatch).toBe(false);
  });
});
