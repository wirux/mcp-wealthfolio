import type { Logger } from "../domain/ports/logger.js";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const SENSITIVE_KEYS = /^(password|cookie|token|secret|authorization)$/i;

function redact(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.test(key)) {
      result[key] = "[REDACTED]";
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redact(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export class ConsoleLogger implements Logger {
  private readonly minRank: number;

  constructor(logLevel: LogLevel) {
    this.minRank = LEVEL_RANK[logLevel];
  }

  private emit(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < this.minRank) return;
    const redacted = data !== undefined ? redact(data) : undefined;
    const suffix = redacted !== undefined ? ` ${JSON.stringify(redacted)}` : "";
    console.error(`[${level.toUpperCase()}] ${message}${suffix}`);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.emit("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.emit("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.emit("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.emit("error", message, data);
  }
}
