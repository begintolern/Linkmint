// scripts/check-referrals.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function tryList(fn, label) {
  try {
    const rows = await fn();
    console.log(`${label}:`, rows);
  } catch (e) {
    console.log(`${label}: skipped (${e.message || e})`);
  }
}

(async () => {
  try {
    await tryList(
      () =>
        prisma.user.findMany({
          select: { id: true, email: true, referredById: true, referralCode: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      "Users"
    );

    // Try common field names; if they don’t exist, the call is skipped.
    await tryList(
      () =>
        prisma.referralGroup.findMany({
          select: { id: true, createdAt: true, startedAt: true, expiresAt: true, referrerId: true },
          orderBy: { createdAt: "asc" },
        }),
      "Referral Groups"
    );

    await tryList(
      () =>
        prisma.referralBatch.findMany({
          select: { id: true, createdAt: true, expiresAt: true, inviterId: true },
          orderBy: { createdAt: "asc" },
        }),
      "Referral Batches"
    );

    await tryList(
      () =>
        prisma.referral.findMany({
          select: { id: true, inviterId: true, inviteeId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      "Referrals"
    );

    await tryList(
      () =>
        prisma.commission.findMany({
          select: { id: true, userId: true, amount: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      "Commissions (latest 10)"
    );
  } finally {
    await prisma.$disconnect();
  }
})();
