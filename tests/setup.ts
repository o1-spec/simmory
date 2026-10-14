import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Ensure environment variables are loaded for test runner
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "simmory_dev_super_secret_jwt_key_minimum_32_characters_long_2026";
process.env.JWT_ISSUER = process.env.JWT_ISSUER || "simmory-web";
process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || "simmory-users";
process.env.APP_URL = process.env.APP_URL || "http://localhost:3000";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://simmory:simmory_dev_secret@localhost:5433/simmory_test?schema=public";

process.env.DATABASE_URL = testDbUrl;

const pool = new Pool({ connectionString: testDbUrl });
const adapter = new PrismaPg(pool);
export const testDb = new PrismaClient({ adapter });

export async function clearTestDatabase() {
  await testDb.$executeRawUnsafe(`
    TRUNCATE TABLE "cooking_sessions", "cooking_reviews", "processing_jobs", "cooking_videos", "recipes", "kitchen_members", "kitchens", "refresh_sessions", "users" CASCADE;
  `);
}
