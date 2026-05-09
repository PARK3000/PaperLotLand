'use client'

import dynamic from 'next/dynamic'
import { Modal, ModalCloseButton } from '@/components/ui/modal'
import { usePopupTriggers } from '@/lib/hooks/use-popup-triggers'

const InlineLeadForm = dynamic(
  () => import('@/components/sections/lead-form').then(m => ({ default: m.InlineLeadForm })),
  { ssr: false }
)

export function LeadCapturePopup() {
  const { isVisible, dismiss, trackConversion } = usePopupTriggers()

  const handleFormSuccess = () => {
    trackConversion()
    setTimeout(() => {
      dismiss()
    }, 2000)
  }

  if (!isVisible) return null

  return (
    <Modal isOpen={isVisible} onClose={dismiss} maxWidth="lg">
      <div className="relative rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <ModalCloseButton onClick={dismiss} />

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            Wait! Before You Go...
          </h2>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Get your <span className="font-semibold text-[var(--color-primary)]">FREE</span>,
            no-obligation cash offer.
            <br />
            Most homeowners hear back within 24 hours.
          </p>
        </div>

        {/* Form */}
        <InlineLeadForm
          formId="popup-form"
          buttonText="Get My Free Cash Offer"
          onSuccess={handleFormSuccess}
        />

        {/* Social Proof */}
        <div className="mt-6 flex items-center justify-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
            ))}
          </div>
          <span className="ml-1 text-sm text-[var(--color-text-muted)]">
            &ldquo;Closed in 7 days — exactly as promised!&rdquo;
            <span className="text-[var(--color-text)]"> — Recent Client</span>
          </span>
        </div>

        {/* Benefits */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <CheckIcon className="h-4 w-4 text-green-500" />
            No obligation
          </span>
          <span className="flex items-center gap-1">
            <CheckIcon className="h-4 w-4 text-green-500" />
            No fees
          </span>
          <span className="flex items-center gap-1">
            <CheckIcon className="h-4 w-4 text-green-500" />
            Close in 7 days
          </span>
        </div>
      </div>
    </Modal>
  )
}

// Icons
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
