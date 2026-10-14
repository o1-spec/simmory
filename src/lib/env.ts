import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long for security"),
  JWT_ISSUER: z.string().default("simmory-web"),
  JWT_AUDIENCE: z.string().default("simmory-users"),
  APP_URL: z.string().url("APP_URL must be a valid URL").default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  MAX_VIDEO_SIZE_MB: z.string().default("250"),
  REDIS_URL: z.string().optional(),
  WORKER_CONCURRENCY: z.string().default("2"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  MAX_MEDIA_DURATION_SECONDS: z.string().default("3600"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`Environment variable validation error:\n${errorDetails}`);
  }
  return result.data;
}

export const env = validateEnv();
