'use client'

import { useCallback, useEffect, useState } from 'react'
import { SyncLogTable, type SyncLogApiRow } from '@/components/admin/erp-sync/SyncLogTable'
import { ErpConnectionSettings } from '@/components/admin/erp-sync/ErpConnectionSettings'
import { Button } from '@/components/ui/button'

type StatusTab = 'all' | 'pending' | 'synced' | 'failed' | 'retried'
type EntityFilter = 'all' | 'BOOKING' | 'PAYMENT' | 'COMMISSION'

type Summary = { pending: number; failed: number; success: number }

const PAGE_SIZE = 50

const TAB_OPTIONS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'En attente' },
  { id: 'synced', label: 'Synchronisés' },
  { id: 'failed', label: 'Échoués' },
  { id: 'retried', label: 'Réessayés' },
]

const ENTITY_OPTIONS: { id: EntityFilter; label: string }[] = [
  { id: 'all', label: 'Tous les types' },
  { id: 'BOOKING', label: 'BOOKING' },
  { id: 'PAYMENT', label: 'PAYMENT' },
  { id: 'COMMISSION', label: 'COMMISSION' },
]

function tabButtonClass(active: boolean) {
  return active
    ? 'bg-[#0071c2] text-white shadow-md shadow-sky-900/10'
    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
}

export default function SyncQueuePage() {
  const [tab, setTab] = useState<StatusTab>('all')
  const [entityType, setEntityType] = useState<EntityFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [total, setTotal] = useState(0)
  const [logs, setLogs] = useState<SyncLogApiRow[]>([])
  const [retryingRef, setRetryingRef] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 320)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setOffset(0)
  }, [tab, entityType, search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('tab', tab)
      if (entityType !== 'all') params.set('entityType', entityType)
      if (search) params.set('q', search)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(offset))
      const res = await fetch(`/api/travelia/sync/status?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(typeof j.error === 'string' ? j.error : 'Chargement impossible')
        setLogs([])
        return
      }
      const data = await res.json()
      setSummary(data.summary ?? null)
      setTotal(typeof data.total === 'number' ? data.total : 0)
      const list = Array.isArray(data.logs) ? data.logs : data.recent ?? []
      setLogs(list as SyncLogApiRow[])
    } catch {
      setError('Erreur réseau')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [tab, entityType, search, offset])

  useEffect(() => {
    void load()
  }, [load])

  const onRetry = async (externalReference: string) => {
    setRetryingRef(externalReference)
    setToast(null)
    try {
      const res = await fetch('/api/travelia/sync/retry-failed', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalReference }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setToast(typeof j.error === 'string' ? j.error : 'Échec du réessai')
        return
      }
      setToast('Synchronisation relancée')
      await load()
    } catch {
      setToast('Erreur réseau')
    } finally {
      setRetryingRef(null)
    }
  }

  const hasMore = offset + logs.length < total

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-6">
      <div className="mb-8 rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_24px_80px_-40px_rgba(0,53,128,0.45)] backdrop-blur-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0071c2]">Travelia · Admin</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          File d’attente Sync ERP
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Surveillance des envois et retours ERP. Les données sensibles sont masquées à l’affichage.
        </p>

        {summary ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'En attente', value: summary.pending, ring: 'ring-amber-200', bg: 'bg-amber-50' },
              { label: 'Synchronisés', value: summary.success, ring: 'ring-emerald-200', bg: 'bg-emerald-50' },
              { label: 'Échoués', value: summary.failed, ring: 'ring-red-200', bg: 'bg-red-50' },
            ].map((c) => (
              <div
                key={c.label}
                className={`rounded-2xl border border-slate-100 ${c.bg} px-4 py-3 ring-1 ${c.ring}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{c.label}</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{c.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <ErpConnectionSettings />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="flex flex-wrap gap-2">
          {TAB_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tabButtonClass(tab === t.id)}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Entity type
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityFilter)}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm"
            >
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[220px] flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Référence externe
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher…"
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
            />
          </label>
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            Actualiser
          </Button>
        </div>
      </div>

      {toast ? (
        <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
          {toast}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          {error}
        </div>
      ) : null}

      {loading && logs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center text-slate-500">Chargement…</div>
      ) : !loading && logs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="text-lg font-bold text-slate-800">Aucune entrée</p>
          <p className="mt-2 text-sm text-slate-600">
            Ajustez les filtres ou la recherche par référence externe.
          </p>
        </div>
      ) : (
        <>
          <SyncLogTable rows={logs} onRetry={onRetry} retryingRef={retryingRef} />
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span>
              {total === 0 ? '0' : `${offset + 1}–${offset + logs.length}`} sur {total}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={offset === 0 || loading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasMore || loading}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
