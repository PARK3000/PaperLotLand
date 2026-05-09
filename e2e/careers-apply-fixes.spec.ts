import { test, expect } from '@playwright/test'

// Regression test for /careers/apply/ dead-click fixes.
//
// Before the fix, /careers/apply/ had 100% dead-click rate (6/6 sessions).
// Three culprits:
//   1. PI Assessment yellow card — only the small "Take the PI Assessment"
//      button was a link; the prominent heading and description body were
//      not clickable.
//   2. Form labels (Full Name, Phone, Email, etc.) — rendered as siblings
//      of inputs without htmlFor, so clicking the label text didn't focus
//      the input.
//   3. Step indicator labels ("Contact Info", "Position", "About You") —
//      visually look like step tabs but had no interactivity.
//
// Fixes:
//   1. Add `relative` to the amber card; expand inner <a>'s ::before pseudo
//      to inset-0.
//   2. Convert FormField wrapper from <div> + sibling <label> to <label>
//      with the input as a descendant — implicit label association.
//   3. Render completed step circles as <button>s for backwards navigation.
//      The first-visit case (step 1, nothing completed) renders no buttons.

test.describe('/careers/apply/ dead-click fixes', () => {
  test.slow()

  test('PI Assessment amber card is fully clickable', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/careers/apply/`, { waitUntil: 'domcontentloaded' })

    const result = await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('main div')).find((el) => {
        const cls = (el.className || '').toString()
        return /amber-400/.test(cls) && /relative/.test(cls)
      })
      if (!card) return { error: 'no amber card' }
      const a = card.querySelector('a[href*="predictiveindex"]')
      if (!a) return { error: 'no assessment link' }
      const cr = card.getBoundingClientRect()
      const cx = cr.x + cr.width / 2
      const ys = [cr.y + 4, cr.y + 30, cr.y + cr.height / 2, cr.y + cr.height - 4]
      const hits = ys.map((y) => {
        const el = document.elementFromPoint(cx, y)
        let cur: Element | null = el
        while (cur && cur !== document.body) {
          if (cur === a) return true
          cur = cur.parentElement
        }
        return false
      })
      return { hits: hits.filter(Boolean).length, total: hits.length }
    })

    expect(result.error).toBeUndefined()
    expect(result.hits, `${result.hits}/${result.total} click points reach the assessment link`).toBe(result.total)
  })

  test('form labels wrap their inputs (clicking label text focuses input)', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/careers/apply/`, { waitUntil: 'domcontentloaded' })

    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label.block'))
      // Step 1 has Full Name, Phone Number, Email Address as labels-with-inputs
      const tests: Array<{ labelText: string; wrapsInput: boolean; inputType: string }> = []
      for (const label of labels) {
        const input = label.querySelector('input, textarea') as HTMLInputElement | null
        if (!input) continue
        const span = label.querySelector('span')
        tests.push({
          labelText: span?.textContent?.trim().slice(0, 30) || '?',
          wrapsInput: label.contains(input),
          inputType: input.type,
        })
      }
      return tests
    })

    // Expect at least the three step-1 fields to be label-wrapped
    const expectedFields = ['Full Name', 'Phone Number', 'Email Address']
    for (const expected of expectedFields) {
      const match = result.find((r) => r.labelText.startsWith(expected))
      expect(match, `field "${expected}" should be label-wrapped`).toBeTruthy()
      expect(match!.wrapsInput, `${expected} label must contain its input as a descendant`).toBe(true)
    }
  })

  test('step indicator has no spurious nav buttons at step 1', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/careers/apply/`, { waitUntil: 'domcontentloaded' })

    // At step 1 (initial), no steps are completed → no backwards-nav buttons
    const buttons = await page.locator('main button[aria-label^="Go back to"]').count()
    expect(buttons, 'step 1: no completed steps → no backwards-nav buttons').toBe(0)
  })
})
