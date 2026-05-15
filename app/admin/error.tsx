'use client'

import { useEffect } from 'react'
import { DatabaseSetupNotice } from '@/components/admin/DatabaseSetupNotice'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin error]', error)
  }, [error])

  return (
    <div className="p-6">
      <DatabaseSetupNotice
        title="Erreur sur l’espace administrateur"
        error={error.digest ? `Digest: ${error.digest}` : error.message}
      />
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
      >
        Réessayer
      </button>
    </div>
  )
}
