'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    Calendar,
    Users,
    Clock,
    Mail,
    Phone,
    User,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react'

type RentalType = 'FULL_DAY' | 'HALF_DAY'
type BusType = 'STANDARD' | 'VIP'

export function BusRentalForm() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        rentalType: 'FULL_DAY' as RentalType,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '18:00',
        departureLocation: '',
        destination: '',
        passengerCount: 1,
        preferredBusType: 'STANDARD' as BusType,
        specialRequests: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
    })

    const nextStep = () => setStep(s => Math.min(s + 1, 3))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step < 3) {
            nextStep()
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/rentals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erreur lors de la soumission')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                    <CheckCircle2 className="h-7 w-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Demande envoyée !</h3>
                <p className="mt-1 text-[15px] text-slate-500">
                    Nous avons bien reçu votre demande. Un conseiller vous contactera très bientôt.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="ar-btn ar-btn-md ar-btn-primary mt-5"
                >
                    Fermer
                </button>
            </div>
        )
    }

    const steps = [
        { num: 1, label: 'Service' },
        { num: 2, label: 'Trajet' },
        { num: 3, label: 'Contact' },
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
                {steps.map((s, i) => (
                    <div key={s.num} className="flex items-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                step === s.num
                                    ? 'bg-[#0071c2] text-white'
                                    : step > s.num
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-slate-100 text-slate-400'
                            }`}>
                                {step > s.num ? '✓' : s.num}
                            </span>
                            <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                                step === s.num ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`mx-2 h-px w-8 ${step > s.num ? 'bg-primary-300' : 'bg-slate-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1 - Service */}
            {step === 1 && (
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                        <div className="grid grid-cols-2 divide-x divide-slate-200">
                            {(['FULL_DAY', 'HALF_DAY'] as RentalType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rentalType: type })}
                                    className={`group p-4 text-left transition-colors ${
                                        formData.rentalType === type ? 'bg-primary-50' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                        {type === 'FULL_DAY' ? 'Journée complète' : 'Demi-journée'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {type === 'FULL_DAY' ? (
                                            <Calendar className="w-4 h-4 text-primary-500" />
                                        ) : (
                                            <Clock className="w-4 h-4 text-primary-500" />
                                        )}
                                        <span className={`text-[15px] font-semibold ${
                                            formData.rentalType === type ? 'text-primary-700' : 'text-slate-500'
                                        }`}>
                                            {type === 'FULL_DAY' ? '08h → 18h' : '08h → 13h / 13h → 18h'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                        <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="group p-4">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                    Date
                                </label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary-500" />
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        className="flex-1 cursor-pointer border-0 bg-transparent text-[15px] font-semibold text-slate-900 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group p-4">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                    Passagers
                                </label>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary-500" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.passengerCount}
                                        onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                                        className="flex-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                        <div className="group p-4">
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-2">
                                Catégorie de car
                            </label>
                            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                {(['STANDARD', 'VIP'] as BusType[]).map((bType) => (
                                    <button
                                        key={bType}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, preferredBusType: bType })}
                                        className={`h-8 rounded-md px-4 text-sm font-semibold transition-colors ${
                                            formData.preferredBusType === bType
                                                ? 'bg-[#0071c2] text-white'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {bType === 'VIP' ? 'Premium / VIP' : 'Standard'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2 - Trajet */}
            {step === 2 && (
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                        <div className="divide-y divide-slate-200">
                            <div className="group p-4">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                    Lieu de départ
                                </label>
                                <div className="relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                                        <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-100" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Lieu de prise en charge"
                                        value={formData.departureLocation}
                                        onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
                                        className="w-full pl-6 pr-3 py-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group p-4">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                    Destination
                                </label>
                                <div className="relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Destination finale"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                        className="w-full pl-6 pr-3 py-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                        <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="group p-4">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                    Heure de début
                                </label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary-500" />
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="flex-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group p-4">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                    Heure de fin
                                </label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="flex-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                        <div className="group p-4">
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                Besoins particuliers
                            </label>
                            <textarea
                                placeholder="Optionnel..."
                                value={formData.specialRequests}
                                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                rows={2}
                                className="w-full border-0 bg-transparent text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:ring-0 resize-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3 - Contact */}
            {step === 3 && (
                <div className="space-y-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-500 uppercase tracking-[0.08em]">Service</span>
                            <span className="font-bold text-slate-800">{formData.rentalType === 'FULL_DAY' ? 'Journée' : 'Demi-journée'} · {formData.preferredBusType}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-500 uppercase tracking-[0.08em]">Date</span>
                            <span className="font-bold text-slate-800">{format(new Date(formData.startDate), 'dd MMMM yyyy', { locale: fr })}</span>
                        </div>
                        {formData.departureLocation && formData.destination && (
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-500 uppercase tracking-[0.08em]">Trajet</span>
                                <span className="font-bold text-slate-800 truncate max-w-[180px]">{formData.departureLocation} → {formData.destination}</span>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white divide-y divide-slate-200">
                        <div className="group p-4">
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                Nom complet
                            </label>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Votre nom"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    className="flex-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:ring-0"
                                    required
                                />
                            </div>
                        </div>
                        <div className="group p-4">
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                Téléphone
                            </label>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <input
                                    type="tel"
                                    placeholder="+243 ..."
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="flex-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:ring-0"
                                    required
                                />
                            </div>
                        </div>
                        <div className="group p-4">
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
                                E-mail
                            </label>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="vous@email.com"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    className="flex-1 border-0 bg-transparent text-[15px] font-semibold text-slate-900 placeholder-slate-400 focus:ring-0"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                    ⚠️ {error}
                </div>
            )}

            <div className="flex gap-3">
                {step > 1 && (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="ar-btn ar-btn-lg ar-btn-secondary"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="ar-btn ar-btn-lg ar-btn-primary flex-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <span className="flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Envoi en cours...
                            </>
                        ) : (
                            <>
                                {step === 3 ? 'Confirmer la demande' : 'Continuer'}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </span>
                </button>
            </div>
        </form>
    )
}
