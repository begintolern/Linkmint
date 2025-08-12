import { PrismaClient } from '@prisma/client'

declare global {
  // avoid re-instantiating in dev
  // @ts-ignore
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], // <-- turn on server logs
  })

if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  global.prisma = prisma
}
