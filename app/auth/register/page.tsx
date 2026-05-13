'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  AtSign,
  Phone,
  Gift,
  Lock,
  ShieldCheck,
  UserPlus,
  ArrowRight,
} from 'lucide-react'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    referralCode: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pré-remplir le code parrain depuis ?ref=XXXX
  useEffect(() => {
    const ref = searchParams?.get('ref')
    if (ref && ref.trim() && !formData.referralCode) {
      setFormData((prev) => ({ ...prev, referralCode: ref.trim().toUpperCase() }))
    }
  }, [searchParams, formData.referralCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const normalizedEmail = formData.email.trim().toLowerCase()

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: normalizedEmail,
          phone: formData.phone,
          referralCode: formData.referralCode,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      router.push('/auth/login?registered=true')
    } catch (err) {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 md:py-10">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/20 bg-white/85 p-6 shadow-2xl backdrop-blur md:p-8">
        <div className="mb-6 rounded-xl border border-[#d9e8fb] bg-gradient-to-r from-[#003580] to-[#0b4ea2] p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">Aigle Royale</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight md:text-[30px]">
            <UserPlus className="h-6 w-6 md:h-7 md:w-7" />
            Créer votre compte
          </h1>
          <p className="mt-1 text-sm text-blue-100">Inscription rapide pour réserver vos billets en quelques étapes.</p>
        </div>

        <div className="mb-6 text-center">
          {/* <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg">
            <span className="text-2xl font-bold text-white">AR</span>
          </div> */}
          <p className="text-sm text-slate-600">Renseignez vos informations pour activer votre espace client.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-slate-500" />
                Prénom
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="firstName"
                  placeholder='Entrer votre prénom'
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-slate-500" />
                Nom
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="lastName"
                  placeholder='Entrer votre nom'
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <AtSign className="h-4 w-4 text-slate-500" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  placeholder='Entrer une adresse mail valide'
                  value={formData.email}
                  onBlur={(e) => setFormData({ ...formData, email: e.target.value.trim().toLowerCase() })}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-slate-500" />
                Téléphone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  placeholder='Entrer votre numéro de téléphone'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="referralCode" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Gift className="h-4 w-4 text-slate-500" />
              Code de parrainage (optionnel)
            </label>
            <div className="relative">
              <input
                type="text"
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                placeholder="Ex: AR-ABCD-1A2B3C"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Ajoutez un code d invitation pour obtenir un bonus de bienvenue.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="h-4 w-4 text-slate-500" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  placeholder='votre mot de passe'
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder='confirmez votre mot de passe'
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0071c2] to-[#005da0] py-3.5 text-base font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="relative z-10">{loading ? 'Inscription...' : "S'inscrire"}</span>
            {!loading && <ArrowRight className="relative z-10 h-4 w-4" />}
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#005da0] to-[#004c84] opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
