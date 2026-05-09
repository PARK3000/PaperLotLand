import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('SEO Configuration', () => {
  it('should have robots.txt', () => {
    const robotsPath = path.join(process.cwd(), 'public/robots.txt')
    expect(fs.existsSync(robotsPath)).toBe(true)

    const content = fs.readFileSync(robotsPath, 'utf-8')
    expect(content).toContain('Sitemap:')
    expect(content).toContain('User-agent: *')
    expect(content).toContain('Allow: /')
    expect(content).toContain('Disallow: /api/')
  })

  it('should have llms.txt', () => {
    const llmsPath = path.join(process.cwd(), 'public/llms.txt')
    expect(fs.existsSync(llmsPath)).toBe(true)

    const content = fs.readFileSync(llmsPath, 'utf-8')
    expect(content).toContain('We Buy Any Vegas House')
  })

  it('should have favicon files', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public/favicon.ico'))).toBe(true)
  })

  it('should have schema components', () => {
    const schemaDir = path.join(process.cwd(), 'src/components/seo')
    const expectedSchemas = [
      'organization-schema.tsx',
      'local-business-schema.tsx',
      'faq-schema.tsx',
      'article-schema.tsx',
    ]

    for (const schema of expectedSchemas) {
      expect(
        fs.existsSync(path.join(schemaDir, schema)),
        `Missing schema: ${schema}`
      ).toBe(true)
    }
  })

  it('should have proper site config with SEO defaults', () => {
    const configPath = path.join(process.cwd(), 'config/site.config.json')
    expect(fs.existsSync(configPath)).toBe(true)

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(config.seo).toBeDefined()
    expect(config.seo.defaultTitle).toBeDefined()
    expect(config.seo.defaultDescription).toBeDefined()
    expect(config.seo.defaultTitle.length).toBeGreaterThan(10)
    expect(config.seo.defaultTitle.length).toBeLessThanOrEqual(70)
    expect(config.seo.defaultDescription.length).toBeGreaterThan(50)
    expect(config.seo.defaultDescription.length).toBeLessThanOrEqual(170)
  })

  it('should have business config with contact info', () => {
    const configPath = path.join(process.cwd(), 'config/business.config.json')
    expect(fs.existsSync(configPath)).toBe(true)

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(config.contact.phone).toBeDefined()
    expect(config.contact.email).toBeDefined()
    expect(config.address).toBeDefined()
  })

  it('should have OrganizationSchema in root layout', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')
    expect(content).toContain('OrganizationSchema')
  })

  it('should have metadata export in root layout', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')
    expect(content).toContain('export const metadata')
    expect(content).toContain('openGraph')
    expect(content).toContain('twitter')
    expect(content).toContain('robots')
  })
})

describe('Analytics Integration', () => {
  it('should have GTM integration via DeferredGTM component', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')
    // GTM is loaded via DeferredGTM component (deferred until user interaction for performance)
    expect(content).toContain('DeferredGTM')
  })

  it('should have GA4 managed via GTM in deferred loader', () => {
    const deferredGtmPath = path.join(process.cwd(), 'src/components/deferred-gtm.tsx')
    const content = fs.readFileSync(deferredGtmPath, 'utf-8')
    expect(content).toContain('GTM_ID')
    expect(content).toContain('googletagmanager.com/gtm.js')
  })

  it('should have form analytics module', () => {
    const analyticsPath = path.join(process.cwd(), 'src/lib/analytics/form-analytics.ts')
    expect(fs.existsSync(analyticsPath)).toBe(true)

    const content = fs.readFileSync(analyticsPath, 'utf-8')
    expect(content).toContain('FORM_SUBMITTED')
    expect(content).toContain('FORM_VIEW')
  })

  it('should have GTM ID configured in integrations config', () => {
    const configPath = path.join(process.cwd(), 'config/integrations.config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(config.analytics.googleTagManager.enabled).toBe(true)
    expect(config.analytics.googleTagManager.containerId).toBe('GTM-MH7HT8F')
  })
})
