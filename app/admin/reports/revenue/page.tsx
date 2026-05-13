import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { cookies } from 'next/headers'
import { RevenueCharts } from '@/components/admin/reports/RevenueCharts'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, subMonths, format } from 'date-fns'
import { fr } from 'date-fns/locale'

async function getFinancialStats() {
    const now = new Date()
    const startDay = startOfDay(now)
    const startWeek = startOfWeek(now, { locale: fr })
    const startMonth = startOfMonth(now)
    const startQuarter = startOfQuarter(now)
    const startSemester = now.getMonth() >= 6 ? new Date(now.getFullYear(), 6, 1) : new Date(now.getFullYear(), 0, 1)
    const startYear = startOfYear(now)

    const [daily, weekly, monthly, quarterly, semestrial, annual, allTime] = await Promise.all([
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startDay } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startWeek } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startMonth } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startQuarter } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startSemester } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startYear } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    ])

    return {
        daily: daily._sum.amount || 0,
        weekly: weekly._sum.amount || 0,
        monthly: monthly._sum.amount || 0,
        quarterly: quarterly._sum.amount || 0,
        semestrial: semestrial._sum.amount || 0,
        annual: annual._sum.amount || 0,
        allTime: allTime._sum.amount || 0,
    }
}

async function getGraphData() {
    const thirtyDaysAgo = subDays(new Date(), 30)
    const dailyPayments = await prisma.payment.findMany({
        where: { status: 'PAID', paidAt: { gte: thirtyDaysAgo } },
        select: { paidAt: true, amount: true },
        orderBy: { paidAt: 'asc' }
    })

    const dailyMap = new Map<string, number>()
    for (let i = 0; i <= 30; i++) {
        const d = format(subDays(new Date(), 30 - i), 'dd MMM', { locale: fr })
        dailyMap.set(d, 0)
    }
    dailyPayments.forEach(p => {
        if (p.paidAt) {
            const d = format(p.paidAt, 'dd MMM', { locale: fr })
            dailyMap.set(d, (dailyMap.get(d) || 0) + p.amount)
        }
    })

    const twelveMonthsAgo = subMonths(new Date(), 12)
    const monthlyPayments = await prisma.payment.findMany({
        where: { status: 'PAID', paidAt: { gte: twelveMonthsAgo } },
        select: { paidAt: true, amount: true },
        orderBy: { paidAt: 'asc' }
    })

    const monthlyMap = new Map<string, number>()
    for (let i = 0; i < 12; i++) {
        const d = format(subMonths(new Date(), 11 - i), 'MMM yyyy', { locale: fr })
        monthlyMap.set(d, 0)
    }
    monthlyPayments.forEach(p => {
        if (p.paidAt) {
            const d = format(p.paidAt, 'MMM yyyy', { locale: fr })
            monthlyMap.set(d, (monthlyMap.get(d) || 0) + p.amount)
        }
    })

    return {
        dailyData: Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount })),
        monthlyData: Array.from(monthlyMap.entries()).map(([date, amount]) => ({ date, amount }))
    }
}

export default async function RevenueReportPage() {
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'
    const [stats, graphData] = await Promise.all([getFinancialStats(), getGraphData()])

    const statCards = [
        { label: "Aujourd'hui", value: stats.daily, color: "bg-blue-50 text-blue-700 border-blue-200" },
        { label: "Cette Semaine", value: stats.weekly, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        { label: "Ce Mois", value: stats.monthly, color: "bg-teal-50 text-teal-700 border-teal-200" },
        { label: "Ce Trimestre", value: stats.quarterly, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        { label: "Ce Semestre", value: stats.semestrial, color: "bg-amber-50 text-amber-700 border-amber-200" },
        { label: "Cette Année", value: stats.annual, color: "bg-purple-50 text-purple-700 border-purple-200" },
    ]

    return (
        <>
            <AdminPageHeader
                kicker="Revenue analytics"
                title="Rapport financier"
                subtitle="Performance financiere detaillee avec indicateurs rapides et visualisation plus premium."
                backHref="/admin"
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.label} className={`rounded-[22px] border bg-white p-4 shadow-sm ${stat.color}`}>
                        <div className="text-xs font-medium uppercase opacity-80 mb-1">{stat.label}</div>
                        <div className="text-lg font-bold">{formatCurrency(stat.value, currency)}</div>
                    </div>
                ))}
            </div>

            <RevenueCharts dailyData={graphData.dailyData} monthlyData={graphData.monthlyData} currency={currency} />

            <div className="mt-8 rounded-[28px] bg-gradient-to-r from-slate-950 via-[#003580] to-[#0071c2] p-8 text-center text-white shadow-[0_24px_60px_-35px_rgba(0,53,128,0.55)]">
                <h2 className="mb-2 text-lg font-medium text-blue-100">Chiffre d'Affaires Total</h2>
                <div className="text-5xl font-bold tracking-tight">{formatCurrency(stats.allTime, currency)}</div>
            </div>
        </>
    )
}
