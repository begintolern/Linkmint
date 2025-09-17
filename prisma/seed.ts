import {
  PrismaClient,
  CommissionCalc,
  ImportMethod,
  CommissionStatus,
  CommissionType,
} from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/** ---------- helpers ---------- */
function toCommissionCalc(value?: string | null): CommissionCalc {
  if (!value) return CommissionCalc.PERCENT;
  const maybe = (CommissionCalc as any)[value as keyof typeof CommissionCalc];
  return maybe ?? CommissionCalc.PERCENT;
}

/** ---------- section 1: seed admin + sample commissions ---------- */
async function seedAdminAndCommissions() {
  const email = "ertorig3@gmail.com"; // Updated email

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: null,
      role: "ADMIN",
      trustScore: 80,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true },
  });

  // Sample rows using ENUMS (not strings)
  const sampleRows: Array<{ amount: number; type: CommissionType; status: CommissionStatus }> = [
    { amount: 3.5,  type: CommissionType.referral_purchase, status: CommissionStatus.APPROVED },
    { amount: 4.25, type: CommissionType.referral_purchase, status: CommissionStatus.APPROVED },
    { amount: 2.0,  type: CommissionType.referral_purchase, status: CommissionStatus.PENDING  },
  ];

  // Only insert if there are no approved+unpaid commissions yet
  const existing = await prisma.commission.count({
    where: { userId: user.id, status: CommissionStatus.APPROVED, paidOut: false },
  });

  let createdCount = 0;
  if (existing === 0) {
    await prisma.$transaction(
      sampleRows.map((r) =>
        prisma.commission.create({
          data: {
            userId: user.id,
            amount: r.amount,
            type: r.type,
            status: r.status,
            paidOut: false,
            description: "Seed commission",
            source: "seed",
          },
        })
      )
    );
    createdCount = sampleRows.length;
  }

  console.log("✅ Seeded commissions for:", user.email);
  return { userEmail: user.email, createdCount };
}

/** ---------- section 2: seed merchant rules from JSON ---------- */
async function seedMerchantRulesFromJson() {
  const dataPath = path.join(__dirname, "data", "merchantRules.json");
  if (!fs.existsSync(dataPath)) {
    console.warn("⚠️ merchantRules.json not found at prisma/data/, skipping merchants.");
    return { upserted: 0 };
  }

  type MerchantJson = {
    active?: boolean;
    merchantName: string;
    network?: string | null;
    domainPattern?: string | null;
    paramKey?: string | null;
    paramValue?: string | null;
    linkTemplate?: string | null;
    allowedSources?: any;
    disallowed?: any;
    cookieWindowDays?: number | null;
    payoutDelayDays?: number | null;
    commissionType?: string | null;
    commissionRate?: number | null;
    calc?: string | null;
    rate?: number | null;
    notes?: string | null;
    importMethod?: string | null;
    apiBaseUrl?: string | null;
    apiAuthType?: string | null;
    apiKeyRef?: string | null;
    lastImportedAt?: string | null;
  };

  const raw = fs.readFileSync(dataPath, "utf-8");
  const items: MerchantJson[] = JSON.parse(raw);

  let count = 0;

  for (const m of items) {
    const merchantName = m.merchantName?.trim();
    if (!merchantName) continue;

    const existing = await prisma.merchantRule.findFirst({
      where: { merchantName },
      select: { id: true },
    });

    const payload = {
      active: m.active ?? true,
      merchantName,
      network: m.network ?? undefined,
      domainPattern: m.domainPattern ?? undefined,
      paramKey: m.paramKey ?? undefined,
      paramValue: m.paramValue ?? undefined,
      linkTemplate: m.linkTemplate ?? undefined,
      allowedSources: m.allowedSources ?? undefined,
      disallowed: m.disallowed ?? undefined,
      cookieWindowDays: m.cookieWindowDays ?? undefined,
      payoutDelayDays: m.payoutDelayDays ?? undefined,
      commissionType: toCommissionCalc(m.commissionType ?? undefined),
      commissionRate: m.commissionRate ?? undefined,
      calc: m.calc ?? undefined,
      rate: m.rate ?? undefined,
      notes: m.notes ?? undefined,
      importMethod: ImportMethod.MANUAL,
      apiBaseUrl: m.apiBaseUrl ?? undefined,
      apiAuthType: m.apiAuthType ?? undefined,
      apiKeyRef: m.apiKeyRef ?? undefined,
      lastImportedAt: m.lastImportedAt ? new Date(m.lastImportedAt) : undefined,
    };

    if (existing) {
      await prisma.merchantRule.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.merchantRule.create({ data: payload });
    }

    count++;
  }

  console.log(`✅ Merchant rules upserted: ${count}`);
  return { upserted: count };
}

/** ---------- section 3: seed bonus ---------- */
async function seedBonus(userEmail: string) {
  // Find the user by email to ensure they're valid
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log(`⚠️ No user found with email ${userEmail}`);
    return;
  }

  // Set a bonus of $5.00 (500 bonusCents) for the user with a 30-day expiration
  await prisma.user.update({
    where: { id: user.id },
    data: {
      bonusCents: 500, // $5.00
      bonusEligibleUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      bonusTier: 1,
    },
  });

  console.log("✅ Bonus set for user:", user.email);
}

/** ---------- run ---------- */
async function main() {
  const c = await seedAdminAndCommissions();
  const m = await seedMerchantRulesFromJson();
  await seedBonus(c.userEmail); // Now use the correct email to seed bonus

  console.log("✅ Seeding complete!");
  console.log(`   User: ${c.userEmail}`);
  console.log(`   Commissions created: ${c.createdCount}`);
  console.log(`   Merchant rules upserted: ${m.upserted}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
