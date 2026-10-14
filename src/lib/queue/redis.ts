import Redis, { RedisOptions } from "ioredis";

let sharedRedisClient: Redis | null = null;

export function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://127.0.0.1:6379";
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL || process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");
}

/**
 * Creates or returns a configured Redis client suitable for BullMQ.
 * BullMQ requires `maxRetriesPerRequest: null`.
 */
export function createRedisConnection(overrides: Partial<RedisOptions> = {}): Redis {
  const url = getRedisUrl();
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 5) {
        // Return null to stop retrying indefinitely if Redis is down
        return null;
      }
      return Math.min(times * 500, 2000);
    },
    ...overrides,
  };

  return new Redis(url, options);
}

/**
 * Returns a shared Redis connection for producer/dispatch operations.
 */
export function getSharedRedis(): Redis {
  if (!sharedRedisClient) {
    sharedRedisClient = createRedisConnection();
    sharedRedisClient.on("error", (err) => {
      // Catch and log without crashing unhandled
      console.warn("[Redis Connection Warning]:", err.message);
    });
  }
  return sharedRedisClient;
}

/**
 * Closes the shared Redis connection gracefully.
 */
export async function closeSharedRedis(): Promise<void> {
  if (sharedRedisClient) {
    await sharedRedisClient.quit().catch(() => sharedRedisClient?.disconnect());
    sharedRedisClient = null;
  }
}
