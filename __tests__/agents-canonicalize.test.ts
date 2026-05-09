import { describe, it, expect } from 'vitest'
import { canonicalize } from '../scripts/agents/detect'

describe('canonicalize', () => {
  it('strips www prefix', () => {
    expect(canonicalize('https://www.webuyanyvegashouse.com/henderson/')).toBe(
      'https://webuyanyvegashouse.com/henderson/',
    )
  })

  it('forces https', () => {
    expect(canonicalize('http://webuyanyvegashouse.com/henderson/')).toBe(
      'https://webuyanyvegashouse.com/henderson/',
    )
  })

  it('strips utm params', () => {
    expect(
      canonicalize('https://webuyanyvegashouse.com/henderson/?utm_source=google&utm_medium=cpc'),
    ).toBe('https://webuyanyvegashouse.com/henderson/')
  })

  it('strips fragments', () => {
    expect(canonicalize('https://webuyanyvegashouse.com/henderson/#hero')).toBe(
      'https://webuyanyvegashouse.com/henderson/',
    )
  })

  it('adds trailing slash', () => {
    expect(canonicalize('https://webuyanyvegashouse.com/henderson')).toBe(
      'https://webuyanyvegashouse.com/henderson/',
    )
  })

  it('combines all normalizations (typical Ahrefs entry)', () => {
    expect(
      canonicalize('http://www.webuyanyvegashouse.com/henderson?utm_source=ahrefs#position'),
    ).toBe('https://webuyanyvegashouse.com/henderson/')
  })

  it('preserves nested paths', () => {
    expect(canonicalize('https://webuyanyvegashouse.com/blog/cash-offers')).toBe(
      'https://webuyanyvegashouse.com/blog/cash-offers/',
    )
  })

  it('idempotent on already-canonical URL', () => {
    const url = 'https://webuyanyvegashouse.com/henderson/'
    expect(canonicalize(url)).toBe(url)
  })
})
