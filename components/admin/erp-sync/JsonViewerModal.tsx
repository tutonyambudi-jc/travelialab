'use client'

import { redactSecrets } from '@/lib/travelia-erp-redact'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  raw: string | null
}

function formatBody(raw: string | null): string {
  if (raw == null || raw === '') return '—'
  const safe = redactSecrets(raw)
  try {
    return JSON.stringify(JSON.parse(safe), null, 2)
  } catch {
    return safe
  }
}

export function JsonViewerModal({ open, onOpenChange, title, subtitle, raw }: Props) {
  const body = formatBody(raw)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <div className="border-b border-slate-200 px-6 py-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
        </div>
        <div className="max-h-[calc(90vh-8rem)] overflow-auto bg-slate-950 px-4 py-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-sky-100">
            {body}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
