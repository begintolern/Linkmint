// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Ensure value maps to valid commission type (if you ever need it later) */
function toCommissionType(value?: string | null): "PERCENT" | "FIXED" | null {
  if (!value) return null;
  const s = value.trim().toUpperCase();
  if (s === "PERCENT" || s === "FIXED") return s;
  return "PERCENT";
}

/** ---------- SECTION 1: seed admin + sample commissions ---------- */
async function seedAdminAndCommissions() {
  const email = "ertorig3@gmail.com"; // admin email

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: null,
      role: "ADMIN",
      trustScore: 80,
    },
  });

  const sampleRows: Array<{ amount: number; type: string; status: string }> = [
    { amount: 3.5, type: "referral_purchase", status: "APPROVED" },
    { amount: 4.25, type: "referral_purchase", status: "APPROVED" },
    { amount: 2.0, type: "referral_purchase", status: "PENDING" },
  ];

  const existing = await prisma.commission.count();
  if (existing === 0) {
    for (const row of sampleRows) {
      await prisma.commission.create({
        data: {
          userId: user.id,
          amount: row.amount,
          type: row.type as any,
          status: row.status as any,
        },
      });
    }
  }
}

/** ---------- MAIN ---------- */
async function main() {
  console.log("🌱 Starting seed...");
  await seedAdminAndCommissions();
  console.log("🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
