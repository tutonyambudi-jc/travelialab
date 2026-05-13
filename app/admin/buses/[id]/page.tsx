import { prisma } from '@/lib/prisma'
import { BusRegistrationForm } from '@/components/admin/BusRegistrationForm'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { notFound } from 'next/navigation'

export default async function EditBusPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params
    const bus = await prisma.bus.findUnique({
        where: { id: p.id },
        include: { company: true },
    })

    if (!bus) {
        notFound()
    }

    return (
        <>
            <AdminPageHeader
                kicker="Flotte"
                title="Modifier le bus"
                subtitle={`${bus.name} (${bus.plateNumber})`}
                backHref="/admin/buses"
                backLabel="Retour aux bus"
            />

            <div className="max-w-4xl mx-auto">
                <BusRegistrationForm
                    initialData={{
                        id: bus.id,
                        companyName: bus.company?.name || '',
                        name: bus.name,
                        plateNumber: bus.plateNumber,
                        brand: bus.brand || '',
                        capacity: bus.capacity,
                        amenities: bus.amenities || '',
                        seatType: bus.seatType as 'STANDARD' | 'VIP',
                    }}
                />
            </div>
        </>
    )
}
