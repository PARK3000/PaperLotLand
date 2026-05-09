interface KeyTakeawaysBoxProps {
  items: string[]
}

export function KeyTakeawaysBox({ items }: KeyTakeawaysBoxProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="mb-8 rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-6">
      <p className="mb-3 flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
        <svg
          className="h-5 w-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
        Key Takeaways
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
