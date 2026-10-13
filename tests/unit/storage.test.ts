import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isStorageConfigured,
  getStorageConfig,
  getMaxVideoSizeBytes,
  StorageNotConfiguredError,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_VIDEO_EXTENSIONS,
} from "@/lib/storage/r2";
import { initiateVideoUploadSchema } from "@/lib/validations/video";

describe("Storage Abstraction & Validation Unit Tests", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isStorageConfigured()", () => {
    it("should return false when environment variables are missing", () => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.R2_BUCKET_NAME;
      delete process.env.R2_ACCOUNT_ID;

      expect(isStorageConfigured()).toBe(false);
    });

    it("should return false when placeholder template credentials are present", () => {
      process.env.R2_ACCESS_KEY_ID = "your_r2_access_key_id";
      process.env.R2_SECRET_ACCESS_KEY = "your_r2_secret_access_key";
      process.env.R2_BUCKET_NAME = "simmory-videos-dev";
      process.env.R2_ACCOUNT_ID = "your_cloudflare_account_id";

      expect(isStorageConfigured()).toBe(false);
    });

    it("should return true when valid credentials and account ID are provided", () => {
      process.env.R2_ACCESS_KEY_ID = "test-access-key-12345";
      process.env.R2_SECRET_ACCESS_KEY = "test-secret-key-67890";
      process.env.R2_BUCKET_NAME = "family-media";
      process.env.R2_ACCOUNT_ID = "acc-cloudflare-123";

      expect(isStorageConfigured()).toBe(true);
    });

    it("should return true when valid credentials and custom endpoint are provided", () => {
      process.env.R2_ACCESS_KEY_ID = "minio-access-key";
      process.env.R2_SECRET_ACCESS_KEY = "minio-secret-key";
      process.env.R2_BUCKET_NAME = "local-bucket";
      process.env.R2_ENDPOINT = "http://localhost:9000";

      expect(isStorageConfigured()).toBe(true);
    });
  });

  describe("getStorageConfig()", () => {
    it("should throw StorageNotConfiguredError when storage is not configured", () => {
      delete process.env.R2_ACCESS_KEY_ID;

      expect(() => getStorageConfig()).toThrow(StorageNotConfiguredError);
    });

    it("should return normalized configuration when credentials are valid", () => {
      process.env.R2_ACCESS_KEY_ID = "valid-key";
      process.env.R2_SECRET_ACCESS_KEY = "valid-secret";
      process.env.R2_BUCKET_NAME = "my-bucket";
      process.env.R2_ACCOUNT_ID = "acc123";

      const config = getStorageConfig();
      expect(config.bucket).toBe("my-bucket");
      expect(config.endpoint).toBe("https://acc123.r2.cloudflarestorage.com");
      expect(config.accessKeyId).toBe("valid-key");
      expect(config.secretAccessKey).toBe("valid-secret");
    });
  });

  describe("File limits and MIME constraints", () => {
    it("should default max video size to 250 MB", () => {
      delete process.env.MAX_VIDEO_SIZE_MB;
      expect(getMaxVideoSizeBytes()).toBe(250 * 1024 * 1024);
    });

    it("should allow configuring max video size via MAX_VIDEO_SIZE_MB", () => {
      process.env.MAX_VIDEO_SIZE_MB = "100";
      expect(getMaxVideoSizeBytes()).toBe(100 * 1024 * 1024);
    });

    it("should support MP4, QuickTime (MOV), and WebM formats", () => {
      expect(ALLOWED_VIDEO_MIME_TYPES).toContain("video/mp4");
      expect(ALLOWED_VIDEO_MIME_TYPES).toContain("video/quicktime");
      expect(ALLOWED_VIDEO_MIME_TYPES).toContain("video/webm");
      expect(ALLOWED_VIDEO_EXTENSIONS).toContain(".mp4");
      expect(ALLOWED_VIDEO_EXTENSIONS).toContain(".mov");
      expect(ALLOWED_VIDEO_EXTENSIONS).toContain(".webm");
    });
  });

  describe("initiateVideoUploadSchema validation", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";

    it("should validate valid video upload parameters", () => {
      const valid = {
        kitchenId: validUuid,
        originalFilename: "grandma_sofrito_prep.mp4",
        contentType: "video/mp4",
        fileSize: 50 * 1024 * 1024, // 50MB
      };

      const result = initiateVideoUploadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject disallowed extensions (.exe, .txt, .avi)", () => {
      const invalid = {
        kitchenId: validUuid,
        originalFilename: "malicious_script.exe",
        contentType: "video/mp4",
        fileSize: 1024,
      };

      const result = initiateVideoUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject unsupported MIME types", () => {
      const invalid = {
        kitchenId: validUuid,
        originalFilename: "clip.mp4",
        contentType: "application/octet-stream",
        fileSize: 1024,
      };

      const result = initiateVideoUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject file sizes exceeding the configured maximum", () => {
      const invalid = {
        kitchenId: validUuid,
        originalFilename: "huge_raw_recording.mov",
        contentType: "video/quicktime",
        fileSize: 300 * 1024 * 1024, // 300MB exceeds 250MB limit
      };

      const result = initiateVideoUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
