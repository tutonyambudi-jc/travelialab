import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AgentRankingTable, type AgentPerformance } from '@/components/admin/reports/AgentRankingTable'
import { cookies } from 'next/headers'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

async function getAgentStats() {
    const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    })

    const stats = await Promise.all(
        agents.map(async (agent) => {
            const bookings = await prisma.booking.aggregate({
                where: { agentId: agent.id, status: { in: ['CONFIRMED', 'COMPLETED'] } },
                _sum: { totalPrice: true },
                _count: { id: true },
                _max: { createdAt: true },
            })
            const freight = await prisma.freightOrder.aggregate({
                where: { agentId: agent.id },
                _sum: { price: true },
                _count: { id: true },
                _max: { createdAt: true }
            })
            const commissions = await prisma.commission.aggregate({
                where: { agentId: agent.id },
                _sum: { amount: true },
            })

            const lastSale = [bookings._max.createdAt, freight._max.createdAt]
                .filter(Boolean)
                .sort((a, b) => b!.getTime() - a!.getTime())[0]

            return {
                id: agent.id,
                name: `${agent.firstName} ${agent.lastName}`,
                email: agent.email,
                salesCount: (bookings._count.id || 0) + (freight._count.id || 0),
                totalRevenue: (bookings._sum.totalPrice || 0) + (freight._sum.price || 0),
                totalCommission: commissions._sum.amount || 0,
                lastSaleDate: lastSale,
            } satisfies AgentPerformance
        })
    )
    return stats.sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export default async function AgentPerformancePage() {
    const cookieStore = await cookies()
    const currency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
    const agentStats = await getAgentStats()

    const totalAgentRevenue = agentStats.reduce((acc, curr) => acc + curr.totalRevenue, 0)
    const totalCommissions = agentStats.reduce((acc, curr) => acc + curr.totalCommission, 0)

    return (
        <>
            <AdminPageHeader
                kicker="Agent analytics"
                title="Performance des agents"
                subtitle="Suivi des ventes, du chiffre d'affaires et des commissions dans une lecture plus executive."
                backHref="/admin"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Agents</div>
                    <div className="text-2xl font-bold text-slate-900">{agentStats.length}</div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Chiffre d'affaires</div>
                    <div className="text-2xl font-bold text-slate-900">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(totalAgentRevenue)}
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Total Commissions</div>
                    <div className="text-2xl font-bold text-slate-900">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(totalCommissions)}
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Ratio Moyen</div>
                    <div className="text-2xl font-bold text-[#0071c2]">
                        {totalAgentRevenue > 0 ? ((totalCommissions / totalAgentRevenue) * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>

            <AgentRankingTable agents={agentStats} currency={currency} />
        </>
    )
}
