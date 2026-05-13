import { FreightAdminManager } from '@/components/admin/FreightAdminManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminFreightPage() {
    return (
        <>
            <AdminPageHeader
                kicker="Colis & logistique"
                title="Gestion des colis"
                subtitle="Suivi complet des expeditions, paiements et statuts de livraison depuis une vue admin plus claire."
                backHref="/admin"
            />

            <FreightAdminManager />
        </>
    )
}
