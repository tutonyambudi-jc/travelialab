import { prisma } from '@/lib/prisma'
import { PassengerManifestManager } from '@/components/admin/PassengerManifestManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminManifestsPage() {
    // Charger les données nécessaires pour les filtres
    const [companies, buses] = await Promise.all([
        prisma.busCompany.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        prisma.bus.findMany({
            select: { id: true, name: true, plateNumber: true, company: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' },
        }),
    ])

    return (
        <>
            <AdminPageHeader
                kicker="Operations terrain"
                title="Manifest passagers"
                subtitle="Genere, verifie et partage les listes passagers avec une presentation plus premium et plus lisible."
                backHref="/admin"
            />

            <PassengerManifestManager companies={companies} buses={buses} />
        </>
    )
}
