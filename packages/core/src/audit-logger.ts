/**
 * Simple audit logger for Flynn.
 *
 * This utility writes structured log entries to a file in the
 * `.flynn_cache` directory. Each entry contains a timestamp, an event
 * identifier and an arbitrary details object provided by the caller. The
 * intent of this logger is to enable a lightweight audit trail of tool
 * invocations without introducing any external dependencies.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Determine the directory for audit logs. Users can override this via
// the FLYNN_CACHE_DIR environment variable to place logs elsewhere.
const cacheDir: string = process.env.FLYNN_CACHE_DIR || ".flynn_cache";
const auditFile: string = join(cacheDir, "audit.log");

/**
 * Append an audit log entry. Errors are silently ignored to avoid
 * interfering with normal tool execution. If the cache directory does
 * not exist it will be created on the first log write.
 *
 * @param event A short identifier for the event, e.g. "embed" or "analyze-project"
 * @param details Arbitrary serialisable data providing additional context
 */
export function logAudit(event: string, details: unknown): void {
  try {
    // Ensure the cache directory exists
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    // Construct a JSON record with ISO timestamp, event and details
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      details,
    });
    appendFileSync(auditFile, entry + "\n");
  } catch {
    // Swallow any filesystem errors to ensure audit logging never
    // interrupts core functionality.
  }
}