import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'

export const dynamic = 'force-dynamic'

export default async function OffersPage() {
    const offers = await prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
    })

    return (
        <>
            <AdminPageHeader
                title="Gestion des offres"
                subtitle="Creez et gerez vos codes promo et reductions"
                backHref="/admin"
                backLabel="Retour admin"
                actions={
                    <Link href="/admin/offers/create" className="ar-btn ar-btn-md ar-btn-primary">
                        + Nouvelle offre
                    </Link>
                }
            />

            <div className="ar-card ar-card-body">
                <div className="ar-table-wrap">
                <table className="ar-table w-full text-left">
                    <thead>
                        <tr>
                            <th>Titre / Code</th>
                            <th>Reduction</th>
                            <th>Validite</th>
                            <th>Utilisations</th>
                            <th>Statut</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    Aucune offre trouvée. Créez votre première offre !
                                </td>
                            </tr>
                        ) : (
                            offers.map((offer) => (
                                <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                                    <td>
                                        <div className="font-medium text-slate-900">{offer.title}</div>
                                        {offer.code && (
                                            <div className="mt-1 inline-block rounded border border-primary-100 bg-primary-50 px-2 py-0.5 text-sm font-mono text-primary-600">
                                                {offer.code}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="font-bold text-slate-900">
                                            {offer.discountType === 'PERCENTAGE' ? `-${offer.discountValue}%` : `-${formatCurrency(offer.discountValue, 'FC')}`}
                                        </div>
                                        {offer.minAmount && (
                                            <div className="mt-1 text-xs text-slate-500">
                                                Min. {formatCurrency(offer.minAmount, 'FC')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-sm text-slate-600">
                                        <div>Du {format(offer.startDate, 'dd/MM/yyyy', { locale: fr })}</div>
                                        <div>Au {format(offer.endDate, 'dd/MM/yyyy', { locale: fr })}</div>
                                    </td>
                                    <td className="text-sm text-slate-600">
                                        <span className="font-medium text-slate-900">{offer.usedCount}</span>
                                        {offer.usageLimit && <span className="text-slate-400"> / {offer.usageLimit}</span>}
                                    </td>
                                    <td>
                                        <AdminStatusBadge status={offer.isActive ? 'ACTIVE' : 'INACTIVE'} />
                                    </td>
                                    <td className="text-right">
                                        <Link
                                            href={`/admin/offers/${offer.id}`}
                                            className="text-sm font-medium text-primary-600 hover:text-primary-800"
                                        >
                                            Modifier
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </>
    )
}
