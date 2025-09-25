// scripts/payout-test.ts
import { prisma } from "@/lib/db";

/**
 * Usage:
 *   ts-node scripts/payout-test.ts create  --email you@example.com --amount 12.34 [--provider PAYPAL]
 *   ts-node scripts/payout-test.ts approve --id <payoutId>
 *   ts-node scripts/payout-test.ts pay     --id <payoutId> [--txn ABC123]
 *   ts-node scripts/payout-test.ts sum     --email you@example.com
 */

async function main() {
  const [action, ...rest] = process.argv.slice(2);

  if (action === "create") {
    const email = arg("--email", rest);
    const amountStr = arg("--amount", rest);
    const provider = (arg("--provider", rest) || "PAYPAL").toUpperCase(); // "PAYPAL" | "PAYONEER"

    if (!email || !amountStr) {
      throw new Error('Usage: create --email <email> --amount <number> [--provider PAYPAL]');
    }

    const amount = Number(amountStr);
    if (!isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number.");
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`User not found: ${email}`);

    // Two possible schema shapes:
    // NEW-ish schema (strings): provider/statusEnum/netCents/feeCents/receiverEmail
    const netCents = Math.round(amount * 100);
    const payloadNew = {
      userId: user.id,
      provider,                 // string
      statusEnum: "PENDING",    // string
      netCents,
      feeCents: 0,
      receiverEmail: email,
    };

    // OLD schema (enums): amount/method/status
    const payloadOld = {
      userId: user.id,
      amount,                   // number
      method: provider,         // enum in many schemas; pass string, DB will validate
      status: "PENDING",        // enum
    };

    let payout;
    try {
      // Try NEW first
      payout = await prisma.payout.create({
        data: payloadNew as any,
        select: {
          id: true,
          userId: true,
          // select fields from either schema safely
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
      // Fallback to OLD
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

    console.log("Created payout:", payout);
    return;
  }

  if (action === "approve") {
    const id = arg("--id", rest);
    if (!id) throw new Error("Usage: approve --id <payoutId>");

    let updated;
    try {
      // NEW: statusEnum -> PROCESSING
      updated = await prisma.payout.update({
        where: { id },
        data: { statusEnum: "PROCESSING" } as any,
        select: { id: true, statusEnum: true as any, status: true as any, createdAt: true },
      } as any);
    } catch {
      // OLD: status -> PROCESSING (or APPROVED depending on your flow)
      updated = await prisma.payout.update({
        where: { id },
        data: { status: "PROCESSING" } as any,
        select: { id: true, statusEnum: true as any, status: true as any, createdAt: true },
      } as any);
    }

    console.log("Moved payout to PROCESSING:", updated);
    return;
  }

  if (action === "pay") {
    const id = arg("--id", rest);
    const txn = arg("--txn", rest) ?? null;
    if (!id) throw new Error("Usage: pay --id <payoutId> [--txn <transactionId>]");

    let updated;
    try {
      // NEW: statusEnum -> PAID
      updated = await prisma.payout.update({
        where: { id },
        data: { statusEnum: "PAID", paidAt: new Date(), transactionId: txn } as any,
        select: { id: true, statusEnum: true as any, status: true as any, paidAt: true, transactionId: true },
      } as any);
    } catch {
      // OLD: status -> PAID
      updated = await prisma.payout.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date(), transactionId: txn } as any,
        select: { id: true, statusEnum: true as any, status: true as any, paidAt: true, transactionId: true },
      } as any);
    }

    console.log("Paid payout:", updated);
    return;
  }

  if (action === "sum") {
    const email = arg("--email", rest);
    if (!email) throw new Error("Usage: sum --email <email>");

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`User not found: ${email}`);

    // Try NEW grouping, fallback to OLD
    try {
      const groups = await prisma.payout.groupBy({
        by: ["statusEnum"] as any,
        where: { userId: user.id } as any,
        _sum: { netCents: true as any },
      } as any);
      console.log("Payout sums (netCents) by statusEnum:", groups);
    } catch {
      const groups = await prisma.payout.groupBy({
        by: ["status"] as any,
        where: { userId: user.id } as any,
        _sum: { amount: true as any },
      } as any);
      console.log("Payout sums (amount) by status:", groups);
    }
    return;
  }

  throw new Error(
    "Usage:\n" +
      '  create  --email <email> --amount <number> [--provider PAYPAL]\n' +
      '  approve --id <payoutId>\n' +
      '  pay     --id <payoutId> [--txn <transactionId>]\n' +
      '  sum     --email <email>\n'
  );
}

function arg(flag: string, args: string[]) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
