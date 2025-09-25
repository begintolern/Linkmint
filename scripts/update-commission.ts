// scripts/update-commission.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CommissionStatus = "UNVERIFIED" | "PENDING" | "APPROVED" | "PAID";

function parseStatus(s: string | undefined): CommissionStatus {
  switch ((s ?? "").toUpperCase()) {
    case "APPROVED":
      return "APPROVED";
    case "PAID":
      return "PAID";
    case "PENDING":
      return "PENDING";
    case "UNVERIFIED":
      return "UNVERIFIED";
    default:
      throw new Error(
        `Invalid status "${s}". Use one of: UNVERIFIED | PENDING | APPROVED | PAID`
      );
  }
}

async function main() {
  const [, , id, statusArg] = process.argv;
  if (!id || !statusArg) {
    console.error("Usage: ts-node scripts/update-commission.ts <id> <status>");
    process.exit(1);
  }

  const status = parseStatus(statusArg);

  const updated = await prisma.commission.update({
    where: { id },
    data: { status },
    select: { id: true, amount: true, status: true, userId: true, createdAt: true },
  });

  console.log("Updated commission:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
