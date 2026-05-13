'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

type FeeMode = 'NONE' | 'FIXED' | 'PERCENT'

export default function AdminServiceFeesPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<FeeMode>('NONE')
  const [value, setValue] = useState('0')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const keys = ['serviceFeeEnabled', 'serviceFeeMode', 'serviceFeeValue']
        const responses = await Promise.all(keys.map((k) => fetch(`/api/admin/settings?key=${k}`)))
        const jsons = await Promise.all(responses.map((r) => (r.ok ? r.json() : null)))
        if (cancelled) return
        for (const item of jsons) {
          if (!item?.key) continue
          if (item.key === 'serviceFeeEnabled') setEnabled(item.value === 'true')
          if (item.key === 'serviceFeeMode') setMode((item.value as FeeMode) || 'NONE')
          if (item.key === 'serviceFeeValue') setValue(String(item.value ?? '0'))
        }
      } catch {
        if (!cancelled) setMessage({ type: 'error', text: 'Erreur de chargement des paramètres.' })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const payloads = [
        { key: 'serviceFeeEnabled', value: String(enabled) },
        { key: 'serviceFeeMode', value: mode },
        { key: 'serviceFeeValue', value: String(Math.max(0, Number(value) || 0)) },
      ]
      const responses = await Promise.all(
        payloads.map((p) =>
          fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          })
        )
      )
      if (!responses.every((r) => r.ok)) throw new Error('save_failed')
      setMessage({ type: 'success', text: 'Configuration des frais enregistrée.' })
    } catch {
      setMessage({ type: 'error', text: 'Impossible d’enregistrer la configuration.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        kicker="Monetisation settings"
        title="Frais de service"
        subtitle="Gere les frais administratifs appliques automatiquement aux reservations dans une presentation plus premium."
        actions={
          <Link href="/admin/settings" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
            Parametres generaux
          </Link>
        }
      />

      <div className="max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.35)]">
        <label className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
          />
          <span className="font-semibold text-gray-900">Activer les frais de service</span>
        </label>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as FeeMode)}
              disabled={!enabled}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="NONE">Aucun</option>
              <option value="FIXED">Montant fixe (FC)</option>
              <option value="PERCENT">Pourcentage (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!enabled || mode === 'NONE'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
          Règle appliquée: <span className="font-semibold">Total billet = Sous-total + Frais de service</span>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>
      </div>
    </div>
  )
}
