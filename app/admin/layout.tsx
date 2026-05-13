import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { UserRole } from '@/lib/auth'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/auth/login')
    }

    const adminRoles = [
        'ADMINISTRATOR',
        'SUPERVISOR',
        'TRAVELIA_ADMIN',
        'TECH_ADMIN',
        'OPERATIONS_MANAGER',
    ] as const
    if (!adminRoles.includes(session.user.role as (typeof adminRoles)[number])) {
        redirect('/dashboard')
    }

    return (
  <div className="flex min-h-screen overflow-hidden bg-slate-100">
            <AdminSidebar serverUserRole={session.user.role as UserRole} />
    <main className="custom-scrollbar relative h-screen flex-1 overflow-y-auto">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,_rgba(17,135,207,0.28),_transparent_42%),linear-gradient(135deg,_#003580_0%,_#0071c2_52%,_#dff3ff_100%)]" />
      <div className="pointer-events-none absolute right-[-80px] top-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none absolute left-[18%] top-40 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="relative ar-page py-6 md:py-8">
                    {children}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}} />
        </div>
    )
}
