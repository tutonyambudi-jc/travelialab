'use client'

import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  Link2,
  Mail,
  MessageCircle,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Badge, statusToBadgeVariant } from '@/components/ui/badge'

type Company = { id: string; name: string }
type Bus = { id: string; name: string; plateNumber: string; company?: { id: string; name: string } | null }

type Status = 'ALL' | 'CONFIRMED' | 'PENDING' | 'CHECKED_IN'

type BookingPreview = {
  departureTime: string
  companyName?: string | null
  plateNumber?: string | null
  drivers?: string | null
  route?: string | null
  seatNumber?: string | null
  passengerName: string
  checkedInAt?: string | null
  passengerPhone?: string | null
  busName?: string | null
  status: string
}

function ymdToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function onlyDigits(s: string): string {
  return s.replace(/[^\d]/g, '')
}

export function PassengerManifestManager({
  companies,
  buses,
}: {
  companies: Company[]
  buses: Bus[]
}) {
  const today = useMemo(() => ymdToday(), [])
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [companyId, setCompanyId] = useState('')
  const [busId, setBusId] = useState('')
  const [status, setStatus] = useState<Status>('ALL')

  const [expiresInDays, setExpiresInDays] = useState(7)
  const [emailTo, setEmailTo] = useState('')
  const [whatsAppTo, setWhatsAppTo] = useState('')

  const [shareUrl, setShareUrl] = useState<string>('')
  const [shareExpiresAt, setShareExpiresAt] = useState<string>('')
  const [shareLoading, setShareLoading] = useState(false)
  const [uiError, setUiError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [bookings, setBookings] = useState<BookingPreview[]>([])
  const [hasLoadedPreview, setHasLoadedPreview] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')

  const manifestQuery = useMemo(() => {
    const qs = new URLSearchParams()
    qs.set('from', from)
    if (to) qs.set('to', to)
    if (companyId) qs.set('companyId', companyId)
    if (busId) qs.set('busId', busId)
    if (status) qs.set('status', status)
    return qs.toString()
  }, [from, to, companyId, busId, status])

  const downloadUrl = useMemo(() => `/api/admin/manifests/passengers?${manifestQuery}`, [manifestQuery])

  const inputClassName =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 shadow-sm outline-none transition focus:border-[#0071c2] focus:ring-4 focus:ring-[#0071c2]/10'

  const activeStatusLabel =
    status === 'ALL'
      ? 'Confirmés et en attente'
      : status === 'CHECKED_IN'
        ? 'Passagers enregistrés'
        : status === 'CONFIRMED'
          ? 'Confirmés uniquement'
          : 'En attente uniquement'

  const activeCompany = companies.find((company) => company.id === companyId)
  const activeBus = buses.find((bus) => bus.id === busId)
  const activeScopeLabel = activeBus
    ? `${activeBus.name} (${activeBus.plateNumber})`
    : activeCompany?.name || 'Toutes les compagnies'

  const resultsLabel =
    bookings.length === 0
      ? 'Aucun passager'
      : bookings.length === 1
        ? '1 passager'
        : `${bookings.length} passagers`

  async function handleCreateShareLink() {
    setUiError('')
    setShareLoading(true)
    setShareUrl('')
    setShareExpiresAt('')
    setCopyState('idle')
    try {
      const res = await fetch('/api/admin/manifests/passengers/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          companyId,
          busId,
          status,
          expiresInDays,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUiError(data?.error || 'Impossible de créer le lien')
        return
      }
      setShareUrl(data.shareUrl)
      setShareExpiresAt(data.expiresAt ? new Date(data.expiresAt).toLocaleString() : '')
    } catch {
      setUiError('Impossible de créer le lien')
    } finally {
      setShareLoading(false)
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyState('done')
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      try {
        document.execCommand('copy')
        setCopyState('done')
      } catch {
        setCopyState('error')
      } finally {
        document.body.removeChild(el)
      }
    }

    window.setTimeout(() => setCopyState('idle'), 2200)
  }

  function openMailShare() {
    if (!shareUrl) return
    const subject = 'Manifest passagers (CSV)'
    const body = `Bonjour,%0D%0A%0D%0AVoici le lien sécurisé pour télécharger le manifest passagers :%0D%0A${encodeURIComponent(
      shareUrl
    )}%0D%0A%0D%0A(Ce lien peut expirer.)%0D%0A`
    const toPart = emailTo.trim()
    window.location.href = `mailto:${encodeURIComponent(toPart)}?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  function openWhatsAppShare() {
    if (!shareUrl) return
    const msg = `Manifest passagers (CSV) : ${shareUrl}`
    const digits = onlyDigits(whatsAppTo.trim())
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDownloadPdf() {
    setPdfLoading(true)
    setUiError('')
    try {
      // 1. Fetch JSON data
      const res = await fetch(`/api/admin/manifests/passengers?${manifestQuery}&format=json`) // format=json
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de la récupération des données')

      const bookings = (data.bookings || []) as BookingPreview[]
      setBookings(bookings)
      setHasLoadedPreview(true)

      // 2. Generate PDF
      // @ts-ignore
      const doc = new jsPDF()

      // Title
      const mainTitle = status === 'CHECKED_IN' ? "Manifest des Passagers Enregistrés (Check-in)" : "Manifest Passagers"
      doc.setFontSize(18)
      doc.text(mainTitle, 14, 20)

      doc.setFontSize(10)
      doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Période: ${from} au ${to}`, 14, 34)

      // Simple table construction
      let y = 45
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")

      // Headers
      const headers = ["Heure", "Compagnie", "Bus", "Chauffeur", "Trajet", "Siège", "Passager", "Enregistré le"]
      // Optimized for longer passenger names:
      const xPositions = [14, 25, 45, 65, 85, 112, 122, 165]

      headers.forEach((h, i) => doc.text(h, xPositions[i], y))

      y += 5
      doc.setFont("helvetica", "normal")

      bookings.forEach((b: any) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }

        const time = new Date(b.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const company = (b.companyName || '—').substring(0, 15)
        const bus = (b.plateNumber || '—').substring(0, 10)
        const driver = (b.drivers || '—').substring(0, 12)
        const route = (b.route || '—').substring(0, 12)
        const seat = b.seatNumber || '—'
        const passenger = b.passengerName.substring(0, 25)
        const checkInTime = b.checkedInAt ? new Date(b.checkedInAt).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

        doc.text(time, xPositions[0], y)
        doc.text(company, xPositions[1], y)
        doc.text(bus, xPositions[2], y)
        doc.text(driver, xPositions[3], y)
        doc.text(route, xPositions[4], y)
        doc.text(seat, xPositions[5], y)
        doc.text(passenger, xPositions[6], y)
        doc.text(checkInTime, xPositions[7], y)

        y += 6
      })

      if (bookings.length === 0) {
        doc.text("Aucune réservation trouvée pour cette période.", 14, y + 10)
      }

      const filenamePrefix = status === 'CHECKED_IN' ? 'manifest_checkin' : 'manifest'
      doc.save(`${filenamePrefix}_${from}_${to}.pdf`)

    } catch (e) {
      console.error(e)
      setUiError('Impossible de générer le PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleLoadPreview() {
    setPreviewLoading(true)
    setUiError('')
    setHasLoadedPreview(true)
    try {
      const res = await fetch(`/api/admin/manifests/passengers?${manifestQuery}&format=json`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setBookings(data.bookings || [])
    } catch (e: any) {
      setUiError(e.message || 'Erreur de chargement')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
        <div className="bg-gradient-to-r from-[#003580] via-[#0071c2] to-[#1187cf] px-6 py-6 text-white md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                Manifest admin
              </div>
              <div className="space-y-2">
                <h2 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-[32px]">
                  Prépare tes listes passagers comme un vrai back-office transport.
                </h2>
                <p className="max-w-xl text-sm leading-6 text-blue-50/90 md:text-[15px]">
                  Filtre rapidement, prévisualise avant export et partage un lien sécurisé sans sortir de l&apos;écran.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">Période</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                  <CalendarDays className="h-4 w-4 text-blue-100" />
                  {from} {to ? `→ ${to}` : ''}
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">Périmètre</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                  <BusFront className="h-4 w-4 text-blue-100" />
                  <span className="truncate">{activeScopeLabel}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">Statut</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                  <Users className="h-4 w-4 text-blue-100" />
                  <span className="truncate">{activeStatusLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-6 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Filter className="h-4 w-4 text-[#0071c2]" />
                Filtres de génération
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Les exports utilisent exactement les mêmes critères que l&apos;aperçu affiché.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
              Dernière base de dates initialisée sur aujourd&apos;hui
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <CalendarDays className="h-4 w-4 text-[#0071c2]" />
                Période de voyage
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Du</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Au</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-[#0071c2]" />
                Transport ciblé
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Compagnie</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Toutes les compagnies</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Bus</label>
                  <select
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Tous les bus</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.company?.name ? `${bus.company.name} — ` : ''}
                        {bus.name} ({bus.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
                Si un bus est sélectionné, il prend automatiquement priorité sur la compagnie.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Users className="h-4 w-4 text-[#0071c2]" />
                Type de passagers
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className={inputClassName}
                >
                  <option value="ALL">PENDING + CONFIRMED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CHECKED_IN">Passagers enregistrés (Check-in)</option>
                </select>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-600">
                Utilise <span className="font-semibold text-slate-900">Check-in</span> pour sortir une liste opérationnelle prête à embarquer.
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-white md:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-bold">Actions rapides</div>
              <p className="text-sm text-slate-300">
                Prévisualise d&apos;abord, puis exporte en CSV ou en PDF avec les mêmes filtres.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleLoadPreview}
                disabled={previewLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Eye className="h-4 w-4" />
                {previewLoading ? 'Chargement...' : 'Voir la liste'}
              </button>
              <a
                href={downloadUrl}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0071c2] px-5 text-[14px] font-bold text-white transition hover:bg-[#005da0]"
              >
                <Download className="h-4 w-4" />
                Télécharger CSV
              </a>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-red-600 px-5 text-[14px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="h-4 w-4" />
                {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {uiError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <div className="text-sm font-bold">Une action a échoué</div>
            <p className="text-sm leading-6">{uiError}</p>
          </div>
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.35)] md:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-[#0071c2]" />
              Aperçu opérationnel
            </div>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Liste des passagers</h3>
            <p className="mt-1 text-sm text-slate-600">
              Vérifie les sièges, contacts et statuts avant impression ou diffusion.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]" variant="secondary">
              {resultsLabel}
            </Badge>
            <Badge className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]" variant="outline">
              {activeStatusLabel}
            </Badge>
          </div>
        </div>

        {hasLoadedPreview && bookings.length === 0 && !previewLoading ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <Users className="h-7 w-7 text-slate-300" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-slate-900">Aucun passager trouvé</h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Essaie une autre période, élargis le périmètre transport ou retire le filtre de statut pour récupérer plus de réservations.
            </p>
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="mt-6 overflow-x-auto rounded-[24px] border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Siège</th>
                    <th className="px-4 py-4 min-w-[220px]">Passager</th>
                    <th className="px-4 py-4">Téléphone</th>
                    <th className="px-4 py-4 min-w-[220px]">Trajet / Bus</th>
                    <th className="px-4 py-4">Départ</th>
                    <th className="px-4 py-4 text-center">Statut</th>
                    <th className="px-4 py-4">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {bookings.map((booking, index) => (
                    <tr key={`${booking.passengerName}-${booking.seatNumber || index}`} className="transition hover:bg-slate-50/80">
                      <td className="px-4 py-4 align-top">
                        <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-[#0071c2]/10 px-3 text-sm font-extrabold text-[#0071c2]">
                          {booking.seatNumber || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-bold text-slate-900">{booking.passengerName}</div>
                        <div className="mt-1 text-xs text-slate-500">{booking.companyName || 'Compagnie non renseignée'}</div>
                      </td>
                      <td className="px-4 py-4 align-top text-slate-600">{booking.passengerPhone || '—'}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-slate-900">{booking.route || '—'}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {booking.busName || 'Bus non renseigné'}
                          {booking.plateNumber ? ` (${booking.plateNumber})` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-slate-600">
                        {new Date(booking.departureTime).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        <Badge className="mx-auto w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]" variant={statusToBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {booking.checkedInAt ? (
                          <div className="inline-flex min-w-[140px] items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Enregistré</div>
                              <div className="mt-1 text-xs text-emerald-800">
                                {new Date(booking.checkedInAt).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex min-w-[140px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                            <Clock3 className="h-4 w-4 text-slate-400" />
                            Non enregistré
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-[14px] font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="h-4 w-4" />
                {pdfLoading ? 'Génération...' : 'Imprimer cette liste'}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Aperçu prêt à lancer</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Clique sur <span className="font-semibold text-slate-900">Voir la liste</span> pour charger un aperçu avant export ou partage.
                </p>
              </div>
              <button
                onClick={handleLoadPreview}
                disabled={previewLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0071c2] px-5 text-[14px] font-bold text-white transition hover:bg-[#005da0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowRight className="h-4 w-4" />
                {previewLoading ? 'Chargement...' : 'Charger l\'aperçu'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.35)] md:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Link2 className="h-4 w-4 text-[#0071c2]" />
              Partage sécurisé
            </div>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Diffuser le manifest sans friction</h3>
            <p className="mt-1 text-sm text-slate-600">
              Génère un lien temporaire puis envoie-le à un partenaire, une agence ou une équipe terrain.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Expire dans</label>
              <input
                type="number"
                min={1}
                max={30}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className={`${inputClassName} w-full sm:w-28`}
              />
            </div>
            <button
              type="button"
              onClick={handleCreateShareLink}
              disabled={shareLoading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-[14px] font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" />
              {shareLoading ? 'Création...' : 'Créer un lien'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-[#0071c2]" />
              Lien de téléchargement
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Un seul lien centralisé pour partager exactement le manifest actuellement configuré.
            </p>

            {shareUrl ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <div className="font-bold">Lien prêt à être envoyé</div>
                  <div className="mt-1">
                    {shareExpiresAt ? `Expiration prévue le ${shareExpiresAt}.` : 'Expiration configurée avec succès.'}
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row">
                  <input
                    value={shareUrl}
                    readOnly
                    className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 font-mono text-xs text-slate-700 shadow-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyShareUrl}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    <Copy className="h-4 w-4" />
                    {copyState === 'done' ? 'Copié' : copyState === 'error' ? 'Échec copie' : 'Copier le lien'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Aucun lien généré pour le moment. Lance la création pour activer le partage email et WhatsApp.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Share2 className="h-4 w-4 text-[#0071c2]" />
              Canaux de diffusion
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Préremplis un destinataire puis ouvre directement le canal souhaité.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="ex: partenaire@compagnie.com"
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={openMailShare}
                  disabled={!shareUrl}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0071c2] px-4 text-[14px] font-bold text-white transition hover:bg-[#005da0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  Partager par email
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp</label>
                <input
                  value={whatsAppTo}
                  onChange={(e) => setWhatsAppTo(e.target.value)}
                  placeholder="ex: +22501020304"
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={openWhatsAppShare}
                  disabled={!shareUrl}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[14px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Partager via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

