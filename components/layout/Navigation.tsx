'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, type MouseEvent } from 'react'
import { CurrencySelector } from '@/components/CurrencySelector'
import { usePublicNavigationManaged } from '@/components/layout/PublicNavigationContext'
import { useSafePathname } from '@/lib/use-safe-pathname'
import {
  Home, Info, Ticket,
  Briefcase, Truck, Shield, User, LogOut,
  Menu, X, ChevronDown, Search, Percent, Heart, Receipt, Bell
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavigationProps {
  hideLinks?: boolean
}

interface NavItem {
  href: string
  label: string
  icon?: LucideIcon
  active?: (pathname: string) => boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export function Navigation({ hideLinks = false }: NavigationProps) {
  const { data: session } = useSession()
  const navigationManagedByShell = usePublicNavigationManaged()
  const pathname = useSafePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const currentPath = pathname || '/'

  const isActive = (item: NavItem) => {
    if (item.active) {
      return item.active(currentPath)
    }

    if (item.href === '/') {
      return currentPath === '/'
    }

    return currentPath === item.href || currentPath.startsWith(item.href + '/')
  }

  const navLinkClass = (item: NavItem) => `
    inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200
    ${isActive(item)
      ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }
  `

  const handleOrganiserClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (currentPath === '/') {
      event.preventDefault()
      const el = document.getElementById('search')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const primaryNav: NavItem[] = [
    { href: '/', label: 'Accueil', icon: Home },
    {
      href: '/#search',
      label: 'Organiser',
      icon: Search,
      onClick: handleOrganiserClick,
      active: (path) => path === '/' || path.startsWith('/trips') || path.startsWith('/horaires') || path.startsWith('/carte'),
    },
    { href: '/reservations', label: 'Reservations', icon: Briefcase },
    { href: '/pricing', label: 'Tarifs' },
  ]

  const secondaryNav: NavItem[] = [
    { href: '/services', label: 'Services', icon: Ticket },
    { href: '/help', label: 'Centre aide', icon: Info },
    { href: '/companies/ranking', label: 'Classement' },
  ]

  const professionalLinks = [
    { key: 'agent-space', href: session ? '/agent' : '/auth/login?role=agent', label: 'Espace Agent', icon: User, visible: session?.user.role === 'AGENT' || session?.user.role === 'SUPER_AGENT' || !session },
    { key: 'super-agent-space', href: session ? '/super-agent' : '/auth/login?role=agent', label: 'Super Agent', icon: Shield, visible: session?.user.role === 'SUPER_AGENT' || !session },
    { key: 'logistics-space', href: session ? '/logistics' : '/auth/login?role=logistics', label: 'Logistique', icon: Truck, visible: session?.user.role === 'LOGISTICS' || session?.user.role === 'SUPER_AGENT' || !session },
    { key: 'admin-space', href: '/admin', label: 'Administration', icon: Shield, visible: session?.user.role === 'ADMINISTRATOR' },
  ].filter((link) => link.visible)

  if (navigationManagedByShell) {
    return null
  }

  if (!mounted) {
    return <div aria-hidden="true" className="h-[76px] sm:h-20" />
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-200 ${scrolled
          ? 'border-slate-200 bg-white/95 shadow-sm'
          : 'border-slate-200/80 bg-white/92 backdrop-blur-xl'
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[76px] items-center gap-3 sm:h-20">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-base font-black tracking-tight text-white shadow-soft sm:h-12 sm:w-12">
                AR
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Aigle Royale</p>
                <p className="truncate text-xs text-slate-500">Reservation et transport premium</p>
              </div>
            </Link>

            {!hideLinks && (
              <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">
                {primaryNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.label} href={item.href} onClick={item.onClick} className={navLinkClass(item)}>
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            )}

            {!hideLinks && (
              <div className="hidden min-w-0 flex-1 md:block xl:hidden">
                <nav className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {primaryNav.slice(1).map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.label} href={item.href} onClick={item.onClick} className={navLinkClass(item)}>
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden md:block">
                <CurrencySelector />
              </div>

              {professionalLinks.length > 0 && (
                <div className="relative hidden xl:block group">
                  <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                    <Briefcase className="h-4 w-4" />
                    <span>Espace Pro</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full hidden pt-3 group-hover:block group-focus-within:block">
                    <div className="w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                      {professionalLinks.map((link) => {
                        const Icon = link.icon
                        return (
                          <Link key={link.key} href={link.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                            <Icon className="h-4 w-4 text-primary-600" />
                            <span>{link.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {session ? (
                <div className="relative group">
                  <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white pl-2 pr-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {session.user.name?.charAt(0) || 'U'}
                    </span>
                    <span className="hidden max-w-28 truncate sm:block">{session.user.name || 'Compte'}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full hidden pt-3 group-hover:block group-focus-within:block">
                    <div className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">{session.user.name}</div>
                        <div className="text-xs text-slate-500">{session.user.email}</div>
                      </div>
                      <div className="space-y-1 p-2">
                        <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                          <User className="h-4 w-4" />
                          <span>Mon profil</span>
                        </Link>
                        <Link href="/loyalty" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                          <Heart className="h-4 w-4 text-rose-500" />
                          <span>Fidelite</span>
                        </Link>
                        <Link href="/referral" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                          <Percent className="h-4 w-4 text-green-500" />
                          <span>Parrainage</span>
                        </Link>
                        <Link href="/receipts" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                          <Receipt className="h-4 w-4 text-primary-600" />
                          <span>Recus et factures</span>
                        </Link>
                        <Link href="/preferences/notifications" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                          <Bell className="h-4 w-4 text-amber-500" />
                          <span>Preferences notifications</span>
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 p-2">
                        <button
                          onClick={() => signOut()}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Deconnexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/auth/login"
                    className="inline-flex min-h-11 items-center rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex min-h-11 items-center rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-800"
                  >
                    Creer un compte
                  </Link>
                </div>
              )}

              {!hideLinks && (
                <button
                  type="button"
                  aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
                  onClick={() => setMobileOpen((open) => !open)}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div aria-hidden="true" className="h-[76px] sm:h-20" />

      {mobileOpen && !hideLinks ? (
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto border-t border-slate-200 bg-white md:hidden sm:top-20">
          <div className="container mx-auto space-y-6 px-4 py-5 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Navigation rapide</p>
                <div className="sm:hidden">
                  <CurrencySelector />
                </div>
              </div>
              <nav className="grid gap-2">
                {primaryNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={item.onClick}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive(item) ? 'bg-primary-700 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'}`}
                    >
                      {Icon ? <Icon className="h-5 w-5" /> : null}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {secondaryNav.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    {Icon ? <Icon className="h-4 w-4 text-primary-600" /> : null}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {professionalLinks.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Espaces professionnels</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {professionalLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link key={link.key} href={link.href} className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900">
                        <Icon className="h-4 w-4 text-primary-600" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {!session ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/auth/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
                  Connexion
                </Link>
                <Link href="/auth/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800">
                  Creer un compte
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

