import { defineConfig } from 'prisma/config'

/** Sans `dotenv` : évite l’erreur « Cannot find module dotenv » si `node_modules` est minimal en prod. */

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
})
