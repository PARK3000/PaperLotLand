const SOURCE_COLORS: Record<string, string> = {
  'Google Ads': 'bg-blue-500',
  'Paid Search': 'bg-blue-500',
  'Direct': 'bg-slate-400',
  'Bing Ads': 'bg-teal-500',
  'Organic': 'bg-emerald-500',
  'Organic Search': 'bg-emerald-500',
  'Email': 'bg-amber-400',
  'ActiveCampaign': 'bg-amber-400',
  'Google My Business': 'bg-green-500',
  'Social': 'bg-pink-500',
  'Referral': 'bg-violet-500',
}

const FALLBACK_COLORS = ['bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-rose-400']

const DOT_COLORS: Record<string, string> = {
  'Google Ads': 'bg-blue-500',
  'Paid Search': 'bg-blue-500',
  'Direct': 'bg-slate-400',
  'Bing Ads': 'bg-teal-500',
  'Organic': 'bg-emerald-500',
  'Organic Search': 'bg-emerald-500',
  'Email': 'bg-amber-400',
  'ActiveCampaign': 'bg-amber-400',
  'Google My Business': 'bg-green-500',
  'Social': 'bg-pink-500',
  'Referral': 'bg-violet-500',
}

function getBarColor(label: string, index: number): string {
  return SOURCE_COLORS[label] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function getDotColor(label: string, index: number): string {
  return DOT_COLORS[label] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export function LeadSourcesChart({ sources }: { sources: { label: string; count: number }[] }) {
  const total = sources.reduce((a, b) => a + b.count, 0)

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Lead Sources</h2>
        {total > 0 && (
          <span className="text-xs text-gray-400 font-medium">{total} total</span>
        )}
      </div>
      {sources.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No lead data yet</p>
      ) : (
        <div className="space-y-3.5">
          {sources.map((s, i) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getDotColor(s.label, i)}`} />
                    <span className="text-sm text-gray-700">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{pct}%</span>
                    <span className="text-sm font-semibold text-gray-900 w-6 text-right">{s.count}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(s.label, i)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
