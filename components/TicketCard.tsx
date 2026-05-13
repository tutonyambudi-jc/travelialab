"use client"

import React from 'react'
import { QrCode, User, Armchair, Calendar, Clock, MapPin, Ticket as TicketIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { buildBookingQrPayload, bookingQrToDataUrl } from '@/lib/booking-qr-payload'

interface TicketCardProps {
  booking: any
  currency: 'FC' | 'USD'
  formatCurrency: (amount: number) => string
}

export function TicketCard({ booking, currency, formatCurrency }: TicketCardProps) {
  const [qrUrl, setQrUrl] = React.useState('')
  React.useEffect(() => {
    if (booking.qrCode?.startsWith('data:image')) {
      setQrUrl(booking.qrCode)
      return
    }
    if (!booking.ticketNumber || !booking.id) {
      setQrUrl('')
      return
    }
    const paymentStatus =
      booking.payment?.status ??
      booking.bookingGroup?.paymentStatus ??
      'NONE'
    const payload = buildBookingQrPayload({
      bookingId: booking.id,
      bookingGroupId: booking.bookingGroupId ?? null,
      ticketNumber: booking.ticketNumber,
      tripId: booking.tripId,
      passengerName: booking.passengerName ?? '',
      bookingStatus: booking.status,
      paymentStatus,
    })
    bookingQrToDataUrl(payload)
      .then(setQrUrl)
      .catch(() => setQrUrl(''))
  }, [booking])
  return (
    <div className="relative max-w-xl mx-auto bg-gradient-to-br from-[#003580] via-[#0071c2] to-[#005da0] rounded-3xl shadow-2xl border border-white/20 flex flex-col md:flex-row overflow-hidden mb-8">
      {/* Bordure pointillée effet détachable */}
      <div className="absolute top-0 right-24 h-full w-8 hidden md:block">
          <div className="h-full border-r-2 border-dashed border-white/30"></div>
      </div>
      {/* Partie gauche principale */}
      <div className="flex-1 p-6 md:p-8 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <TicketIcon className="w-5 h-5 text-blue-100" />
          <span className="font-mono text-xs text-blue-50">{booking.ticketNumber}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-white/80" />
          <span className="font-bold text-lg text-white drop-shadow">{booking.passengerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Armchair className="w-5 h-5 text-blue-100" />
          <span className="font-semibold text-white/90">Siège {booking.seat.seatNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-white/80" />
          <span className="text-white/90 font-semibold">{booking.trip.route.origin} → {booking.trip.route.destination}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-white/80" />
          <span className="text-white/90">{format(new Date(booking.trip.departureTime), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white/80" />
          <span className="text-white/90">Départ à {format(new Date(booking.trip.departureTime), 'HH:mm')}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-blue-50">Type:</span>
          <span className="font-semibold text-white">
            {booking.passengerType === 'ADULT' ? 'Adulte' : booking.passengerType === 'CHILD' ? 'Enfant' : booking.passengerType === 'INFANT' ? 'Bébé' : 'Senior'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-blue-50">Prix:</span>
          <span className="font-bold text-[#f5a623] text-2xl drop-shadow">{formatCurrency(booking.totalPrice)}</span>
        </div>
      </div>
      {/* Partie droite QR code */}
      <div className="flex flex-col items-center justify-center bg-white/10 px-6 py-8 md:min-w-[180px] gap-2">
        <div className="rounded-xl bg-white p-2 shadow-md border border-white/40">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code billet" className="w-24 h-24" />
          ) : (
            <QrCode className="w-24 h-24 text-[#0071c2]" />
          )}
        </div>
        <span className="text-[10px] text-blue-100 font-mono mt-2">{booking.ticketNumber}</span>
      </div>
    </div>
  );
}
