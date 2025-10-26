// lib/detectors/selfPurchase.ts
import type { PrismaClient } from "@prisma/client";

export type SelfPurchaseFinding = {
  userId: string;
  type: "SELF_PURCHASE";
  message: string;
  evidence: {
    buyerEmail: string;
    userEmail: string;
    sampleOrderIds: string[];
    count: number;
  };
  createdAt: string;
};

const TABLE_CANDIDATES = [
  "Conversion",
  "Conversions",
  "Order",
  "Orders",
  "Purchase",
  "Purchases",
] as const;

const BUYER_EMAIL_COLS = [
  "buyerEmail",
  "buyer_email",
  "customerEmail",
  "customer_email",
  "orderEmail",
  "order_email",
  "email",
] as const;

const ORDER_ID_COLS = ["id", "orderId", "order_id"] as const;

const USER_EMAIL_COLS = ["email", "primaryEmail", "primary_email"] as const;

type ColRow = { table_name: string; column_name: string };

async function existingCols(
  prisma: PrismaClient,
  tableNames: readonly string[],
  colNames: readonly string[]
): Promise<ColRow[]> {
  const rows = await prisma.$queryRawUnsafe<ColRow[]>(
    `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
      AND column_name = ANY($2::text[])
  `,
    tableNames as unknown as string[],
    colNames as unknown as string[]
  );
  return rows;
}

export async function detectSelfPurchase(
  prisma: PrismaClient,
  {
    lookbackDays = 90,
    maxRows = 20000,
    minHits = 1,
    maxSampleIds = 20,
  }: { lookbackDays?: number; maxRows?: number; minHits?: number; maxSampleIds?: number } = {}
): Promise<SelfPurchaseFinding[]> {
  // 1) find a conversions/orders table with a buyerEmail-like column
  const buyerCols = await existingCols(prisma, TABLE_CANDIDATES, BUYER_EMAIL_COLS);
  if (buyerCols.length === 0) return [];

  const targetTable = buyerCols[0].table_name;
  const buyerEmailCol = buyerCols[0].column_name;

  // 2) find an order id column
  const orderIdCols = await existingCols(prisma, [targetTable], ORDER_ID_COLS);
  const orderIdCol = orderIdCols[0]?.column_name ?? "id";

  // 3) try to find a createdAt-ish column for lookback
  const createdCols = await existingCols(prisma, [targetTable], [
    "createdAt",
    "created_at",
    "timestamp",
    "orderedAt",
    "ordered_at",
  ]);
  const createdCol = createdCols[0]?.column_name;

  const whereDate =
    createdCol ? `WHERE "${createdCol}" >= NOW() - INTERVAL '${Number(lookbackDays)} days'` : "";

  type ConvRow = { oid: string | null; bemail: string | null };
  const convRows = await prisma.$queryRawUnsafe<ConvRow[]>(
    `
    SELECT "${orderIdCol}"::text AS oid, lower("${buyerEmailCol}") AS bemail
    FROM "${targetTable}"
    ${whereDate}
    LIMIT ${Number(maxRows) || 20000}
  `
  );

  const buyerToOrders = new Map<string, string[]>();
  for (const r of convRows) {
    const em = (r.bemail || "").trim();
    if (!em) continue;
    const arr = buyerToOrders.get(em) ?? [];
    if (r.oid) arr.push(r.oid);
    buyerToOrders.set(em, arr);
  }
  if (buyerToOrders.size === 0) return [];

  // 4) pull user emails
  const userEmailCols = await existingCols(prisma, ["User"], USER_EMAIL_COLS);
  const userEmailCol = userEmailCols[0]?.column_name ?? "email";

  type UserRow = { uid: string; uemail: string | null };
  const userRows = await prisma.$queryRawUnsafe<UserRow[]>(
    `
    SELECT id::text AS uid, lower("${userEmailCol}") AS uemail
    FROM "User"
    WHERE "${userEmailCol}" IS NOT NULL
    LIMIT 200000
  `
  );

  // 5) match overlaps
  const findings: SelfPurchaseFinding[] = [];
  const now = new Date().toISOString();

  for (const u of userRows) {
    const uem = (u.uemail || "").trim();
    if (!uem) continue;
    const orders = buyerToOrders.get(uem);
    if (orders && orders.length >= minHits) {
      findings.push({
        userId: u.uid,
        type: "SELF_PURCHASE",
        message: `Buyer email matches user email (${orders.length} hit${orders.length > 1 ? "s" : ""}).`,
        evidence: {
          buyerEmail: uem,
          userEmail: uem,
          sampleOrderIds: orders.slice(0, maxSampleIds),
          count: orders.length,
        },
        createdAt: now,
      });
    }
  }

  return findings;
}
