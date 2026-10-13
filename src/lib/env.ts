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
