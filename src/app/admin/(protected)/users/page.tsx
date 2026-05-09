import { getUsers } from '@/lib/admin/users'
import { UsersManager } from '@/components/admin/users-manager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = (await getUsers()).map(({ passwordHash: _ph, ...u }) => u)
  return <UsersManager initialUsers={users} />
}
