import { Worker, Job } from "bullmq";
import { QUEUE_NAMES, AiAnalysisJobPayload } from "../../lib/queue";
import { createRedisConnection } from "../../lib/queue/redis";
import { processAiAnalysisJob } from "../processors/ai-analysis";
import { logger } from "../../lib/logger";

export function createAiAnalysisWorker(concurrency = 1): Worker<AiAnalysisJobPayload> {
  const connection = createRedisConnection();

  const worker = new Worker<AiAnalysisJobPayload>(
    QUEUE_NAMES.AI_ANALYSIS,
    async (job: Job<AiAnalysisJobPayload>) => {
      logger.info(`[Worker] Received AI Analysis job ${job.id} for videoId: ${job.data.videoId}`);
      const result = await processAiAnalysisJob(job);
      return result;
    },
    {
      connection,
      concurrency,
      lockDuration: 180000,
      stalledInterval: 60000,
      maxStalledCount: 2,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`[Worker] AI Analysis Job ${job?.id} failed:`, { error: err.message });
  });

  worker.on("error", (err) => {
    logger.error("[Worker] BullMQ AI Analysis Worker error:", { error: err.message });
  });

  worker.on("stalled", (jobId) => {
    logger.warn(`[Worker] AI Analysis Job ${jobId} stalled, recovering.`);
  });

  return worker;
}
