'use client'

import { Printer } from 'lucide-react'

interface PrintInvoiceButtonProps {
    bookingId: string
}

export function PrintInvoiceButton({ bookingId }: PrintInvoiceButtonProps) {
    return (
        <button
            onClick={() => window.open(`/bookings/${bookingId}/confirmation?facture=true&print=true`, '_blank')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-[14px] font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
            <Printer className="h-4 w-4" />
            Imprimer facture
        </button>
    )
}
