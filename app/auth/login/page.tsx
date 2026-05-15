'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AtSign,
  Lock,
  LogIn,
  ArrowRight,
  BadgeCheck,
  UserCog,
  Truck,
} from 'lucide-react'

function decodeSignInErrorParam(error: string) {
  try {
    return decodeURIComponent(error.replace(/\+/g, ' '))
  } catch {
    return error
  }
}

/** NextAuth renvoie surtout `CredentialsSignin` ; tout autre code vient souvent du serveur (DB, config). */
function mapSignInError(error: string | undefined) {
  if (!error) {
    return 'Erreur technique de connexion. Réessayez dans quelques instants.'
  }
  if (error === 'CredentialsSignin') {
    return "Email ou mot de passe incorrect. Si c'est votre première connexion, créez un compte puis reconnectez-vous."
  }
  const decoded = decodeSignInErrorParam(error)
  if (error === 'Configuration' || decoded.toLowerCase().includes('nextauth_secret')) {
    return "Configuration serveur incorrecte (secret d'authentification). Prévenez l'administrateur."
  }
  if (error === 'AccessDenied') {
    return 'Accès refusé pour ce compte.'
  }
  if (
    decoded === 'AUTH_DATABASE' ||
    /prisma|postgres|sql|database|ECONNREFUSED|P1001/i.test(decoded)
  ) {
    return "L'authentification ne peut pas joindre la base de données. Vérifiez que le serveur est démarré et que DATABASE_URL pointe vers une base valide, puis réessayez."
  }
  if (/fetch|network|failed to fetch|load failed/i.test(decoded)) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion réseau et réessayez.'
  }
  return `Erreur technique (${decoded}). Réessayez dans quelques instants.`
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isAgentLogin = searchParams?.get('role') === 'agent'
  const isSuperAgentLogin = searchParams?.get('role') === 'super-agent'
  const isLogisticsLogin = searchParams?.get('role') === 'logistics'
  const callbackUrl = searchParams?.get('callbackUrl') || ''

  const safeCallbackUrl = (() => {
    // Only allow relative in-app redirects to avoid open-redirects
    if (!callbackUrl) return ''
    if (!callbackUrl.startsWith('/')) return ''
    if (callbackUrl.startsWith('//')) return ''
    if (callbackUrl.includes('://')) return ''
    return callbackUrl
  })()

  useEffect(() => {
    // Pré-remplir l'email en mode "Agent" (compte démo)
    if (isAgentLogin && !email) {
      setEmail('agent@demo.com')
    }
    if (isSuperAgentLogin && !email) {
      setEmail('superagent@demo.com')
    }
    if (isLogisticsLogin && !email) {
      setEmail('logistics@demo.com')
    }
  }, [isAgentLogin, isSuperAgentLogin, isLogisticsLogin, email])

  const redirectByRole = async () => {
    const session = await getSession()
    const role = session?.user?.role

    if (role === 'AGENT') {
      router.push('/agent')
    } else if (role === 'SUPER_AGENT') {
      router.push('/super-agent')
    } else if (role === 'LOGISTICS') {
      router.push('/logistics')
    } else if (role === 'ADMINISTRATOR' || role === 'SUPERVISOR') {
      router.push('/admin')
    } else if (role === 'AGENCY_STAFF') {
      router.push('/agency')
    } else if (role === 'PARTNER_ADMIN') {
      router.push('/partner')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()

    try {
      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(mapSignInError(result.error))
        setLoading(false)
        return
      }

      // If user came from a protected page (ex: booking), honor callbackUrl first

      if (safeCallbackUrl) {
        router.push(safeCallbackUrl)
        router.refresh()
        return
      }

      // Si l'utilisateur est sur le mode Agent, on force la redirection sur /agent
      
      if (isAgentLogin) {
        router.push('/agent')
        router.refresh()
      } else if (isSuperAgentLogin) {
        router.push('/super-agent')
        router.refresh()
      } else if (isLogisticsLogin) {
        router.push('/logistics')
        router.refresh()
      } else {
        await redirectByRole()
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAgentLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'agent@demo.com',
        password: 'demo123',
        redirect: false,
      })

      if (result?.error) {
        setError('Impossible de se connecter avec le compte démo')
        return
      }

      router.push('/agent')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSuperAgentLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'superagent@demo.com',
        password: 'demo123',
        redirect: false,
      })

      if (result?.error) {
        setError('Impossible de se connecter avec le compte démo')
        return
      }

      router.push('/super-agent')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogisticsLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'logistics@demo.com',
        password: 'demo123',
        redirect: false,
      })

      if (result?.error) {
        setError('Impossible de se connecter avec le compte démo')
        return
      }

      router.push('/logistics')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
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

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/85 p-6 shadow-2xl backdrop-blur md:p-8">
        <div className="mb-6 rounded-xl border border-[#d9e8fb] bg-gradient-to-r from-[#003580] to-[#0b4ea2] p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">Aigle Royale</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight md:text-[30px]">
            {isAgentLogin ? (
              <><BadgeCheck className="h-6 w-6 md:h-7 md:w-7" /> Connexion Agent</>
            ) : isSuperAgentLogin ? (
              <><UserCog className="h-6 w-6 md:h-7 md:w-7" /> Connexion Super Agent</>
            ) : isLogisticsLogin ? (
              <><Truck className="h-6 w-6 md:h-7 md:w-7" /> Connexion Logistique</>
            ) : (
              <><LogIn className="h-6 w-6 md:h-7 md:w-7" /> Connexion</>
            )}
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            {isAgentLogin
              ? 'Accédez à votre espace de vente'
              : isSuperAgentLogin
                ? 'Vente en agence (entreprise propriétaire)'
                : isLogisticsLogin
                  ? 'Planning chauffeurs (dispatch, rotation, repos)'
                  : 'Connectez-vous à votre compte Aigle Royale.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <AtSign className="h-4 w-4 text-slate-500" />
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Entrez votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setEmail(e.target.value.trim().toLowerCase())}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 text-slate-500" />
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-5 pr-4 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0071c2] to-[#005da0] py-3.5 text-base font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="relative z-10">{loading ? 'Connexion...' : 'Se connecter'}</span>
            {!loading && <ArrowRight className="relative z-10 h-4 w-4" />}
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#005da0] to-[#004c84] opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            )}
          </button>

          {isAgentLogin && (
            <button
              type="button"
              onClick={handleDemoAgentLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50 py-3.5 text-base font-bold text-green-700 transition-all duration-200 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BadgeCheck className="h-5 w-5" />
              Connexion démo Agent (1 clic)
            </button>
          )}

          {isSuperAgentLogin && (
            <button
              type="button"
              onClick={handleDemoSuperAgentLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50 py-3.5 text-base font-bold text-purple-700 transition-all duration-200 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserCog className="h-5 w-5" />
              Connexion démo Super Agent (1 clic)
            </button>
          )}

          {isLogisticsLogin && (
            <button
              type="button"
              onClick={handleDemoLogisticsLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 py-3.5 text-base font-bold text-orange-700 transition-all duration-200 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck className="h-5 w-5" />
              Connexion démo Logistique (1 clic)
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:underline">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
