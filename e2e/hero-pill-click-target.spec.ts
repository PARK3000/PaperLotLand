import { test, expect } from '@playwright/test'

// Regression test for fix/hero-pill-click-target.
//
// Before this fix, clicks on the white pill padding outside the <input> did
// not focus the address input — Clarity reported 22% dead-click rate on the
// highest-volume LP because of it. Fix wraps the input column in
// <label htmlFor="hero-address"> so the entire pill (minus the submit button)
// is a focus target.
//
// This test clicks the four corners of the label bounding box and asserts the
// input receives focus from each.

test.describe('Hero pill click target', () => {
  // Homepage SSR cold start can take 30s+ in dev mode.
  test.slow()

  test('clicks on the white pill chrome focus the address input', async ({
    page,
  }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })

    const input = page.locator('input#hero-address')
    await expect(input).toBeVisible()

    const label = page.locator('label[for="hero-address"]')
    await expect(label).toBeVisible()

    // Critical assertion: the label must be TALLER than the input. Otherwise the
    // "click target" is just the input itself and the fix is a no-op. The label
    // needs self-stretch so it fills the pill chrome above and below the input.
    const dims = await page.evaluate(() => {
      const i = document.getElementById('hero-address')!
      const l = document.querySelector('label[for="hero-address"]')!
      const ir = i.getBoundingClientRect()
      const lr = l.getBoundingClientRect()
      return {
        inputH: ir.height,
        labelH: lr.height,
        labelTallerThanInput: lr.height > ir.height,
      }
    })
    expect(
      dims.labelTallerThanInput,
      `label (${dims.labelH}px) must be taller than input (${dims.inputH}px) — otherwise the click target is just the input itself`
    ).toBe(true)

    // Click each corner of the label and assert the input is focused. With
    // self-stretch, the label corners are above and below the input — these
    // clicks were dead before the fix.
    const box = await label.boundingBox()
    if (!box) throw new Error('label bounding box not available')

    const inset = 2
    const corners = [
      { x: box.x + inset, y: box.y + inset, name: 'top-left (above input)' },
      { x: box.x + box.width - inset, y: box.y + inset, name: 'top-right (above input)' },
      { x: box.x + inset, y: box.y + box.height - inset, name: 'bottom-left (below input)' },
      {
        x: box.x + box.width - inset,
        y: box.y + box.height - inset,
        name: 'bottom-right (below input)',
      },
    ]

    for (const corner of corners) {
      await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
      await page.mouse.click(corner.x, corner.y)

      const isFocused = await input.evaluate(
        (el) => document.activeElement === el
      )
      expect(isFocused, `input should be focused after clicking ${corner.name}`).toBe(true)
    }
  })

  test('autocomplete dropdown still works after label wrap', async ({
    page,
  }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })

    const input = page.locator('input#hero-address')
    await input.click()
    await input.fill('123 Main')

    // Suggestions list is rendered inside AddressAutocompleteInput as a
    // sibling of the input. Either it appears (Google API loaded) or it
    // doesn't (no API key in test env). Either way, the input should still
    // hold its value and be focused — which proves the label wrap didn't
    // break the input's own event handlers.
    await expect(input).toHaveValue('123 Main')
    const isFocused = await input.evaluate(
      (el) => document.activeElement === el
    )
    expect(isFocused).toBe(true)
  })

  test('submit button is outside the label (no double-fire)', async ({
    page,
  }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })

    // The submit button must NOT be a descendant of the label, otherwise
    // clicking it would fire twice (label → focus input, then bubble to
    // button click handler) and would be invalid HTML.
    const buttonInsideLabel = await page.locator(
      'label[for="hero-address"] button[type="submit"]'
    ).count()

    expect(buttonInsideLabel).toBe(0)
  })
})
