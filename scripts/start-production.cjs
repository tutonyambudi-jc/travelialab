/**
 * Démarre Next.js en production. Tente prisma db push mais ne bloque pas le démarrage
 * (sinon 502 Bad Gateway si Postgres est temporairement injoignable).
 */
const { execSync, spawn } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const prismaBin = path.join(root, 'node_modules', 'prisma', 'build', 'index.js')
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

function log(msg) {
  console.log(`[start-production] ${msg}`)
}

const port = process.env.PORT || '3000'
const host = process.env.HOSTNAME || '0.0.0.0'

if (!process.env.DATABASE_URL?.trim()) {
  console.warn(
    '[start-production] DATABASE_URL manquant — l’app démarre mais Prisma échouera.'
  )
} else if (process.env.SKIP_DB_PUSH === 'true') {
  log('SKIP_DB_PUSH=true — prisma db push ignoré.')
} else {
  try {
    log('Synchronisation du schéma (prisma db push)...')
    execSync(`node "${prismaBin}" db push --skip-generate`, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      timeout: 120_000,
    })
    log('Schéma synchronisé.')
  } catch (err) {
    console.error(
      '[start-production] prisma db push a échoué — Next démarre quand même (évite 502).'
    )
    console.error('[start-production]', err?.message || err)
    console.error(
      '[start-production] Corrigez DATABASE_URL puis exécutez: npx prisma db push'
    )
  }
}

if (!process.env.NEXTAUTH_SECRET?.trim()) {
  console.warn(
    '[start-production] NEXTAUTH_SECRET manquant — sessions NextAuth instables.'
  )
}

log(`Démarrage Next.js sur http://${host}:${port} ...`)

const childEnv = {
  ...process.env,
  PORT: String(port),
  HOSTNAME: host,
  NODE_ENV: process.env.NODE_ENV || 'production',
}

const child = spawn(process.execPath, [nextBin, 'start', '-H', host], {
  cwd: root,
  stdio: 'inherit',
  env: childEnv,
})

child.on('exit', (code) => process.exit(code ?? 1))
