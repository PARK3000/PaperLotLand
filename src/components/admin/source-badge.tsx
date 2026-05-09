const BADGE_STYLES: Record<string, string> = {
  'Google Ads': 'bg-blue-50 text-blue-700',
  'Paid Search': 'bg-blue-50 text-blue-700',
  Direct: 'bg-gray-100 text-gray-600',
  'Bing Ads': 'bg-teal-50 text-teal-700',
  Organic: 'bg-green-50 text-green-700',
  'Organic Search': 'bg-green-50 text-green-700',
  Email: 'bg-yellow-50 text-yellow-700',
  ActiveCampaign: 'bg-yellow-50 text-yellow-700',
  'Google My Business': 'bg-emerald-50 text-emerald-700',
  Social: 'bg-pink-50 text-pink-700',
  Referral: 'bg-purple-50 text-purple-700',
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${BADGE_STYLES[source] ?? 'bg-gray-100 text-gray-600'}`}>
      {source}
    </span>
  )
}
