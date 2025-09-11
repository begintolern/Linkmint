// scripts/seed-invitee-commission.ts
import { PrismaClient, CommissionStatus, CommissionType } from "@prisma/client";

const prisma = new PrismaClient();

function parseStatus(s: string | undefined): CommissionStatus {
  switch ((s ?? "").toUpperCase()) {
    case "APPROVED":
      return CommissionStatus.APPROVED;
    case "PAID":
      return CommissionStatus.PAID;
    case "PENDING":
      return CommissionStatus.PENDING;
    case "UNVERIFIED":
      return CommissionStatus.UNVERIFIED;
    default:
      return CommissionStatus.PENDING;
  }
}

function parseType(s: string | undefined): CommissionType {
  switch ((s ?? "").toLowerCase()) {
    case "override_bonus":
      return CommissionType.override_bonus;
    case "payout":
      return CommissionType.payout;
    case "referral_purchase":
    default:
      return CommissionType.referral_purchase;
  }
}

async function main() {
  const [, , emailArg, amountArg, statusArg, typeArg] = process.argv;

  if (!emailArg || !amountArg) {
    console.error("Usage: ts-node scripts/seed-invitee-commission.ts <email> <amount> [status] [type]");
    process.exit(1);
  }

  const amount = Number(amountArg);
  if (!isFinite(amount)) {
    console.error("Amount must be a number");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: emailArg.toLowerCase().trim() },
    select: { id: true },
  });
  if (!user) {
    console.error("User not found:", emailArg);
    process.exit(1);
  }

  const created = await prisma.commission.create({
    data: {
      userId: user.id,
      amount,
      status: parseStatus(statusArg),
      type: parseType(typeArg),
      description: "Seeded via script",
      paidOut: false,
      source: "seed-script",
    },
    select: { id: true, amount: true, status: true, type: true, userId: true, createdAt: true },
  });

  console.log("Created commission:", created);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
