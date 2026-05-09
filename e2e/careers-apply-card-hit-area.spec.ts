import { test, expect } from '@playwright/test'

// Regression test for the careers job-page Apply CTA card.
//
// Before the fix, /careers/closing-coordinator/ had 84% dead-click rate (16/19
// sessions) plus 1 rage click. The amber "Before you apply" card visually looks
// clickable but only the small inner button at the bottom was actually a link;
// users tapping the heading or description body got nothing.
//
// Fix: position the card relatively, expand the inner <a>'s ::before
// pseudo-element with `before:absolute before:inset-0 before:content-['']` so
// clicks anywhere on the card navigate to the assessment URL.
//
// This test asserts that clicks at the card top edge (heading area) hit an
// anchor whose href points at the PI assessment.

test.describe('Careers job-page Apply CTA card', () => {
  test.slow()

  test('entire amber card body navigates to the PI assessment', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || ''
    await page.goto(`${baseUrl}/careers/closing-coordinator/`, { waitUntil: 'domcontentloaded' })

    const result = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('main div')).filter((el) => {
        const cls = (el.className || '').toString()
        return /amber-400/.test(cls) && /relative/.test(cls)
      })
      if (!cards.length) return { error: 'no amber card', count: 0 }
      const card = cards[0]
      const cr = card.getBoundingClientRect()
      const cx = cr.x + cr.width / 2
      // Sample 5 vertical points across the card
      const ys = [cr.y + 8, cr.y + 30, cr.y + 60, cr.y + 90, cr.y + cr.height - 4]
      const hits = ys.map((y) => {
        const el = document.elementFromPoint(cx, y)
        let cur: Element | null = el
        while (cur && cur !== document.body) {
          if (cur.tagName === 'A' && (cur as HTMLAnchorElement).href.includes('predictiveindex')) return true
          cur = cur.parentElement
        }
        return false
      })
      return {
        cardWidth: Math.round(cr.width),
        cardHeight: Math.round(cr.height),
        clicksHittingAssessmentLink: hits.filter(Boolean).length,
        totalClicks: hits.length,
      }
    })

    expect(result.error, 'amber card must exist on the page').toBeUndefined()
    expect(
      result.clicksHittingAssessmentLink,
      `${result.clicksHittingAssessmentLink}/${result.totalClicks} click points reach the assessment link (card ${result.cardWidth}x${result.cardHeight})`
    ).toBe(result.totalClicks)
  })
})
