import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Pick one merchant that exists in your DB
  const merchant = await prisma.merchantRule.findFirst()

  const click = await prisma.clickEvent.create({
    data: {
      merchantId: merchant?.id, // attach merchant
      source: 'tiktok',
      url: 'https://example.com/product',
      referer: 'https://tiktok.com',
      ip: '123.45.67.89',
      userAgent: 'curl/8.14.1',
      meta: { campaign: 'smoke' },
    },
  })

  console.log('Inserted ClickEvent with merchant:', click)
}

main().finally(() => prisma.$disconnect())
