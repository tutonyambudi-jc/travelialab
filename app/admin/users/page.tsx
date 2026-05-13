import { UsersManager } from '@/components/admin/UsersManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminUsersPage() {
  return (
    <>
      <AdminPageHeader
        kicker="Access control"
        title="Gerer les utilisateurs"
        subtitle="Cree des comptes, modifie les roles et active ou desactive les acces depuis une vue plus executive."
        backHref="/admin"
      />

      <UsersManager />
    </>
  )
}
