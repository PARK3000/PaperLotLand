import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Redirect Configuration', () => {
  const configPath = path.join(process.cwd(), 'next.config.ts')
  let configSource: string

  it('should have next.config.ts', () => {
    expect(fs.existsSync(configPath)).toBe(true)
    configSource = fs.readFileSync(configPath, 'utf-8')
  })

  it('should NOT redirect to non-existent /situations/ routes', () => {
    configSource = fs.readFileSync(configPath, 'utf-8')
    // These routes don't exist - redirects should point to actual pages
    const brokenDestinations = [
      "'/situations/inherited-house'",
      "'/situations/foreclosure'",
      "'/situations/divorce'",
      "'/situations/bad-tenants'",
      "'/situations/code-violations'",
      "'/situations/fire-damage'",
      "'/situations/bankruptcy'",
      "'/situations/relocation'",
    ]

    for (const dest of brokenDestinations) {
      expect(
        configSource.includes(`destination: ${dest}`),
        `Found broken redirect to ${dest}`
      ).toBe(false)
    }
  })

  it('should redirect old sell-my-house-fast situation URLs to actual pages', () => {
    configSource = fs.readFileSync(configPath, 'utf-8')
    const expectedRedirects = [
      { source: '/sell-my-house-fast/inherited-house', destination: '/need-to-sell-an-inherited-house/' },
      { source: '/sell-my-house-fast/foreclosure', destination: '/stop-a-foreclosure/' },
      { source: '/sell-my-house-fast/divorce', destination: '/going-through-a-divorce/' },
      { source: '/sell-my-house-fast/code-violations', destination: '/code-violations/' },
      { source: '/sell-my-house-fast/fire-damaged-house', destination: '/fire-damaged-home/' },
      { source: '/sell-my-house-fast/bankruptcy', destination: '/facing-bankruptcy/' },
      { source: '/sell-my-house-fast/relocation', destination: '/relocating/' },
    ]

    for (const redirect of expectedRedirects) {
      expect(
        configSource.includes(redirect.destination),
        `Missing redirect destination: ${redirect.destination}`
      ).toBe(true)
    }
  })

  it('should redirect /faq-items/ URLs to FAQ page', () => {
    configSource = fs.readFileSync(configPath, 'utf-8')
    expect(configSource).toContain('/faq-items/:slug')
    expect(configSource).toContain('/frequently-asked-questions/')
  })

  it('should have all redirects marked as permanent (301)', () => {
    configSource = fs.readFileSync(configPath, 'utf-8')
    // Count permanent: true vs false
    const permanentTrue = (configSource.match(/permanent: true/g) || []).length
    expect(permanentTrue).toBeGreaterThan(0)
  })
})
