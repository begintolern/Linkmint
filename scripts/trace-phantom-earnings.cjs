// scripts/trace-phantom-earnings.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    // 1) Recent commissions + all with amount=14.75
    const [recent, fourteen] = await Promise.all([
      prisma.commission.findMany({
        select: { id: true, userId: true, amount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.commission.findMany({
        where: { amount: 14.75 },
        select: { id: true, userId: true, amount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    // 2) Build user map
    const ids = Array.from(new Set([...recent, ...fourteen].map(r => r.userId).filter(Boolean)));
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, createdAt: true },
    });
    const uMap = new Map(users.map(u => [u.id, u]));

    // 3) Pretty print rows with email
    const fmt = r => ({
      ...r,
      userEmail: r.userId ? (uMap.get(r.userId)?.email || "(unknown)") : "(no userId)",
      userCreatedAt: r.userId ? (uMap.get(r.userId)?.createdAt || null) : null,
    });

    console.log("\n=== RECENT COMMISSIONS (50) ===");
    console.log(recent.map(fmt));

    console.log("\n=== COMMISSIONS WITH amount == 14.75 ===");
    console.log(fourteen.map(fmt));

    // 4) Totals by user
    const totals = {};
    for (const r of [...recent, ...fourteen]) {
      const key = r.userId || "(no userId)";
      totals[key] = (totals[key] || 0) + Number(r.amount || 0);
    }
    const totalsPretty = Object.entries(totals).map(([k, v]) => ({
      userId: k,
      email: k !== "(no userId)" ? (uMap.get(k)?.email || "(unknown)") : "(no userId)",
      total: v,
    }));
    console.log("\n=== TOTALS (by userId) ===");
    console.log(totalsPretty);
  } catch (e) {
    console.error("❌ Trace failed:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
})();
