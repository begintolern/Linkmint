// lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function buildPoolFromEnv() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const u = new URL(url);
  const isRailwayInternal = u.hostname.endsWith("railway.internal");

  // In dev, allow self-signed for external proxies (Windows quirk)
  if (process.env.NODE_ENV !== "production") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  return new pg.Pool({
    connectionString: url,
    // ✅ Inside Railway (internal host) — no TLS needed
    // ✅ Elsewhere — use TLS but don't block self-signed (dev proxies)
    ssl: isRailwayInternal ? false : { require: true, rejectUnauthorized: false },
    max: 5,
  });
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const pool = buildPoolFromEnv();
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
