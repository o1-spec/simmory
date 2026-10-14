import { Queue, QueueOptions } from "bullmq";
import { getSharedRedis } from "./redis";

export const QUEUE_NAMES = {
  VIDEO_VALIDATION: "video-validation",
  AI_ANALYSIS: "ai-analysis", // Reserved for Phase 6
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface VideoValidationJobPayload {
  jobId: string;
  videoId: string;
  kitchenId: string;
  storageKey: string;
  expectedSize: number;
}

export interface AiAnalysisJobPayload {
  jobId: string;
  videoId: string;
  kitchenId: string;
}

let validationQueue: Queue<VideoValidationJobPayload> | null = null;

const defaultQueueOptions: Omit<QueueOptions, "connection"> = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: {
      count: 500,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 1000,
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

/**
 * Returns the BullMQ Video Validation Queue.
 * Uses lazy connection via shared Redis instance.
 */
export function getVideoValidationQueue(): Queue<VideoValidationJobPayload> {
  if (!validationQueue) {
    const connection = getSharedRedis();
    validationQueue = new Queue<VideoValidationJobPayload>(
      QUEUE_NAMES.VIDEO_VALIDATION,
      {
        ...defaultQueueOptions,
        connection,
      }
    );
  }
  return validationQueue;
}

/**
 * Closes all producer queues gracefully.
 */
export async function closeQueues(): Promise<void> {
  if (validationQueue) {
    await validationQueue.close();
    validationQueue = null;
  }
}
