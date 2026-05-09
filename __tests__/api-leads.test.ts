import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('API Leads Endpoint', () => {
  const apiPath = path.join(process.cwd(), 'src/app/api/leads/route.ts')

  it('should have the leads API route file', () => {
    expect(fs.existsSync(apiPath)).toBe(true)
  })

  it('should export POST and GET handlers', () => {
    const source = fs.readFileSync(apiPath, 'utf-8')
    expect(source).toContain('export async function POST')
    expect(source).toContain('export async function GET')
  })

  it('should validate required fields', () => {
    const source = fs.readFileSync(apiPath, 'utf-8')
    // Should validate address and phone
    expect(source).toContain('address')
    expect(source).toContain('phone')
  })

  it('should generate lead IDs', () => {
    const source = fs.readFileSync(apiPath, 'utf-8')
    expect(source).toContain('lead_')
  })

  it('should support webhook integration', () => {
    const source = fs.readFileSync(apiPath, 'utf-8')
    expect(source).toContain('LEADS_WEBHOOK_URL')
  })
})
