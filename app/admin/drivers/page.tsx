import { DriversManager } from '@/components/admin/DriversManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminDriversPage() {
  return (
    <>
      <AdminPageHeader
        kicker="Operations flotte"
        title="Gerer les chauffeurs"
        subtitle="Affectation, disponibilites et pilotage des chauffeurs dans une interface plus premium."
        backHref="/admin"
        backLabel="Retour"
      />
      <DriversManager />
    </>
  )
}
