import { AgencyDirectory } from '@/components/agent/AgencyDirectory'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminAgenciesPage() {
    return (
        <>
            <AdminPageHeader
                kicker="Reseau partenaires"
                title="Annuaire des agences"
                subtitle="Consulte rapidement toutes les agences partenaires avec un habillage plus haut de gamme et plus lisible."
                backHref="/admin"
            />

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.35)]">
                <AgencyDirectory />
            </div>
        </>
    )
}
