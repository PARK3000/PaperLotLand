import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Configuration Files', () => {
  it('should have valid site config JSON', () => {
    const configPath = path.join(process.cwd(), 'config/site.config.json')
    expect(() => {
      JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }).not.toThrow()
  })

  it('should have valid business config JSON', () => {
    const configPath = path.join(process.cwd(), 'config/business.config.json')
    expect(() => {
      JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }).not.toThrow()
  })

  it('should have valid integrations config JSON', () => {
    const configPath = path.join(process.cwd(), 'config/integrations.config.json')
    expect(() => {
      JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }).not.toThrow()
  })

  it('should have .env.example with all required variables', () => {
    const envPath = path.join(process.cwd(), '.env.example')
    expect(fs.existsSync(envPath)).toBe(true)

    const content = fs.readFileSync(envPath, 'utf-8')
    const requiredVars = [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_GTM_ID',
      'LEADS_WEBHOOK_URL',
      'NOTIFICATION_EMAIL',
    ]

    for (const varName of requiredVars) {
      expect(content, `Missing env var: ${varName}`).toContain(varName)
    }
  })

  it('should have correct business phone number', () => {
    const configPath = path.join(process.cwd(), 'config/business.config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(config.contact.phoneDisplay).toBe('(702) 465-6111')
    expect(config.contact.phone).toBe('7024656111')
  })

  it('should have correct business address', () => {
    const configPath = path.join(process.cwd(), 'config/business.config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(config.address.city).toBe('Las Vegas')
    expect(config.address.state).toBe('NV')
  })

  it('should have service areas defined', () => {
    const configPath = path.join(process.cwd(), 'config/business.config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    // Service areas stored as comma-separated string
    const areas = config.serviceArea.split(',').map((s: string) => s.trim())
    expect(areas.length).toBeGreaterThanOrEqual(5)
  })
})

describe('Blog Content', () => {
  it('should have blog index file', () => {
    const indexPath = path.join(process.cwd(), 'content/blog/index.json')
    expect(fs.existsSync(indexPath)).toBe(true)
  })

  it('should have blog posts directory', () => {
    const postsDir = path.join(process.cwd(), 'content/blog/posts')
    expect(fs.existsSync(postsDir)).toBe(true)
  })

  it('should have at least one blog post', () => {
    const postsDir = path.join(process.cwd(), 'content/blog/posts')
    const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.json'))
    expect(files.length).toBeGreaterThanOrEqual(1)
  })

  it('should have valid JSON for each blog post', () => {
    const postsDir = path.join(process.cwd(), 'content/blog/posts')
    const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.json'))

    for (const file of files) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8')
      expect(() => JSON.parse(content), `Invalid JSON in ${file}`).not.toThrow()

      const post = JSON.parse(content)
      expect(post.slug, `Missing slug in ${file}`).toBeDefined()
      expect(post.title, `Missing title in ${file}`).toBeDefined()
      expect(post.category, `Missing category in ${file}`).toBeDefined()
      expect(post.content, `Missing content in ${file}`).toBeDefined()
    }
  })
})
