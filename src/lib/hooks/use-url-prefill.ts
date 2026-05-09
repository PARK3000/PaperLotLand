'use client'

import { useState, useEffect } from 'react'

export interface UrlPrefillData {
  address: string
  firstName: string
  lastName: string
  email: string
  phone: string
  /** True once the params have been read (avoids flash of empty → filled) */
  ready: boolean
}

const EMPTY: UrlPrefillData = {
  address: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  ready: false,
}

/**
 * Reads URL search params and returns pre-fill data for lead forms.
 *
 * Supported params (case-sensitive):
 *   full_address                        – combined address string (email / AC campaigns)
 *   street_address + city + state + zip – individual parts (direct mail QR codes)
 *   first_name, last_name, email, phone
 *
 * Example URLs:
 *   /lp/email/?full_address=5349+Standing+Rock+Pl&first_name=Nick&last_name=Mcclain&email=...
 *   /mail-check/?street_address=1105+PLEASURE+LN&city=HENDERSON&state=NV&zip=89002&first_name=MARY&...
 */
export function useUrlPrefill(): UrlPrefillData {
  const [prefill, setPrefill] = useState<UrlPrefillData>(EMPTY)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    // Build address — prefer full_address, fall back to parts
    const fullAddress = params.get('full_address') || ''
    const streetAddress = params.get('street_address') || ''
    let address = fullAddress.trim()
    if (!address && streetAddress) {
      const city = params.get('city') || ''
      const stateVal = params.get('state') || ''
      const zip = params.get('zip') || ''
      address = [streetAddress.trim(), city.trim(), stateVal.trim(), zip.trim()]
        .filter(Boolean)
        .join(', ')
    }

    let firstName = (params.get('first_name') || '').trim()
    let lastName = (params.get('last_name') || '').trim()
    // full_name=MARY+PANNARALLA → split on first space
    const fullName = (params.get('full_name') || '').trim()
    if (fullName && !firstName) {
      const spaceIdx = fullName.indexOf(' ')
      firstName = spaceIdx >= 0 ? fullName.slice(0, spaceIdx) : fullName
      if (!lastName) lastName = spaceIdx >= 0 ? fullName.slice(spaceIdx + 1).trim() : ''
    }

    setPrefill({
      address,
      firstName,
      lastName,
      email: (params.get('email') || '').trim(),
      phone: (params.get('phone') || '').trim(),
      ready: true,
    })
  }, [])

  return prefill
}
