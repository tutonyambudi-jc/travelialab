'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type ConfigGet = {
  baseUrl: string
  hasDatabaseApiKey: boolean
  hasEnvironmentApiKey: boolean
  hasEffectiveCredentials: boolean
}

export function ErpConnectionSettings() {
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [meta, setMeta] = useState<ConfigGet | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [clearStoredApiKey, setClearStoredApiKey] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    try {
      const res = await fetch('/api/travelia/sync/connection-config', { credentials: 'include' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setLoadErr(typeof j.error === 'string' ? j.error : 'Chargement impossible')
        setMeta(null)
        return
      }
      const data = (await res.json()) as ConfigGet
      setMeta(data)
      setBaseUrl(data.baseUrl ?? '')
    } catch {
      setLoadErr('Erreur réseau')
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const testConnection = async () => {
    setTesting(true)
    setTestMsg(null)
    try {
      const res = await fetch('/api/travelia/sync/connection-config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          baseUrl,
          apiKey: apiKey.trim() || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setTestMsg({ ok: false, text: typeof j.error === 'string' ? j.error : 'Échec du test' })
        return
      }
      const ok = Boolean(j.ok)
      const detail = typeof j.detail === 'string' ? j.detail : 'Réponse inconnue'
      setTestMsg({ ok, text: detail })
    } catch {
      setTestMsg({ ok: false, text: 'Erreur réseau' })
    } finally {
      setTesting(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/travelia/sync/connection-config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          apiKey: apiKey.trim() || undefined,
          clearApiKey: clearStoredApiKey,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveMsg({ ok: false, text: typeof j.error === 'string' ? j.error : 'Enregistrement impossible' })
        return
      }
      setSaveMsg({ ok: true, text: 'Paramètres enregistrés.' })
      setApiKey('')
      setClearStoredApiKey(false)
      await loadConfig()
    } catch {
      setSaveMsg({ ok: false, text: 'Erreur réseau' })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !meta) {
    return (
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Chargement de la configuration ERP…</p>
      </div>
    )
  }

  if (loadErr) {
    return (
      <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {loadErr}
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-bold text-slate-900">Connexion ERP</h2>
      <p className="mt-1 text-sm text-slate-600">
        Les valeurs enregistrées ici remplacent <code className="rounded bg-slate-100 px-1">ERP_BASE_URL</code> et{' '}
        <code className="rounded bg-slate-100 px-1">ERP_API_KEY</code> du fichier d’environnement lorsqu’elles sont
        renseignées.
      </p>
      {meta ? (
        <p className="mt-2 text-xs text-slate-500">
          {meta.hasEffectiveCredentials
            ? 'Les appels sync peuvent utiliser une URL et une clé (base ou .env).'
            : 'Aucune URL + clé complète pour l’instant — complétez les champs ou le .env.'}
          {meta.hasEnvironmentApiKey ? ' Clé présente dans .env.' : ''}
          {meta.hasDatabaseApiKey ? ' Clé enregistrée en base.' : ''}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-800">ERP Base URL</span>
          <input
            type="url"
            autoComplete="url"
            placeholder="https://erp.exemple.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-sky-500/30 focus:ring-2"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-800">API Key</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={
              meta?.hasDatabaseApiKey || meta?.hasEnvironmentApiKey
                ? 'Laisser vide pour conserver la clé actuelle'
                : 'Bearer token côté ERP'
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-sky-500/30 focus:ring-2"
          />
        </label>
      </div>

      {meta?.hasDatabaseApiKey ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={clearStoredApiKey}
            onChange={(e) => setClearStoredApiKey(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Supprimer la clé API enregistrée en base (revenir à la variable d’environnement si elle existe)
        </label>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" disabled={testing} onClick={() => void testConnection()}>
          {testing ? 'Test…' : 'Tester connexion'}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? 'Enregistrement…' : 'Sauvegarder'}
        </Button>
      </div>

      {testMsg ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            testMsg.ok ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200' : 'bg-red-50 text-red-900 ring-1 ring-red-200'
          }`}
        >
          {testMsg.text}
        </p>
      ) : null}

      {saveMsg ? (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${
            saveMsg.ok ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-200' : 'bg-red-50 text-red-900 ring-1 ring-red-200'
          }`}
        >
          {saveMsg.text}
        </p>
      ) : null}
    </div>
  )
}
