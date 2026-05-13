'use client'

import { useEffect, useState } from 'react'
import type { DisplayCurrency } from '@/lib/utils'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function getPreferredCurrency(): DisplayCurrency {
  try {
    const ls = window.localStorage.getItem('ar_currency')
    if (ls === 'USD' || ls === 'FC') return ls
  } catch { }
  const c = getCookie('ar_currency')
  if (c === 'USD' || c === 'FC') return c
  return 'FC'
}

function persistCurrency(cur: DisplayCurrency) {
  try {
    window.localStorage.setItem('ar_currency', cur)
  } catch { }
  // Cookie non HttpOnly pour être lisible côté client; permet aussi de persister entre pages
  document.cookie = `ar_currency=${encodeURIComponent(cur)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function CurrencySelector() {
  const [currency, setCurrency] = useState<DisplayCurrency>('FC')

  useEffect(() => {
    setCurrency(getPreferredCurrency())
  }, [])

  return (
    <select
      value={currency}
      onChange={(e) => {
        const next = (e.target.value === 'USD' ? 'USD' : 'FC') as DisplayCurrency
        setCurrency(next)
        persistCurrency(next)
        // Force a full refresh to pick up currency updates everywhere.
        window.location.reload()
      }}
      className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white/70 backdrop-blur-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
      aria-label="Sélecteur de monnaie"
      title="Monnaie"
    >
      <option value="FC">FC</option>
      <option value="USD">USD</option>
    </select>
  )
}

