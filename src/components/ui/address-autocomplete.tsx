'use client'

import { type InputProps } from '@/components/ui/input'
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input'

interface AddressAutocompleteProps extends InputProps {
  onPlaceSelected?: (formattedAddress: string) => void
  externalValue?: string
}

export function AddressAutocomplete({
  onPlaceSelected,
  ...props
}: AddressAutocompleteProps) {
  return <AddressAutocompleteInput onPlaceSelected={onPlaceSelected} {...props} />
}
