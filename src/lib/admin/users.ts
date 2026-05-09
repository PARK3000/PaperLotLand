import { createHash, randomUUID } from 'crypto'
import { neon } from '@neondatabase/serverless'
import type { AdminRole } from './session'

export interface AdminUser {
  id: string
  email: string
  passwordHash: string
  name: string
  role: AdminRole
  createdAt: string
}

interface DbUserRow {
  id: string
  email: string
  password_hash: string
  name: string
  role: string
  created_at: string | Date
}

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

export function hashPassword(password: string, userId: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'wbavh-admin-secret-change-me'
  return createHash('sha256').update(`${password}:${userId}:${secret}`).digest('hex')
}

function rowToUser(row: DbUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role as AdminRole,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }
}

export async function getUsers(): Promise<AdminUser[]> {
  const sql = getDb()
  const rows = (await sql`
    SELECT id, email, password_hash, name, role, created_at FROM admin_users ORDER BY created_at ASC
  `) as DbUserRow[]
  return rows.map(rowToUser)
}

export async function getUserById(id: string): Promise<AdminUser | undefined> {
  const sql = getDb()
  const rows = (await sql`
    SELECT id, email, password_hash, name, role, created_at FROM admin_users WHERE id = ${id}
  `) as DbUserRow[]
  return rows[0] ? rowToUser(rows[0]) : undefined
}

export async function getUserByEmail(email: string): Promise<AdminUser | undefined> {
  const sql = getDb()
  const rows = (await sql`
    SELECT id, email, password_hash, name, role, created_at FROM admin_users WHERE email = ${email.toLowerCase()}
  `) as DbUserRow[]
  return rows[0] ? rowToUser(rows[0]) : undefined
}

export async function createUser(data: {
  email: string
  password: string
  name: string
  role: AdminRole
}): Promise<AdminUser> {
  const sql = getDb()
  const id = randomUUID()
  try {
    const rows = (await sql`
      INSERT INTO admin_users (id, email, password_hash, name, role)
      VALUES (${id}, ${data.email.toLowerCase()}, ${hashPassword(data.password, id)}, ${data.name}, ${data.role})
      RETURNING id, email, password_hash, name, role, created_at
    `) as DbUserRow[]
    if (!rows[0]) throw new Error('A user with that email already exists')
    return rowToUser(rows[0])
  } catch (e: unknown) {
    const msg = (e as Error).message
    if (msg.includes('duplicate') || msg.includes('unique')) {
      throw new Error('A user with that email already exists')
    }
    throw e
  }
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<AdminUser, 'name' | 'role' | 'email'>> & { password?: string }
): Promise<AdminUser> {
  const existing = await getUserById(id)
  if (!existing) throw new Error('User not found')

  const name = updates.name ?? existing.name
  const role = updates.role ?? existing.role
  const email = updates.email ? updates.email.toLowerCase() : existing.email
  const passwordHash = updates.password ? hashPassword(updates.password, id) : existing.passwordHash

  const sql = getDb()
  const rows = (await sql`
    UPDATE admin_users
    SET name = ${name}, role = ${role}, email = ${email}, password_hash = ${passwordHash}
    WHERE id = ${id}
    RETURNING id, email, password_hash, name, role, created_at
  `) as DbUserRow[]
  if (!rows[0]) throw new Error('User not found')
  return rowToUser(rows[0])
}

export async function deleteUser(id: string): Promise<void> {
  const sql = getDb()
  const superAdmins = (await sql`SELECT id FROM admin_users WHERE role = 'super_admin'`) as { id: string }[]
  const isLastSuperAdmin = superAdmins.length === 1 && superAdmins[0].id === id
  if (isLastSuperAdmin) throw new Error('Cannot delete the last super admin')

  const result = (await sql`DELETE FROM admin_users WHERE id = ${id} RETURNING id`) as { id: string }[]
  if (result.length === 0) throw new Error('User not found')
}
