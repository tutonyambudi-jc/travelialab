import Link from 'next/link'
import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const steps = [
  'Connectez-vous a votre compte client.',
  'Accedez a vos reservations confirmees.',
  'Selectionnez une reservation et telechargez votre recu ou facture.',
]

export default function ReceiptsPage() {
  return (
    <PublicInfoLayout
      badge="Comptabilite"
      title="Recus et factures"
      description="Centralisez les justificatifs de paiement et documents de reservation."
    >
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Comment acceder a vos documents</h2>
        <ol className="mt-4 grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 sm:text-base">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/reservations" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
            Ouvrir mes reservations
          </Link>
          <Link href="/auth/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
            Se connecter
          </Link>
        </div>
      </article>
    </PublicInfoLayout>
  )
}
