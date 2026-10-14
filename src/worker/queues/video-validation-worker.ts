import { Worker, Job } from "bullmq";
import { QUEUE_NAMES, VideoValidationJobPayload } from "../../lib/queue";
import { createRedisConnection } from "../../lib/queue/redis";
import { processVideoValidationJob } from "../processors/video-validation";

export function createVideoValidationWorker(concurrency = 2): Worker<VideoValidationJobPayload> {
  const connection = createRedisConnection();

  const worker = new Worker<VideoValidationJobPayload>(
    QUEUE_NAMES.VIDEO_VALIDATION,
    async (job: Job<VideoValidationJobPayload>) => {
      console.log(`[Worker] Starting video validation for job ${job.id} (videoId: ${job.data.videoId})`);
      const result = await processVideoValidationJob(job.data);
      console.log(`[Worker] Validation succeeded for job ${job.id}:`, {
        duration: result.duration,
        codec: result.videoCodec,
        resolution: `${result.width}x${result.height}`,
      });
      return result;
    },
    {
      connection,
      concurrency,
      lockDuration: 30000,
      stalledInterval: 30000,
      maxStalledCount: 2,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] BullMQ Worker error:", err.message);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Worker] Job ${jobId} stalled, recovering.`);
  });

  return worker;
}
