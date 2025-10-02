/* ts-node scripts/upsert-lazada-ph.ts
   Upserts Lazada PH by cloning the schema shape from the existing Shopee rule.
   This avoids TS/Prisma field mismatches by using the exact working keys.
*/
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function clean<T extends Record<string, any>>(obj: T) {
  const copy: Record<string, any> = {};
  for (const k of Object.keys(obj || {})) {
    const v = (obj as any)[k];
    if (v !== undefined) copy[k] = v;
  }
  return copy;
}

async function main() {
  // 1) Load a known-good record (Shopee PH) and clone its shape
  const shopee = await prisma.merchantRule.findFirst({
    where: { domainPattern: "shopee.ph" },
  });

  if (!shopee) {
    console.error(
      "Shopee PH not found. Please ensure a working Shopee record exists to clone from."
    );
    process.exit(1);
  }

  // 2) Build Lazada PH data based on Shopee’s keys (remove id/timestamps)
  const base: any = { ...shopee };
  delete base.id;
  delete base.createdAt;
  delete base.updatedAt;

  // 3) Override fields for Lazada PH
  const data: any = {
    ...base,
    active: true,
    merchantName: "Lazada PH",
    network: "Lazada Affiliate",
    domainPattern: "lazada.com.ph",
    // keep nullables as-is, ensure lastImportedAt is null for fresh start
    lastImportedAt: null,
    // tune commission baseline (can refine later by category)
    commissionRate: "0.06",
    // tag region in notes so UI can badge "PH"
    notes: "mkt:PH; allow:FB,TikTok,IG; exclude: incentivized",
  };

  // 4) Remove any undefined keys
  const payload = clean(data);

  // 5) Upsert by domainPattern or merchantName
  const existing = await prisma.merchantRule.findFirst({
    where: {
      OR: [{ domainPattern: "lazada.com.ph" }, { merchantName: "Lazada PH" }],
    },
    select: { id: true },
  });

  const result = existing
    ? await prisma.merchantRule.update({
        where: { id: existing.id },
        data: payload as any, // clone shape ensures runtime correctness
      })
    : await prisma.merchantRule.create({
        data: payload as any,
      });

  console.log(
    JSON.stringify(
      { ok: true, action: existing ? "updated" : "created", merchant: result },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
