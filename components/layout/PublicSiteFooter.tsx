import Link from 'next/link'

const legalLinks = [
  { href: '/terms', label: 'Conditions d\'utilisation' },
  { href: '/privacy', label: 'Politique de confidentialite' },
  { href: '/refund-policy', label: 'Politique de remboursement' },
  { href: '/cookie-policy', label: 'Politique des cookies' },
  { href: '/accessibility', label: 'Accessibilite' },
]

const productLinks = [
  { href: '/trips/search', label: 'Rechercher un trajet' },
  { href: '/pricing', label: 'Tarification' },
  { href: '/help', label: 'Centre d\'aide' },
  { href: '/receipts', label: 'Recus et factures' },
  { href: '/preferences/notifications', label: 'Preferences notifications' },
]

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Aigle Royale</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Voyagez sereinement.</h2>
            <p className="mt-3 max-w-sm text-sm text-slate-600">
              Une experience de reservation claire, rapide et professionnelle pour tous vos trajets.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Produit</h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-700 transition-colors hover:text-primary-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Legal</h3>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-700 transition-colors hover:text-primary-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>contact@aigleroyale.com</li>
              <li>+225 XX XX XX XX</li>
              <li>Support: 7j/7, 07h00-22h00</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aigle Royale. Tous droits reserves.</p>
          <p>Inspiree des meilleures pratiques UX de reservation en ligne.</p>
        </div>
      </div>
    </footer>
  )
}
