/**
 * Démarre l’app après synchronisation du schéma PostgreSQL (Prisma 7).
 * Évite les erreurs Server Components « table does not exist » si prestart a échoué silencieusement.
 */
const { execSync, spawn } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const prismaBin = path.join(root, 'node_modules', 'prisma', 'build', 'index.js')
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

function log(msg) {
  console.log(`[start-production] ${msg}`)
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('[start-production] DATABASE_URL est manquant. Définissez-le dans Dokploy.')
  process.exit(1)
}

if (!process.env.NEXTAUTH_SECRET?.trim()) {
  console.warn(
    '[start-production] NEXTAUTH_SECRET manquant — les sessions NextAuth peuvent échouer.'
  )
}

try {
  log('Synchronisation du schéma (prisma db push)...')
  execSync(`node "${prismaBin}" db push --skip-generate`, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  log('Schéma synchronisé.')
} catch (err) {
  console.error('[start-production] prisma db push a échoué:', err?.message || err)
  process.exit(1)
}

const port = process.env.PORT || '3000'
const host = process.env.HOSTNAME || '0.0.0.0'

log(`Démarrage Next.js sur ${host}:${port}...`)
const child = spawn(process.execPath, [nextBin, 'start', '-H', host, '-p', String(port)], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => process.exit(code ?? 1))
