import "dotenv/config";
import { db } from "../lib/db";
import { isRedisConfigured, closeSharedRedis } from "../lib/queue/redis";
import { closeQueues } from "../lib/queue";
import { OutboxDispatcher } from "./dispatcher";
import { createVideoValidationWorker } from "./queues/video-validation-worker";
import { createAiAnalysisWorker } from "./queues/ai-analysis-worker";

async function main() {
  console.log("==========================================");
  console.log("  SIMMORY BACKGROUND WORKER & DISPATCHER  ");
  console.log("==========================================");

  // 1. Verify database connectivity
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("[Worker] PostgreSQL connection verified.");
  } catch (err: unknown) {
    console.error("[Worker] Failed to connect to PostgreSQL:", err);
    process.exit(1);
  }

  // 2. Check Redis configuration
  if (!isRedisConfigured()) {
    console.warn(
      "[Worker] WARNING: REDIS_URL is not configured. Queue processing may fail until Redis is available."
    );
  }

  // 3. Start Outbox Dispatcher
  const dispatcher = new OutboxDispatcher(3000);
  dispatcher.start();

  // 4. Start BullMQ Workers
  const valConcurrency = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);
  const validationWorker = createVideoValidationWorker(valConcurrency);
  console.log(`[Worker] Video validation worker active with concurrency=${valConcurrency}.`);

  const aiConcurrency = parseInt(process.env.AI_WORKER_CONCURRENCY || "1", 10);
  const aiWorker = createAiAnalysisWorker(aiConcurrency);
  console.log(`[Worker] AI analysis worker active with concurrency=${aiConcurrency}.`);

  // 5. Graceful shutdown handler
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Worker] Received ${signal}. Initiating graceful shutdown...`);

    dispatcher.stop();

    try {
      console.log("[Worker] Closing BullMQ workers...");
      await Promise.all([
        validationWorker.close(),
        aiWorker.close(),
      ]);

      console.log("[Worker] Closing producer queues...");
      await closeQueues();

      console.log("[Worker] Closing Redis connections...");
      await closeSharedRedis();

      console.log("[Worker] Disconnecting from database...");
      await db.$disconnect();

      console.log("[Worker] Shutdown completed cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("[Worker] Error during shutdown:", err);
      process.exit(1);
    }
  };


  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[Worker] Fatal startup error:", err);
  process.exit(1);
});
