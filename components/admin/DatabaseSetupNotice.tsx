type Props = {
  title?: string
  error?: unknown
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function DatabaseSetupNotice({
  title = 'Base de données non prête',
  error,
}: Props) {
  const detail = error ? formatError(error) : null

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
      <h1 className="text-xl font-bold text-amber-950">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-amber-900">
        L’application ne peut pas lire PostgreSQL (tables manquantes ou connexion refusée).
        Exécutez ces commandes dans le conteneur Dokploy, puis redémarrez le service.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`cd /app
./node_modules/.bin/prisma db push
npx tsx scripts/create-admin.ts`}
      </pre>
      <p className="mt-4 text-sm text-amber-900">
        Compte admin par défaut : <strong>admin@aigleroyale.com</strong> / <strong>admin123</strong>
      </p>
      <p className="mt-2 text-sm text-amber-900">
        Vérifiez aussi <code className="rounded bg-white px-1">DATABASE_URL</code>,{' '}
        <code className="rounded bg-white px-1">NEXTAUTH_URL</code> et{' '}
        <code className="rounded bg-white px-1">NEXTAUTH_SECRET</code> dans Dokploy.
      </p>
      {detail ? (
        <p className="mt-4 break-all rounded-lg border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-800">
          {detail}
        </p>
      ) : null}
    </div>
  )
}
