import BlogEditor from '@/components/admin/blog-editor'
import { headers } from 'next/headers'

export default async function NewBlogPage() {
  const hdrs = await headers()
  const authorName = hdrs.get('x-admin-user-name') ?? 'Admin'

  return <BlogEditor mode="new" initialData={{ author: authorName }} />
}
