import "dotenv/config";

if (process.env.NODE_ENV === "production" || !process.env.DATABASE_URL?.includes("localhost")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { db } from "../lib/db";
import { isRedisConfigured, closeSharedRedis } from "../lib/queue/redis";
import { closeQueues } from "../lib/queue";
import { OutboxDispatcher } from "./dispatcher";
import { createVideoValidationWorker } from "./queues/video-validation-worker";
import { createAiAnalysisWorker } from "./queues/ai-analysis-worker";
import { logger } from "../lib/logger";

async function main() {
  logger.info("[Worker] Starting Simmory Background Worker & Dispatcher");

  // 1. Verify database connectivity
  try {
    await db.$queryRaw`SELECT 1`;
    logger.info("[Worker] PostgreSQL connection verified.");
  } catch (err: unknown) {
    logger.error("[Worker] Failed to connect to PostgreSQL:", { error: err });
    process.exit(1);
  }

  // 2. Check Redis configuration
  if (!isRedisConfigured()) {
    logger.warn(
      "[Worker] WARNING: REDIS_URL is not configured. Queue processing may fail until Redis is available."
    );
  }

  // 3. Start Outbox Dispatcher
  const dispatcher = new OutboxDispatcher(3000);
  dispatcher.start();

  // 4. Start BullMQ Workers
  const valConcurrency = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);
  const validationWorker = createVideoValidationWorker(valConcurrency);
  logger.info(`[Worker] Video validation worker active with concurrency=${valConcurrency}.`);

  const aiConcurrency = parseInt(process.env.AI_WORKER_CONCURRENCY || "1", 10);
  const aiWorker = createAiAnalysisWorker(aiConcurrency);
  logger.info(`[Worker] AI analysis worker active with concurrency=${aiConcurrency}.`);

  // 5. Graceful shutdown handler
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[Worker] Received ${signal}. Initiating graceful shutdown...`);

    dispatcher.stop();

    try {
      logger.info("[Worker] Closing BullMQ workers...");
      await Promise.all([
        validationWorker.close(),
        aiWorker.close(),
      ]);

      logger.info("[Worker] Closing producer queues...");
      await closeQueues();

      logger.info("[Worker] Closing Redis connections...");
      await closeSharedRedis();

      logger.info("[Worker] Disconnecting from database...");
      await db.$disconnect();

      logger.info("[Worker] Shutdown completed cleanly.");
      process.exit(0);
    } catch (err) {
      logger.error("[Worker] Error during shutdown:", { error: err });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("[Worker] Fatal startup error:", { error: err });
  process.exit(1);
});
