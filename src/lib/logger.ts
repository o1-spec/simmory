type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "refreshtoken",
  "accesstoken",
  "secret",
  "jwt",
  "authorization",
  "cookie",
  "apikey",
  "key",
  "presignedurl",
  "signedurl",
  "playbackurl",
  "transcript",
]);

function redact(data: unknown, depth = 0): unknown {
  if (depth > 4) return "[DeepObject]";
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => redact(item, depth + 1));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === "production" ? undefined : data.stack,
    };
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes("secret") ||
      lowerKey.includes("password") ||
      lowerKey.includes("token")
    ) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = redact(val, depth + 1);
    }
  }
  return sanitized;
}

function writeLog(level: LogLevel, message: string, context?: unknown) {
  const entry = {
    level,
    message,
    ...(context !== undefined ? { context: redact(context) } : {}),
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(entry) + "\n";
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  debug(message: string, context?: unknown) {
    if (process.env.NODE_ENV !== "production" && process.env.DEBUG === "true") {
      writeLog("debug", message, context);
    }
  },
  info(message: string, context?: unknown) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: unknown) {
    writeLog("warn", message, context);
  },
  error(message: string, context?: unknown) {
    writeLog("error", message, context);
  },
};
