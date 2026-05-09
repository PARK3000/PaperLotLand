import { cn } from '@/lib/utils'
import { forwardRef, type HTMLAttributes } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium',
          // Sizes
          size === 'sm' && 'rounded px-2 py-0.5 text-xs',
          size === 'md' && 'rounded-md px-2.5 py-1 text-sm',
          // Variants
          variant === 'default' &&
            'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
          variant === 'primary' &&
            'bg-[var(--color-primary-50)] text-[var(--color-primary)]',
          variant === 'secondary' &&
            'bg-gray-100 text-[var(--color-secondary)]',
          variant === 'success' &&
            'bg-[var(--color-success-light)] text-green-700',
          variant === 'warning' &&
            'bg-[var(--color-warning-light)] text-amber-700',
          variant === 'error' &&
            'bg-[var(--color-error-light)] text-red-700',
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
