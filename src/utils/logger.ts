type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const envLevel = (process.env.LOG_LEVEL || "info") as LogLevel;
const currentLevel = levelOrder[envLevel] ? envLevel : "info";

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[currentLevel];
}

function formatMeta(meta: unknown) {
  if (!meta) {
    return "";
  }
  if (meta instanceof Error) {
    return ` | ${meta.message}`;
  }
  try {
    return ` | ${JSON.stringify(meta)}`;
  } catch {
    return "";
  }
}

function log(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) {
    return;
  }
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta)
};
