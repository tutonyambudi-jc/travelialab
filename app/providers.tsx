'use client'

import { useEffect, useMemo, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { MainContentWrapper } from '@/components/layout/MainContentWrapper'

type Subscriber = (count: number) => void

let activeRequestCount = 0
const subscribers = new Set<Subscriber>()

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber(activeRequestCount))
}

function subscribeToRequests(subscriber: Subscriber) {
  subscribers.add(subscriber)
  subscriber(activeRequestCount)
  return () => {
    subscribers.delete(subscriber)
  }
}

function installFetchInterceptor() {
  if (typeof window === 'undefined') return

  const w = window as typeof window & {
    __aigleOriginalFetch?: typeof fetch
    __aigleFetchInterceptorInstalled?: boolean
  }

  if (w.__aigleFetchInterceptorInstalled) return

  w.__aigleOriginalFetch = w.fetch.bind(w)

  w.fetch = async (...args: Parameters<typeof fetch>) => {
    activeRequestCount += 1
    notifySubscribers()

    try {
      return await (w.__aigleOriginalFetch as typeof fetch)(...args)
    } finally {
      activeRequestCount = Math.max(0, activeRequestCount - 1)
      notifySubscribers()
    }
  }

  w.__aigleFetchInterceptorInstalled = true
}

function GlobalRequestLoader({ active, count }: { active: boolean; count: number }) {
  return (
    <>
      <div
        className={`pointer-events-none fixed left-0 right-0 top-0 z-[100] h-1 overflow-hidden transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        <div className="request-loader-bar" />
      </div>

      <div
        className={`pointer-events-none fixed right-4 top-4 z-[101] transition-all duration-200 ${
          active ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <span className="request-loader-dot" />
          <span className="text-xs font-semibold text-blue-900">Chargement</span>
          <span className="text-xs font-bold text-blue-700">{count}</span>
        </div>
      </div>
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    installFetchInterceptor()
    return subscribeToRequests(setRequestCount)
  }, [])

  const active = useMemo(() => requestCount > 0, [requestCount])

  return (
    <SessionProvider>
      <GlobalRequestLoader active={active} count={requestCount} />
      <MainContentWrapper>
        {children}
      </MainContentWrapper>
    </SessionProvider>
  )
}
