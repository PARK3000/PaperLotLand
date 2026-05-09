/**
 * Parse a Google Places-style formatted address into components.
 *
 * Input formats:
 *   "855 Spring Rd, Indian Springs, NV 89018, USA"
 *   "9108 Safeport Ct, Las Vegas, NV 89117-2455, USA"
 *   "320 W Van Buren Ave, Las Vegas, NV 89106, USA"
 *
 * Output matches Gravity Forms Property field structure:
 *   Property (str)          → "855 Spring Rd"
 *   Property (City)         → "Indian Springs"
 *   Property (State)        → "Nevada" (full name)
 *   Property (Zip / Postal) → "89018"
 *   Property (Country)      → "United States"
 */

export interface ParsedAddress {
  street: string
  unit: string
  city: string
  state: string // Full state name (e.g., "Nevada")
  zip: string
  country: string
}

// State abbreviation → full name mapping
const STATE_MAP: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico', GU: 'Guam', VI: 'Virgin Islands',
}

// Country code → full name
const COUNTRY_MAP: Record<string, string> = {
  US: 'United States',
  USA: 'United States',
  CA: 'Canada',
}

/**
 * Parse a formatted address string into its components.
 *
 * Strategy: split by comma, work backwards from country.
 * Typical structure: "Street, City, State ZIP, Country"
 */
export function parseAddress(fullAddress: string): ParsedAddress {
  const result: ParsedAddress = {
    street: '',
    unit: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  }

  if (!fullAddress || typeof fullAddress !== 'string') return result

  const parts = fullAddress.split(',').map((p) => p.trim()).filter(Boolean)

  if (parts.length === 0) return result

  // Single part — just a street or partial
  if (parts.length === 1) {
    result.street = parts[0]
    return result
  }

  // Check if last part is a country
  const lastPart = parts[parts.length - 1].toUpperCase()
  if (COUNTRY_MAP[lastPart] || lastPart === 'UNITED STATES') {
    result.country = COUNTRY_MAP[lastPart] || 'United States'
    parts.pop()
  }

  if (parts.length === 0) return result

  // Last remaining part should be "State ZIP" or "State"
  const stateZipPart = parts[parts.length - 1]
  const stateZipMatch = stateZipPart.match(
    /^([A-Za-z\s.]+?)\s+(\d{5}(?:-\d{4})?)$/
  )

  if (stateZipMatch) {
    const stateAbbr = stateZipMatch[1].trim().toUpperCase()
    result.state = STATE_MAP[stateAbbr] || stateZipMatch[1].trim()
    result.zip = stateZipMatch[2]
    parts.pop()
  } else {
    // Might just be a state without zip
    const upperPart = stateZipPart.trim().toUpperCase()
    if (STATE_MAP[upperPart]) {
      result.state = STATE_MAP[upperPart]
      parts.pop()
    }
  }

  // If no country was set but we identified a US state, default to United States
  if (!result.country && result.state) {
    result.country = 'United States'
  }

  if (parts.length === 0) return result

  // City is the last remaining part (after removing country and state/zip)
  if (parts.length >= 2) {
    result.city = parts[parts.length - 1]
    parts.pop()
  }

  // Everything else is the street address
  result.street = parts.join(', ')

  return result
}
