import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditOfferForm } from '@/components/admin/EditOfferForm'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params
    const offer = await prisma.offer.findUnique({
        where: { id: p.id },
    })

    if (!offer) {
        notFound()
    }

    // Serialize only dates or simply JSON-parse-stringify to avoid "Plain Object" errors
    const serializedOffer = JSON.parse(JSON.stringify(offer))

    return (
        <>
            <AdminPageHeader
                kicker="Promotions"
                title="Modifier l'offre"
                subtitle={`Modification de ${offer.title}`}
                backHref="/admin/offers"
                backLabel="Retour"
            />
            <EditOfferForm offer={serializedOffer} />
        </>
    )
}
