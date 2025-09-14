// scripts/seed-merchants-regions.cjs
/* eslint-disable no-console */
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureAmazonUSGreyed() {
  const name = 'Amazon US';
  const existing = await prisma.merchantRule.findFirst({ where: { merchantName: name } });

  if (existing) {
    console.log('▶ Updating existing Amazon US → greyed, US-only');
    await prisma.merchantRule.update({
      where: { id: existing.id },
      data: {
        active: false,
        status: 'PENDING',
        allowedRegions: ['US'],
        inactiveReason: 'Rejected (low traffic). Re-apply at 100 active sharers.',
        network: existing.network ?? 'Amazon',
        domainPattern: existing.domainPattern ?? 'amazon.com',
        commissionType: existing.commissionType ?? 'PERCENT',
        commissionRate: existing.commissionRate ?? new Prisma.Decimal(0.03),
        cookieWindowDays: existing.cookieWindowDays ?? 24,
      },
    });
  } else {
    console.log('▶ Creating Amazon US → greyed, US-only');
    await prisma.merchantRule.create({
      data: {
        active: false,
        merchantName: name,
        network: 'Amazon',
        domainPattern: 'amazon.com',
        commissionType: 'PERCENT',
        commissionRate: new Prisma.Decimal(0.03),
        cookieWindowDays: 24,
        status: 'PENDING',
        notes: 'Amazon US program placeholder. Greyed until approval.',
        allowedRegions: ['US'],
        inactiveReason: 'Rejected (low traffic). Re-apply at 100 active sharers.',
      },
    });
  }
}

async function ensureLenovoGlobal() {
  const name = 'Lenovo';
  const existing = await prisma.merchantRule.findFirst({ where: { merchantName: name } });

  if (existing) {
    console.log('▶ Updating Lenovo → Global, approved');
    await prisma.merchantRule.update({
      where: { id: existing.id },
      data: {
        network: existing.network ?? 'Rakuten',
        domainPattern: existing.domainPattern ?? 'lenovo.com',
        commissionType: existing.commissionType ?? 'PERCENT',
        commissionRate: existing.commissionRate ?? new Prisma.Decimal(0.05),
        cookieWindowDays: existing.cookieWindowDays ?? 30,
        allowedRegions: ['Global'],
        active: true,
        status: 'APPROVED',
        notes: existing.notes ?? 'Example global-friendly merchant.',
      },
    });
  } else {
    console.log('▶ Creating Lenovo → Global, approved');
    await prisma.merchantRule.create({
      data: {
        active: true,
        merchantName: name,
        network: 'Rakuten',
        domainPattern: 'lenovo.com',
        commissionType: 'PERCENT',
        commissionRate: new Prisma.Decimal(0.05),
        cookieWindowDays: 30,
        allowedRegions: ['Global'],
        status: 'APPROVED',
        notes: 'Example global-friendly merchant.',
      },
    });
  }
}

async function main() {
  console.log('▶ Normalizing existing MerchantRule.allowedRegions (set to ["Global"] where NULL)…');
  const normalized = await prisma.$executeRawUnsafe(`
    UPDATE "MerchantRule"
    SET "allowedRegions" = ARRAY['Global']::text[]
    WHERE "allowedRegions" IS NULL
  `);
  console.log(`   Updated rows: ${normalized}`);

  await ensureAmazonUSGreyed();
  await ensureLenovoGlobal();

  console.log('✅ Done.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
