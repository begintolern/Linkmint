import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'referrer@test.com' },
  })

  console.log('User ID:', user?.id || 'Not found')
  await prisma.$disconnect()
}

main()
