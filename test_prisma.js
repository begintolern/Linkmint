'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1) Create a user (unique email each run)
  const email = 'test+' + Date.now() + '@example.com';
  const user = await prisma.user.create({
    data: {
      email: email,
      name: 'Smoke Test',
      bonusCents: 1234,
      bonusTier: 2,
      bonusEligibleUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
    },
    select: { id: true, email: true, bonusCents: true, bonusTier: true, bonusEligibleUntil: true },
  });

  // 2) Create a MerchantRule (minimal)
  const merchant = await prisma.merchantRule.create({
    data: {
      merchantName: 'SmokeShop',
      active: true,
      status: 'ACTIVE',
      allowedRegions: [],
      importMethod: 'MANUAL',
      commissionType: 'PERCENT',
      rate: 10.5,
    },
    select: { id: true, merchantName: true, rate: true },
  });

  // 3) Create a SmartLink for that user (optionally link merchant)
  const link = await prisma.smartLink.create({
    data: {
      userId: user.id,
      merchantRuleId: merchant.id,
      merchantName: merchant.merchantName,
      originalUrl: 'https://example.com/product/123',
      shortUrl: 'https://lnk.mnt/smoke',
    },
    select: { id: true, userId: true, merchantRuleId: true, shortUrl: true },
  });

  // 4) Read back counts + a couple fields
  const userCount = await prisma.user.count();
  const commissionCount = await prisma.commission.count();
  const smartLinkCount = await prisma.smartLink.count();

  console.log('USER:', user);
  console.log('MERCHANT:', merchant);
  console.log('SMARTLINK:', link);
  console.log('COUNTS => users:', userCount, 'commissions:', commissionCount, 'smartLinks:', smartLinkCount);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Smoke test failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
