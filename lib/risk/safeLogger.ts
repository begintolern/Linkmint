// lib/risk/safeLogger.ts

/**
 * SAFE risk event logger.
 *
 * This logger NEVER throws and will NEVER break business logic.
 * It attempts to write logs to a server-side file, but if file I/O
 * is restricted on the server (Railway), it silently skips.
 */

export async function logRiskEvent(event: {
  userId?: string | null;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  details?: Record<string, unknown>;
}) {
  try {
    // The log format (simple + future-proof)
    const time = new Date().toISOString();
    const entry = JSON.stringify({ time, ...event }) + "\n";

    // Dynamically import fs so it only loads server-side
    const fs = await import("fs");
    const path = "/app/risk-log.txt"; // Writable on local dev; safe on Railway

    fs.appendFile(path, entry, (err) => {
      if (err) {
        // If FS doesn't work (e.g., Railway ephemeral FS), silently fail
      }
    });
  } catch {
    // Hard fail is never allowed — swallow errors
  }
}
