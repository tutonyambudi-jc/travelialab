import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

/** Remonte depuis `process.cwd()` pour trouver la racine du dépôt (évite un mauvais chemin si Next change le cwd). */
function resolveProjectRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 10; i++) {
    const pkg = path.join(dir, 'package.json')
    const schema = path.join(dir, 'prisma', 'schema.prisma')
    if (fs.existsSync(pkg) && fs.existsSync(schema)) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

function resolveSqliteFilePath() {
  const raw = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  if (raw === ':memory:') return ':memory:'
  const filePath = raw.startsWith('file:') ? raw.slice('file:'.length) : raw
  if (path.isAbsolute(filePath)) {
    return filePath
  }
  return path.resolve(resolveProjectRoot(), filePath)
}

const sqliteAdapter = new PrismaBetterSqlite3({
  url: resolveSqliteFilePath() as string,
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: sqliteAdapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
