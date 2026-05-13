import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userRoleCanAccessErpSyncQueue } from '@/lib/travelia-erp-sync-queue-roles'
import SyncQueuePage from '@/components/admin/erp-sync/SyncQueuePage'

export default async function TraveliaErpSyncQueueAdminPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!userRoleCanAccessErpSyncQueue(role)) {
    redirect('/admin')
  }

  return <SyncQueuePage />
}
