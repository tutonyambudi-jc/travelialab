const DEDICATED_APP_SHELL_PREFIXES = [
  '/admin',
  '/agency',
  '/agent',
  '/auth',
  '/bookings',
  '/dashboard',
  '/logistics',
  '/loyalty',
  '/partner',
  '/profile',
  '/referral',
  '/reservations',
  '/super-agent',
  '/trips/search',
]

export function hasDedicatedAppShell(pathname: string) {
  return DEDICATED_APP_SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export function shouldRenderPublicNavigation(pathname: string) {
  return !hasDedicatedAppShell(pathname)
}

export function shouldHideMobileBottomNav(pathname: string) {
  return hasDedicatedAppShell(pathname)
}

export function getPublicNavigationProps(pathname: string) {
  return {
    hideLinks: pathname === '/freight',
  }
}
