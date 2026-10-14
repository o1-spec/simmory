import { Worker, Job } from "bullmq";
import { QUEUE_NAMES, AiAnalysisJobPayload } from "../../lib/queue";
import { createRedisConnection } from "../../lib/queue/redis";
import { processAiAnalysisJob } from "../processors/ai-analysis";

export function createAiAnalysisWorker(concurrency = 1): Worker<AiAnalysisJobPayload> {
  const connection = createRedisConnection();

  const worker = new Worker<AiAnalysisJobPayload>(
    QUEUE_NAMES.AI_ANALYSIS,
    async (job: Job<AiAnalysisJobPayload>) => {
      console.log(`[Worker] Received AI Analysis job ${job.id} for videoId: ${job.data.videoId}`);
      const result = await processAiAnalysisJob(job);
      return result;
    },
    {
      connection,
      concurrency,
      lockDuration: 180000, // 3 minutes lock duration for ML inference
      stalledInterval: 60000,
      maxStalledCount: 2,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] AI Analysis Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] BullMQ AI Analysis Worker error:", err.message);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Worker] AI Analysis Job ${jobId} stalled, recovering.`);
  });

  return worker;
}
