import { getBuyers } from '@/lib/admin/buyers'
import { BuyersManager } from '@/components/admin/buyers-manager'

export const dynamic = 'force-dynamic'

export default async function AdminBuyersPage() {
  let buyers: Awaited<ReturnType<typeof getBuyers>> = []
  let dbError = false
  try {
    buyers = await getBuyers()
  } catch {
    dbError = true
  }

  if (dbError) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-[23px] font-normal text-[#1d2327] leading-tight mb-5">Buyers</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          Unable to load buyers. Check that <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">DATABASE_URL</code> is configured and the buyers table has been created (<code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">npx tsx scripts/setup-buyers-db.ts</code>).
        </div>
      </div>
    )
  }

  return <BuyersManager initialBuyers={buyers} />
}
