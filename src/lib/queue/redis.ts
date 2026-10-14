import Redis, { RedisOptions } from "ioredis";
import { logger } from "../logger";

let sharedRedisClient: Redis | null = null;

export function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://127.0.0.1:6379";
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL || process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");
}

export function createRedisConnection(overrides: Partial<RedisOptions> = {}): Redis {
  const url = getRedisUrl();
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 500, 2000);
    },
    ...overrides,
  };

  return new Redis(url, options);
}

export function getSharedRedis(): Redis {
  if (!sharedRedisClient) {
    sharedRedisClient = createRedisConnection();
    sharedRedisClient.on("error", (err) => {
      logger.warn("[Redis Connection Warning]", { error: err.message });
    });
  }
  return sharedRedisClient;
}

export async function closeSharedRedis(): Promise<void> {
  if (sharedRedisClient) {
    try {
      await sharedRedisClient.quit();
    } catch {
      sharedRedisClient.disconnect();
    } finally {
      sharedRedisClient = null;
    }
  }
}
