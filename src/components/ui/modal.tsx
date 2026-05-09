'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean
  /**
   * Callback when modal should close
   */
  onClose: () => void
  /**
   * Modal content
   */
  children: React.ReactNode
  /**
   * Whether clicking the overlay closes the modal
   * @default true
   */
  closeOnOverlayClick?: boolean
  /**
   * Whether pressing Escape closes the modal
   * @default true
   */
  closeOnEscape?: boolean
  /**
   * Additional classes for the modal container
   */
  className?: string
  /**
   * Maximum width of the modal
   * @default 'lg'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
}

export function Modal({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  maxWidth = 'lg',
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Ensure we only render on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle Escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose()
      }
    },
    [closeOnEscape, onClose]
  )

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === overlayRef.current) {
        onClose()
      }
    },
    [closeOnOverlayClick, onClose]
  )

  // Manage body scroll and focus
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Prevent body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'

      // Add event listener for Escape
      document.addEventListener('keydown', handleEscape)

      // Focus the modal content
      contentRef.current?.focus()

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalStyle

        // Remove event listener
        document.removeEventListener('keydown', handleEscape)

        // Restore focus to previous element
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen, handleEscape])

  // Don't render on server or if not mounted
  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop — pointer-events-none lets clicks reach the overlay so closeOnOverlayClick fires */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full outline-none',
          'animate-in fade-in zoom-in-95 duration-200',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

// Close button component for convenience
interface ModalCloseButtonProps {
  onClick: () => void
  className?: string
}

export function ModalCloseButton({ onClick, className }: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5',
        'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300',
        className
      )}
      aria-label="Close"
    >
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  )
}
