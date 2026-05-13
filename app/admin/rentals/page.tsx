import { RentalManagement } from '@/components/admin/RentalManagement'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminRentalsPage() {
    return (
        <>
            <AdminPageHeader
                kicker="Mobilite premium"
                title="Locations de bus"
                subtitle="Pilote les demandes, attribue les vehicules et valide les devis avec une mise en page plus booking."
                backHref="/admin"
            />

            <RentalManagement />
        </>
    )
}
