const ICON_STYLES: Record<string, string> = {
  '👥': 'from-blue-500 to-blue-600',
  '📊': 'from-indigo-500 to-purple-600',
  '⏱': 'from-emerald-500 to-teal-600',
  '📝': 'from-amber-500 to-orange-500',
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  cta,
  help,
}: {
  icon: string
  label: string
  value: string
  sub: string
  cta?: boolean
  help?: string
}) {
  const gradient = ICON_STYLES[icon] || 'from-gray-500 to-gray-600'

  return (
    <div
      className={`relative bg-white border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        cta ? 'border-blue-200 hover:border-blue-400' : 'border-gray-200/80'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <span className="text-base leading-none drop-shadow-sm filter saturate-0 brightness-200">{icon}</span>
        </div>
        {help && <HelpTooltip text={help} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3 tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-1">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sub}</p>
    </div>
  )
}

export function HelpTooltip({ text }: { text: string }) {
  return (
    <div className="group relative">
      <div className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-help transition-colors">
        <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 leading-none select-none">?</span>
      </div>
      <div className="absolute right-0 top-7 z-50 w-60 px-3.5 py-2.5 bg-gray-900 text-white text-xs leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none">
        {text}
        <div className="absolute -top-1 right-2.5 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </div>
  )
}
