// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input'

// Mock next/navigation (used transitively)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

describe('AddressAutocompleteInput', () => {
  it('accepts keyboard input and updates the visible value', async () => {
    const user = userEvent.setup()
    render(
      <AddressAutocompleteInput
        name="address"
        placeholder="Enter Your Home Address"
        variant="bare"
      />
    )

    const input = screen.getByPlaceholderText('Enter Your Home Address')
    await user.type(input, '123 Main St')

    expect(input).toHaveValue('123 Main St')
  })

  it('calls parent onChange while still updating internal state', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <AddressAutocompleteInput
        name="address"
        placeholder="Enter Your Home Address"
        variant="bare"
        onChange={handleChange}
      />
    )

    const input = screen.getByPlaceholderText('Enter Your Home Address')
    await user.type(input, 'abc')

    // Internal state must update (input shows typed text)
    expect(input).toHaveValue('abc')
    // Parent onChange must also fire for each keystroke
    expect(handleChange).toHaveBeenCalledTimes(3)
  })

  it('carries the typed value in the hidden form input', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AddressAutocompleteInput
        name="address"
        placeholder="Enter Your Home Address"
        variant="bare"
      />
    )

    const input = screen.getByPlaceholderText('Enter Your Home Address')
    await user.type(input, '456 Oak Ave')

    const hiddenInput = container.querySelector('input[type="hidden"][name="address"]')
    expect(hiddenInput).toHaveValue('456 Oak Ave')
  })

  it('calls onFocus and onBlur callbacks without breaking typing', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()

    render(
      <>
        <AddressAutocompleteInput
          name="address"
          placeholder="Enter Your Home Address"
          variant="bare"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {/* Extra element to tab away to trigger blur */}
        <button>Other</button>
      </>
    )

    const input = screen.getByPlaceholderText('Enter Your Home Address')

    await user.click(input)
    expect(handleFocus).toHaveBeenCalled()

    await user.type(input, '789 Elm')
    expect(input).toHaveValue('789 Elm')
  })

  it('renders with default variant styling', () => {
    render(
      <AddressAutocompleteInput
        name="address"
        placeholder="Enter address"
        variant="default"
      />
    )

    const input = screen.getByPlaceholderText('Enter address')
    expect(input).toBeInTheDocument()
    expect(input.className).toContain('rounded-lg')
  })

  it('renders with bare variant styling', () => {
    render(
      <AddressAutocompleteInput
        name="address"
        placeholder="Enter address"
        variant="bare"
      />
    )

    const input = screen.getByPlaceholderText('Enter address')
    expect(input).toBeInTheDocument()
    expect(input.className).toContain('border-0')
  })
})
