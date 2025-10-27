// lib/db.ts
// Force the Node.js Prisma client everywhere (NOT the Edge client).
// This prevents TLS "self-signed certificate in chain" errors when connecting
// through Railway's public proxy with Prisma on Edge.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_NODE_CLIENT__: PrismaClient | undefined;
}

export const prisma =
  global.__PRISMA_NODE_CLIENT__ ??
  new PrismaClient({
    log: ["error"], // add "query","warn" during debugging if needed
  });

// Preserve a single instance in dev to avoid hot-reload leaks
if (process.env.NODE_ENV !== "production") {
  global.__PRISMA_NODE_CLIENT__ = prisma;
}
