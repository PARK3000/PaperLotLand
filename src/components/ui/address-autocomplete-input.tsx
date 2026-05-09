'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type KeyboardEvent,
} from 'react'
import { type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Suggestion {
  text: string
  placeId: string
  mainText: string
  secondaryText: string
}

interface AddressAutocompleteInputProps extends InputProps {
  onPlaceSelected?: (formattedAddress: string) => void
  /** "default" applies full border/ring/shadow chrome; "bare" renders a plain input for embedding in custom containers */
  variant?: 'default' | 'bare'
  /** Allows a parent to push a value into the input after async prefill resolves (only applies when the field is still empty) */
  externalValue?: string
}

/**
 * Data-only Google Places autocomplete input.
 * Uses AutocompleteSuggestion.fetchAutocompleteSuggestions() instead of
 * the gmp-place-autocomplete web component, giving us full control over
 * styling with zero shadow DOM.
 */
export const AddressAutocompleteInput = forwardRef<
  HTMLInputElement,
  AddressAutocompleteInputProps
>(
  (
    {
      onPlaceSelected,
      variant = 'default',
      label,
      error,
      helperText,
      icon,
      name,
      placeholder,
      required,
      className,
      id,
      defaultValue,
      externalValue,
      onFocus,
      onBlur,
      onChange: onChangeProp,
      ...props
    },
    ref
  ) => {
    const [query, setQuery] = useState(typeof defaultValue === 'string' ? defaultValue : '')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [apiReady, setApiReady] = useState(false)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    // Load Google Maps Places API on-demand and poll for availability
    const loadApiOnce = useCallback(() => {
      if (typeof window === 'undefined') return
      if (apiReady) return

      // Inject the script tag if not already present
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      if (apiKey && !document.getElementById('google-maps-places')) {
        const script = document.createElement('script')
        script.id = 'google-maps-places'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`
        script.async = true
        document.head.appendChild(script)
      }

      let attempts = 0
      const maxAttempts = 60

      const check = () => {
        if (
          window.google?.maps?.places?.AutocompleteSuggestion &&
          window.google?.maps?.places?.AutocompleteSessionToken
        ) {
          setApiReady(true)
          return
        }
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(check, 500)
        }
      }

      check()
    }, [apiReady])

    const getSessionToken = useCallback(() => {
      if (!sessionTokenRef.current && apiReady) {
        sessionTokenRef.current =
          new google.maps.places.AutocompleteSessionToken()
      }
      return sessionTokenRef.current
    }, [apiReady])

    const resetSessionToken = useCallback(() => {
      sessionTokenRef.current = null
    }, [])

    // Sync external value (URL prefill) into internal state — only when field is still empty
    useEffect(() => {
      if (externalValue && !query) {
        setQuery(externalValue)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalValue])

    const fetchSuggestions = useCallback(
      async (input: string) => {
        if (!apiReady || input.length < 3) {
          setSuggestions([])
          setIsOpen(false)
          return
        }

        try {
          const request: google.maps.places.AutocompleteRequest = {
            input,
            sessionToken: getSessionToken() ?? undefined,
            includedRegionCodes: ['us'],
            includedPrimaryTypes: [
              'street_address',
              'subpremise',
              'premise',
            ],
          }

          const { suggestions: results } =
            await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
              request
            )

          const mapped: Suggestion[] = results
            .filter((s) => s.placePrediction)
            .map((s) => {
              const pred = s.placePrediction!
              return {
                text: pred.text.text,
                placeId: pred.placeId,
                mainText: pred.mainText?.text || pred.text.text,
                secondaryText: pred.secondaryText?.text || '',
              }
            })

          setSuggestions(mapped)
          setIsOpen(mapped.length > 0)
          setActiveIndex(-1)
        } catch {
          setSuggestions([])
          setIsOpen(false)
        }
      },
      [apiReady, getSessionToken]
    )

    const handleInputChange = useCallback(
      (value: string) => {
        setQuery(value)

        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
          fetchSuggestions(value)
        }, 300)
      },
      [fetchSuggestions]
    )

    const selectSuggestion = useCallback(
      async (suggestion: Suggestion) => {
        setQuery(suggestion.text)
        setSuggestions([])
        setIsOpen(false)
        setActiveIndex(-1)

        // Fetch full place details for the formatted address
        try {
          const place = new google.maps.places.Place({
            id: suggestion.placeId,
          })
          await place.fetchFields({
            fields: ['formattedAddress'],
          })
          const address = place.formattedAddress || suggestion.text
          setQuery(address)
          onPlaceSelected?.(address)
        } catch {
          // Fallback to suggestion text
          onPlaceSelected?.(suggestion.text)
        }

        resetSessionToken()
      },
      [onPlaceSelected, resetSessionToken]
    )

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            setActiveIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : 0
            )
            break
          case 'ArrowUp':
            e.preventDefault()
            setActiveIndex((prev) =>
              prev > 0 ? prev - 1 : suggestions.length - 1
            )
            break
          case 'Enter':
            e.preventDefault()
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
              selectSuggestion(suggestions[activeIndex])
            }
            break
          case 'Escape':
            setIsOpen(false)
            setActiveIndex(-1)
            break
        }
      },
      [isOpen, suggestions, activeIndex, selectSuggestion]
    )

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
      }
    }, [])

    // Merge refs
    const setRefs = useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el
        if (typeof ref === 'function') {
          ref(el)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = el
        }
      },
      [ref]
    )

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <div ref={wrapperRef} className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
              {icon}
            </div>
          )}
          {/* Hidden input carries the form value */}
          <input type="hidden" name={name} value={query} />
          {/* Visible autocomplete input */}
          <input
            ref={setRefs}
            id={inputId}
            type="text"
            autoComplete="off"
            value={query}
            placeholder={placeholder as string}
            required={required}
            className={cn(
              'w-full py-3 transition-colors',
              'placeholder:text-[var(--color-text-muted)]',
              variant === 'default' && [
                'rounded-lg border bg-white text-[var(--color-text-secondary)] shadow-sm',
                'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20',
                error
                  ? 'border-[var(--color-error)]'
                  : 'border-[var(--color-border)]',
              ],
              variant === 'bare' && 'border-0 bg-transparent text-[var(--color-text-secondary)] shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none',
              icon ? 'pl-10 pr-4' : 'px-4',
              className
            )}
            onChange={(e) => {
              handleInputChange(e.target.value)
              onChangeProp?.(e)
            }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              loadApiOnce()
              onFocus?.(e)
              if (suggestions.length > 0) setIsOpen(true)
            }}
            onBlur={(e) => {
              // Delay to allow click on suggestion
              setTimeout(() => {
                onBlur?.({
                  ...e,
                  target: {
                    ...e.target,
                    value: query,
                  },
                } as React.FocusEvent<HTMLInputElement>)
              }, 150)
            }}
            {...props}
          />

          {/* Suggestions dropdown */}
          {isOpen && suggestions.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
              role="listbox"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.placeId}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm',
                    index === activeIndex
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectSuggestion(suggestion)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">
                      {suggestion.mainText}
                    </span>
                    {suggestion.secondaryText && (
                      <span className="ml-1.5 text-xs text-gray-500">
                        {suggestion.secondaryText}
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {/* Google attribution (required by TOS) */}
              <li className="border-t border-gray-100 px-4 py-2 text-right">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png"
                  alt="Powered by Google"
                  className="ml-auto h-4"
                />
              </li>
            </ul>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

AddressAutocompleteInput.displayName = 'AddressAutocompleteInput'
