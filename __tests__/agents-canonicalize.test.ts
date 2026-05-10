import { describe, it, expect } from 'vitest'
import { canonicalize } from '../scripts/agents/detect'

describe('canonicalize', () => {
  it('strips www prefix', () => {
    expect(canonicalize('https://www.paperlotland.com/resources/henderson/')).toBe(
      'https://paperlotland.com/resources/henderson/',
    )
  })

  it('forces https', () => {
    expect(canonicalize('http://paperlotland.com/resources/henderson/')).toBe(
      'https://paperlotland.com/resources/henderson/',
    )
  })

  it('strips utm params', () => {
    expect(
      canonicalize('https://paperlotland.com/resources/henderson/?utm_source=google&utm_medium=cpc'),
    ).toBe('https://paperlotland.com/resources/henderson/')
  })

  it('strips fragments', () => {
    expect(canonicalize('https://paperlotland.com/resources/henderson/#hero')).toBe(
      'https://paperlotland.com/resources/henderson/',
    )
  })

  it('adds trailing slash', () => {
    expect(canonicalize('https://paperlotland.com/resources/henderson')).toBe(
      'https://paperlotland.com/resources/henderson/',
    )
  })

  it('combines all normalizations (typical Ahrefs entry)', () => {
    expect(
      canonicalize('http://www.paperlotland.com/resources/henderson?utm_source=ahrefs#position'),
    ).toBe('https://paperlotland.com/resources/henderson/')
  })

  it('preserves nested paths', () => {
    expect(canonicalize('https://paperlotland.com/blog/off-market-land-deals')).toBe(
      'https://paperlotland.com/blog/off-market-land-deals/',
    )
  })

  it('idempotent on already-canonical URL', () => {
    const url = 'https://paperlotland.com/resources/henderson/'
    expect(canonicalize(url)).toBe(url)
  })
})
