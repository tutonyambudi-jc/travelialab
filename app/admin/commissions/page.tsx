import { prisma } from '@/lib/prisma'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cookies } from 'next/headers'
import { CommissionActionButtons } from '@/components/admin/CommissionActionButtons'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export const dynamic = 'force-dynamic'

export default async function CommissionsPage() {
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

    const [commissions, stats] = await Promise.all([
        prisma.commission.findMany({
            include: {
                agent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.commission.aggregate({
            _sum: { amount: true },
            _count: true,
        }),
    ])

    const pendingCommissions = commissions.filter(c => c.status === 'PENDING')
    const paidCommissions = commissions.filter(c => c.status === 'PAID')
    const totalPending = pendingCommissions.reduce((sum, c) => sum + c.amount, 0)
    const totalPaid = paidCommissions.reduce((sum, c) => sum + c.amount, 0)

    return (
        <>
            <AdminPageHeader
                kicker="Finance operations"
                title="Gestion des commissions"
                subtitle="Gere les commissions agents, les montants et les statuts dans une interface plus executive."
                backHref="/admin"
                backLabel="Retour"
                actions={
                    <Link href="/admin/commissions/settings" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
                        Parametres
                    </Link>
                }
            />

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Total Commissions</div>
                    <div className="text-3xl font-bold text-gray-900">{stats._count}</div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Montant Total</div>
                    <div className="text-2xl font-bold text-[#0071c2]">
                        {formatCurrency(stats._sum.amount || 0, currency)}
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">En Attente</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(totalPending, currency)}
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Payées</div>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalPaid, currency)}
                    </div>
                </div>
            </div>

            {/* Commissions Table */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_50px_-45px_rgba(15,23,42,0.35)]">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pourcentage</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {commissions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Aucune commission trouvée.
                                </td>
                            </tr>
                        ) : (
                            commissions.map((commission) => (
                                <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {commission.agent.firstName} {commission.agent.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500">{commission.agent.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">
                                            {formatCurrency(commission.amount, currency)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {commission.percentage}%
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div>{format(commission.createdAt, 'dd/MM/yyyy', { locale: fr })}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${commission.status === 'PAID'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {commission.status === 'PAID' ? 'Payée' : 'En attente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <CommissionActionButtons
                                            commissionId={commission.id}
                                            status={commission.status}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}
