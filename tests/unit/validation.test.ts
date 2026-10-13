import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "@/lib/auth/schemas";
import { sanitizeRedirectUrl } from "@/lib/auth/redirect";

describe("Input Validation & Redirect Sanitization", () => {
  describe("Registration Validation Schema", () => {
    it("should accept valid registration payloads and normalize email", () => {
      const input = {
        name: "  Maria Garcia  ",
        email: "  MARIA.GARCIA@example.com  ",
        password: "SecretPassword123!",
        confirmPassword: "SecretPassword123!",
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Maria Garcia");
        expect(result.data.email).toBe("maria.garcia@example.com");
      }
    });

    it("should reject password mismatch", () => {
      const input = {
        name: "Maria Garcia",
        email: "maria@example.com",
        password: "SecretPassword123!",
        confirmPassword: "DifferentPassword123!",
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Passwords do not match");
      }
    });

    it("should reject short passwords less than 8 characters", () => {
      const input = {
        name: "Maria Garcia",
        email: "maria@example.com",
        password: "short",
        confirmPassword: "short",
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email formats", () => {
      const input = {
        name: "Maria Garcia",
        email: "not-an-email",
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Login Validation Schema", () => {
    it("should accept valid credentials and normalize email", () => {
      const input = {
        email: "  USER@EXAMPLE.COM  ",
        password: "AnyPassword123",
      };

      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should reject missing password", () => {
      const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("Password Change Schema", () => {
    it("should accept valid password change with matching confirmation", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123!",
        newPassword: "BrandNewPassword2026!",
        confirmNewPassword: "BrandNewPassword2026!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject mismatched new passwords", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123!",
        newPassword: "BrandNewPassword2026!",
        confirmNewPassword: "TypoInPassword2026!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Open Redirect Protection", () => {
    it("should allow safe relative internal paths", () => {
      expect(sanitizeRedirectUrl("/dashboard")).toBe("/dashboard");
      expect(sanitizeRedirectUrl("/kitchens")).toBe("/kitchens");
      expect(sanitizeRedirectUrl("/cook/123")).toBe("/cook/123");
      expect(sanitizeRedirectUrl("/recipes?filter=verified")).toBe("/recipes?filter=verified");
    });

    it("should neutralize open redirect attack vectors", () => {
      // External URLs
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/dashboard");
      expect(sanitizeRedirectUrl("http://evil.com/phishing")).toBe("/dashboard");
      // Protocol-relative URLs
      expect(sanitizeRedirectUrl("//evil.com")).toBe("/dashboard");
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/dashboard");
      // Javascript / data schemes
      expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/dashboard");
      expect(sanitizeRedirectUrl("/javascript:alert(1)")).toBe("/dashboard");
      // Empty, null or whitespace
      expect(sanitizeRedirectUrl(null)).toBe("/dashboard");
      expect(sanitizeRedirectUrl("   ")).toBe("/dashboard");
    });
  });
});
