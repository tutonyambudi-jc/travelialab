import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SeatVisibilityManager from '@/components/admin/SeatVisibilityManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function BusSeatsPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params
    
    const bus = await prisma.bus.findUnique({
        where: { id: p.id },
        include: { 
            company: true,
            seats: {
                orderBy: {
                    seatNumber: 'asc'
                }
            }
        },
    })

    if (!bus) {
        notFound()
    }

    return (
        <>
            <AdminPageHeader
                kicker="Capacite & siege"
                title="Gestion des sieges"
                subtitle={`${bus.name} (${bus.plateNumber}) • ${bus.seats.length} sieges configures • Capacite ${bus.capacity}`}
                actions={
                    <Link href={`/admin/buses/${bus.id}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
                        Modifier le bus
                    </Link>
                }
                backHref="/admin/buses"
                backLabel="Tous les bus"
            />

            <SeatVisibilityManager busId={bus.id} seats={bus.seats} />
        </>
    )
}
