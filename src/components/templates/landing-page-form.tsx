'use client'

import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input'
import { useLeadStream } from '@/lib/leads/use-lead-stream'

export function LandingPageForm() {
  const leadStream = useLeadStream('lp-address', 'landing-page')

  return (
    <div className="rounded-xl bg-white p-6 shadow-2xl lg:p-8">
      <h2 className="text-center text-xl font-bold text-[var(--color-primary)]">
        Get Your Cash Offer
      </h2>
      <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
        No obligation. No pressure. Just tell us about your property.
      </p>

      <form
        className="mt-6"
        action="/get-your-cash-today/"
        method="get"
      >
        {/* Address input + button — matches homepage hero layout */}
        <div className="relative flex items-center overflow-visible rounded-xl bg-gray-50 p-1 shadow-sm ring-1 ring-gray-200">
          <div className="min-w-0 flex-1">
            <AddressAutocompleteInput
              name="address"
              placeholder="Enter your property address"
              variant="bare"
              className="rounded-none"
              required
              onPlaceSelected={(address) => {
                leadStream.onAddressSelected(address)
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  leadStream.updateField('address', e.target.value)
                }
              }}
            />
          </div>
          <button
            type="submit"
            className="whitespace-nowrap rounded-lg bg-[var(--color-accent)] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)]"
          >
            Get Cash Offer
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        Your information is secure and will never be shared.
      </p>
    </div>
  )
}
