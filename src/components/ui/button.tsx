import { cn } from '@/lib/utils'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

interface ButtonClassNameOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonClassNameOptions = {}) {
  return cn(
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' &&
      'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] focus-visible:ring-[var(--color-primary)] active:scale-[0.98]',
    variant === 'secondary' &&
      'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dark)] focus-visible:ring-[var(--color-secondary)] active:scale-[0.98]',
    variant === 'accent' &&
      'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] focus-visible:ring-[var(--color-accent)] active:scale-[0.98] shadow-[0_4px_24px_rgba(200,72,72,0.40),0_2px_8px_rgba(200,72,72,0.25)] hover:shadow-[0_6px_32px_rgba(200,72,72,0.55),0_3px_12px_rgba(200,72,72,0.35)]',
    variant === 'outline' &&
      'border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white focus-visible:ring-[var(--color-primary)]',
    variant === 'ghost' &&
      'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] focus-visible:ring-[var(--color-primary)]',
    size === 'sm' && 'rounded-md px-3 py-1.5 text-sm',
    size === 'md' && 'rounded-lg px-5 py-2.5 text-base',
    size === 'lg' && 'rounded-lg px-6 py-3 text-lg',
    size === 'xl' && 'rounded-lg px-8 py-4 text-xl',
    fullWidth && 'w-full',
    className
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={buttonClassName({ variant, size, fullWidth, className })}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
