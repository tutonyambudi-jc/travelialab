import { defineConfig } from 'prisma/config'

/** Sans `dotenv` : évite l’erreur « Cannot find module dotenv » si `node_modules` est minimal en prod.
 *  URL factice si `DATABASE_URL` est absent : suffit pour `prisma generate` (build Docker). En prod / migrate, définir la vraie URL. */

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://127.0.0.1:5432/postgres',
  },
})
