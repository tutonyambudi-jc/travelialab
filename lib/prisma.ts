import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    'postgresql://127.0.0.1:5432/postgres'
  )
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() })
  return new PrismaClient({ adapter })
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
