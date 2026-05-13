'use client'

import { createContext, useContext } from 'react'

const PublicNavigationContext = createContext(false)

export function PublicNavigationProvider({ children, value }: { children: React.ReactNode; value: boolean }) {
  return <PublicNavigationContext.Provider value={value}>{children}</PublicNavigationContext.Provider>
}

export function usePublicNavigationManaged() {
  return useContext(PublicNavigationContext)
}
