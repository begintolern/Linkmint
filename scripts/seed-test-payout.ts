// scripts/seed-test-payout.ts
import { prisma } from "@/lib/db";

/**
 * Usage:
 *   ts-node scripts/seed-test-payout.ts --email you@example.com --amount 12.34 [--provider PAYPAL]
 */
function arg(flag: string, args: string[]) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const [, , ...rest] = process.argv;
  const email = arg("--email", rest);
  const amountStr = arg("--amount", rest);
  const provider = (arg("--provider", rest) || "PAYPAL").toUpperCase(); // string

  if (!email || !amountStr) {
    throw new Error('Usage: --email <email> --amount <number> [--provider PAYPAL]');
  }

  const amount = Number(amountStr);
  if (!isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`User not found: ${email}`);

  // NEW-ish schema (strings): provider/statusEnum/netCents/feeCents/receiverEmail
  const netCents = Math.round(amount * 100);
  const payloadNew = {
    userId: user.id,
    provider,              // string (e.g., "PAYPAL")
    statusEnum: "PENDING", // string
    netCents,
    feeCents: 0,
    receiverEmail: email,
  };

  // OLD schema (enums/strings): amount/method/status
  const payloadOld = {
    userId: user.id,
    amount,                // number
    method: provider,      // old field name
    status: "PENDING",     // old field name
  };

  let payout: any;
  try {
    // Try NEW shape first
    payout = await prisma.payout.create({
      data: payloadNew as any,
      select: {
        id: true,
        userId: true,
        provider: true as any,
        statusEnum: true as any,
        netCents: true as any,
        feeCents: true as any,
        amount: true as any,
        method: true as any,
        status: true as any,
        createdAt: true,
      },
    } as any);
  } catch {
    // Fallback to OLD shape
    payout = await prisma.payout.create({
      data: payloadOld as any,
      select: {
        id: true,
        userId: true,
        provider: true as any,
        statusEnum: true as any,
        netCents: true as any,
        feeCents: true as any,
        amount: true as any,
        method: true as any,
        status: true as any,
        createdAt: true,
      },
    } as any);
  }

  console.log("Seeded payout:", payout);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
