import { AdsManager } from '@/components/admin/AdsManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminAdvertisementsPage() {
  return (
    <>
      <AdminPageHeader
        kicker="Commercial & visibilite"
        title="Publicites"
        subtitle="Gere les annonces affichees sur le frontend avec une presentation plus premium et plus claire."
        backHref="/admin"
      />
      <AdsManager />
    </>
  )
}
