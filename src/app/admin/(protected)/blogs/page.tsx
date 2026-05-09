import { getAllPostsMetaAdmin } from '@/lib/blog'
import { headers } from 'next/headers'
import { PostsManager } from '@/components/admin/posts-manager'

export const dynamic = 'force-dynamic'

export default async function AdminBlogsPage() {
  const [posts, hdrs] = await Promise.all([
    getAllPostsMetaAdmin(),
    headers(),
  ])

  const isSuperAdmin = hdrs.get('x-admin-user-role') === 'super_admin'

  return <PostsManager initialPosts={posts} isSuperAdmin={isSuperAdmin} />
}
