import { test, expect } from '@playwright/test'

// Regression test for the /contact-us/ method cards.
//
// Before the fix, /contact-us/ had 42.9% dead-click rate. The four contact
// method cards (Call Us, Email, Service Area, Office) each had a prominent
// 48x48 icon circle and an H3 heading that visually looked clickable, but
// only the small inner phone/email link inside was actually navigable —
// and Service Area and Office had no link at all.
//
// Fix: position each card relatively, expand the inner <a>'s ::before
// pseudo-element with `before:absolute before:inset-0 before:content-['']`
// so clicks anywhere on the card navigate. Service Area now links to
// /locations/, Office links to a Google Maps directions URL.

test.describe('Contact-us method cards', () => {
  test.slow()

  test('all four method cards are fully clickable end-to-end', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/contact-us/`, { waitUntil: 'domcontentloaded' })

    // Wait for the chat widget iframe to load and settle, otherwise it can
    // briefly cover parts of the contact section as it animates in.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

    // Scroll the contact section into view to ensure the cards are positioned
    // away from any fixed-position widgets.
    await page.evaluate(() => {
      document.querySelector('main h2')?.scrollIntoView({ block: 'start' })
    })
    await page.waitForTimeout(500)

    const result = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('main div.relative.flex.items-start.gap-4')
      )
      return cards.map((card) => {
        const cr = card.getBoundingClientRect()
        const h3 = card.querySelector('h3')
        const a = card.querySelector('a[href]')
        const label = h3?.textContent?.trim() || '?'
        if (!a || cr.width === 0) return { label, error: 'no link' }
        const href = a.getAttribute('href') || ''
        const cx = cr.x + cr.width / 2
        const ys = [
          cr.y + 4,
          cr.y + 20,
          cr.y + cr.height / 2,
          cr.y + cr.height - 16,
          cr.y + cr.height - 4,
        ]
        const hits = ys.map((y) => {
          const el = document.elementFromPoint(cx, y)
          let cur: Element | null = el
          while (cur && cur !== document.body) {
            if (cur.tagName === 'A' && cur.getAttribute('href') === href) return true
            cur = cur.parentElement
          }
          return false
        })
        return {
          label,
          hits: hits.filter(Boolean).length,
          total: hits.length,
        }
      })
    })

    // Expected labels
    const expectedLabels = ['Call Us', 'Email', 'Service Area', 'Office']
    expect(
      result.map((r) => r.label),
      `should find all four contact-method cards`
    ).toEqual(expect.arrayContaining(expectedLabels))

    for (const r of result) {
      expect(
        r.hits,
        `${r.label}: ${r.hits}/${r.total} click points reach the link`
      ).toBe(r.total)
    }
  })
})
