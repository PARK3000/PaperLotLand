import { test, expect } from '@playwright/test'

test.describe('Lead Form', () => {
  test.describe('Homepage hero form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('renders the hero form with address field', async ({ page }) => {
      const addressInput = page.locator(
        'input[type="text"][placeholder="Enter Your Home Address"]'
      )
      await expect(addressInput).toBeVisible()
    })

    test('redirects to /get-your-cash-today/ with address prefilled', async ({
      page,
    }) => {
      const addressInput = page.locator(
        'input[type="text"][placeholder="Enter Your Home Address"]'
      )
      await addressInput.fill('123 Main St, Las Vegas, NV 89101')
      await page.locator('button[type="submit"]').first().click()

      // Should redirect to the full form page with address in query params
      await expect(page).toHaveURL(/\/get-your-cash-today\/\?address=/, {
        timeout: 10000,
      })
    })
  })

  test.describe('/get-your-cash-today/ lead form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/get-your-cash-today/')
    })

    test('renders the lead form with address and phone fields', async ({
      page,
    }) => {
      const addressInput = page.locator(
        'input[type="text"][placeholder="123 Main St, Las Vegas, NV"]'
      )
      await expect(addressInput).toBeVisible()

      const phoneInput = page.locator('input[placeholder="(702) 555-1234"]')
      await expect(phoneInput.first()).toBeVisible()
    })

    test('honeypot field exists in the DOM', async ({ page }) => {
      const honeypot = page.locator('input[name="website"]').first()
      await expect(honeypot).toBeAttached()
    })
  })

  test.describe('Form submission', () => {
    test('submits successfully and redirects to /thank-you/', async ({
      page,
    }) => {
      // Mock the leads API
      await page.route('**/api/leads', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            leadId: 'test_lead_123',
            message: 'Thank you! We will contact you within 24 hours.',
          }),
        })
      })

      await page.route('**/api/leads/stream', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      await page.goto('/get-your-cash-today/')

      // Fill the visible autocomplete text input
      const addressInput = page.locator(
        'input[type="text"][placeholder="123 Main St, Las Vegas, NV"]'
      )
      await addressInput.fill('123 Main St, Las Vegas, NV 89101')
      await addressInput.dispatchEvent('input')

      // Fill remaining required fields for the "full" variant
      await page
        .locator('input[placeholder="John Smith"]')
        .first()
        .fill('Test User')
      await page
        .locator('input[placeholder="(702) 555-1234"]')
        .first()
        .fill('(702) 555-1234')
      await page
        .locator('input[placeholder="john@example.com"]')
        .first()
        .fill('test@example.com')

      // Submit the form
      await page.locator('form button[type="submit"]').first().click()

      // Should redirect to thank-you page
      await expect(page).toHaveURL(/\/thank-you\//, { timeout: 10000 })
    })
  })
})
