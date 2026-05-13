'use client'

import { usePathname } from 'next/navigation'

export function useSafePathname() {
  return usePathname() || '/'
}
