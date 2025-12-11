/**
 * Structured logging with pino
 */

import pino from "pino";

const level = process.env.FLYNN_LOG_LEVEL || process.env.LOG_LEVEL || "info";

export const logger = pino(
  {
    name: "flynn",
    level,
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              destination: 2, // stderr
            },
          }
        : undefined,
  },
  pino.destination(2),
); // stderr for production too

/**
 * Create a child logger with additional context
 */
export function createLogger(name: string, context?: Record<string, unknown>) {
  return logger.child({ module: name, ...context });
}
