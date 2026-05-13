import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userRoleCanAccessErpSyncQueue } from '@/lib/travelia-erp-sync-queue-roles'
import SettingsPageClient from './SettingsPageClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const showTraveliaErpSyncLink = userRoleCanAccessErpSyncQueue(role)

  return <SettingsPageClient showTraveliaErpSyncLink={showTraveliaErpSyncLink} />
}
