import { describe, it, expect } from "vitest";
import { QUEUE_NAMES, getVideoValidationQueue } from "@/lib/queue";
import { createRedisConnection, isRedisConfigured, getRedisUrl } from "@/lib/queue/redis";

describe("BullMQ & Redis Queue Configuration Unit Tests", () => {
  it("should define distinct queue names for video validation and AI analysis", () => {
    expect(QUEUE_NAMES.VIDEO_VALIDATION).toBe("video-validation");
    expect(QUEUE_NAMES.AI_ANALYSIS).toBe("ai-analysis");
  });

  it("should configure Redis client with maxRetriesPerRequest: null required by BullMQ", () => {
    const client = createRedisConnection();
    expect(client.options.maxRetriesPerRequest).toBeNull();
    expect(client.options.enableReadyCheck).toBe(false);
    expect(client.options.lazyConnect).toBe(true);
    client.disconnect();
  });

  it("should detect redis configuration based on REDIS_URL or environment", () => {
    expect(isRedisConfigured()).toBe(true);
    expect(getRedisUrl()).toBeDefined();
  });

  it("should instantiate VideoValidationQueue with default retry and retention options", () => {
    const queue = getVideoValidationQueue();
    expect(queue.name).toBe("video-validation");
    expect(queue.defaultJobOptions.attempts).toBe(3);
    expect(queue.defaultJobOptions.backoff).toEqual({
      type: "exponential",
      delay: 3000,
    });
    expect(queue.defaultJobOptions.removeOnComplete).toBeDefined();
    expect(queue.defaultJobOptions.removeOnFail).toBeDefined();
  });
});
