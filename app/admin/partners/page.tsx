import { prisma } from '@/lib/prisma'
import { PassengerManifestManager } from '@/components/admin/PassengerManifestManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminPartnersPage() {
  const [companies, buses] = await Promise.all([
    prisma.busCompany.findMany({ orderBy: { name: 'asc' } }),
    prisma.bus.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { company: true },
    }),
  ])

  return (
    <>
      <AdminPageHeader
        kicker="Partenaires reseau"
        title="Partenaires & manifestes"
        subtitle="Partage les listes de passagers via liens securises avec un rendu plus premium et plus lisible."
        backHref="/admin"
        backLabel="Retour"
      />
      <PassengerManifestManager companies={companies} buses={buses} />
    </>
  )
}
