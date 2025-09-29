// lib/ops/locks.ts
// Postgres advisory lock helpers (leader election)

type PrismaClientLike = {
  $queryRaw: any;
  $queryRawUnsafe: any;
};

export async function pgTryAdvisoryLock(
  prisma: PrismaClientLike,
  key: number | bigint
): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ pg_try_advisory_lock: boolean }[]>`
      SELECT pg_try_advisory_lock(${key})
    `;
    return !!rows?.[0]?.pg_try_advisory_lock;
  } catch {
    return false;
  }
}

export async function pgAdvisoryUnlock(
  prisma: PrismaClientLike,
  key: number | bigint
): Promise<void> {
  try {
    await prisma.$queryRawUnsafe(`SELECT pg_advisory_unlock(${key})`);
  } catch {
    // ignore
  }
}
