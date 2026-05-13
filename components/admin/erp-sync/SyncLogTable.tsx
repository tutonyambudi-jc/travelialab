'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { JsonViewerModal } from '@/components/admin/erp-sync/JsonViewerModal'
import { SyncStatusBadge, type SyncLogStatus } from '@/components/admin/erp-sync/SyncStatusBadge'

export type SyncLogApiRow = {
  id: string
  entityType: string
  entityId: string
  direction: string
  externalReference: string
  status: SyncLogStatus
  retryCount: number
  lastAttemptAt: string | null
  createdAt: string
  errorMessage: string | null
  payload: string | null
  response: string | null
}

type Props = {
  rows: SyncLogApiRow[]
  onRetry: (externalReference: string) => Promise<void>
  retryingRef: string | null
}

function fmt(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    })
  } catch {
    return d
  }
}

function dirLabel(d: string) {
  if (d === 'OUTBOUND_TO_ERP') return '→ ERP'
  if (d === 'INBOUND_FROM_ERP') return '← ERP'
  return d
}

export function SyncLogTable({ rows, onRetry, retryingRef }: Props) {
  const [modal, setModal] = useState<{ title: string; raw: string | null } | null>(null)

  const copyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref)
    } catch {
      // ignore
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-600">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Réf. externe</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Retries</th>
              <th className="px-4 py-3">Dernière tentative</th>
              <th className="px-4 py-3 min-w-[200px]">Erreur</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="bg-white hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{fmt(r.createdAt)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.entityType}</td>
                <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-700" title={r.externalReference}>
                  {r.externalReference}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dirLabel(r.direction)}</td>
                <td className="px-4 py-3">
                  <SyncStatusBadge status={r.status} retryCount={r.retryCount} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-800">{r.retryCount}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmt(r.lastAttemptAt)}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-red-700" title={r.errorMessage ?? ''}>
                  {r.errorMessage ? (
                    <span className="line-clamp-2">{r.errorMessage}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setModal({ title: 'Payload (masqué)', raw: r.payload })}
                    >
                      Payload
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setModal({ title: 'Réponse ERP (masquée)', raw: r.response })}
                    >
                      Réponse
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => copyRef(r.externalReference)}>
                      Copier
                    </Button>
                    {r.status === 'FAILED' && r.direction === 'OUTBOUND_TO_ERP' ? (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={retryingRef === r.externalReference}
                        onClick={() => onRetry(r.externalReference)}
                      >
                        {retryingRef === r.externalReference ? '…' : 'Réessayer'}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal ? (
        <JsonViewerModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          title={modal.title}
          subtitle="Les secrets (dont ERP_API_KEY) sont masqués."
          raw={modal.raw}
        />
      ) : null}
    </>
  )
}
