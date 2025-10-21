// lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// In dev, relax Node's TLS checks (Windows quirk). Prod stays strict unless we explicitly set ssl:false.
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function buildPoolFromEnv() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const host = new URL(url).hostname;
  const isRailwayInternal = host.endsWith("railway.internal");

  return new pg.Pool({
    connectionString: url,
    // ✅ Internal Railway DB doesn’t need TLS over the private network
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
