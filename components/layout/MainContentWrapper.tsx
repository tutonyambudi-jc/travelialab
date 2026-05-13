'use client'

import { Navigation } from '@/components/layout/Navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { PublicNavigationProvider } from '@/components/layout/PublicNavigationContext'
import { getPublicNavigationProps, shouldHideMobileBottomNav, shouldRenderPublicNavigation } from '@/lib/app-shell'
import { useSafePathname } from '@/lib/use-safe-pathname'

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const pathname = useSafePathname()
    const showPublicNavigation = shouldRenderPublicNavigation(pathname)
    const hideMobileBottomNav = shouldHideMobileBottomNav(pathname)

    return (
        <>
            {showPublicNavigation ? <Navigation {...getPublicNavigationProps(pathname)} /> : null}
            <PublicNavigationProvider value={showPublicNavigation}>
                <div className={hideMobileBottomNav ? 'pb-0' : 'pb-16 md:pb-0'}>
                    {children}
                </div>
            </PublicNavigationProvider>
            {hideMobileBottomNav ? null : <MobileBottomNav />}
        </>
    )
}
