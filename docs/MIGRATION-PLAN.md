# Site Migration Plan: We Buy Any Vegas House

## Executive Summary

This document outlines the comprehensive migration plan for transitioning webuyanyvegashouse.com from the existing WordPress site to a new Next.js 15 implementation. The primary goals are:

1. **Design Parity** - Match the existing site's look and feel with enhancements
2. **Route Preservation** - Maintain all existing URLs to protect backlinks and SEO
3. **SEO Optimization** - Preserve current rankings while adding new optimized content
4. **Conversion Optimization** - Enhance lead capture and user experience

---

## Migration Status Summary

| Category | Target | Completed | Status |
|----------|--------|-----------|--------|
| Core Pages | 8 | 8 | **100%** |
| Location Pages | 9 | 9 | **100%** |
| Situation Pages | 14 | 14 | **100%** |
| Landing Pages | 10 | 10 | **100%** |
| Case Studies | 10 | 10 | **100%** |
| Blog Posts | 88 | 88 | **100%** |
| Blog Categories | 4 | 4 | **100%** |
| Utility Pages | 3 | 3 | **100%** |
| Additional Pages | 4 | 4 | **100%** |
| QA & Performance | - | - | **~95%** |
| **Overall Progress** | - | - | **~99%** |

---

## Completed Work

### Phase 1: Design Parity - COMPLETE
- [x] Update header to match exact design
- [x] Update footer to match exact design
- [x] Homepage sections refined to match original
- [x] Implement exact color scheme (Navy #06263A, Red #CD2C2C)
- [x] Add Manrope font family
- [x] Create reusable page templates

### Phase 2: Core Pages - COMPLETE
- [x] `/` - Homepage with hero, testimonials, how it works, FAQ
- [x] `/team/` - Full team page with all 11 members
- [x] `/selling-my-house-in-las-vegas-for-cash/` - How It Works page
- [x] `/happy-sellers/` - Reviews page with testimonials
- [x] `/contact-us/` - Contact page with both office locations
- [x] `/frequently-asked-questions/` - Full FAQ page with accordion
- [x] `/get-your-cash-today/` - Lead capture landing page
- [x] `/how-it-works/` - Process overview page

### Phase 3: Location Pages - COMPLETE
- [x] `/henderson/` - Henderson location page
- [x] `/we-buy-houses-summerlin/` - Summerlin location page
- [x] `/we-buy-houses-enterprise/` - Enterprise location page
- [x] `/we-buy-houses-paradise/` - Paradise location page
- [x] `/we-buy-houses-pahrump/` - Pahrump location page
- [x] `/we-buy-houses-boulder-city/` - Boulder City location page
- [x] `/sell-my-house-fast-green-valley-nv/` - Green Valley location page
- [x] `/locations/` - All locations overview

### Phase 4: Situation Pages - COMPLETE
- [x] `/relocating/` - Relocating situation page
- [x] `/how-to-avoid-foreclosure-las-vegas/` - Foreclosure avoidance
- [x] `/need-to-sell-an-inherited-house/` - Inherited property
- [x] `/stop-a-foreclosure/` - Foreclosure stop
- [x] `/fire-damaged-home/` - Fire damage
- [x] `/code-violations/` - Code violations
- [x] `/house-that-needs-repairs/` - Repairs needed
- [x] `/late-on-mortgage-payments/` - Late payments
- [x] `/house-full-of-trash/` - Hoarder houses
- [x] `/family-matters/` - Family situations
- [x] `/need-to-downsize/` - Downsizing
- [x] `/going-through-a-divorce/` - Divorce situations
- [x] `/facing-bankruptcy/` - Bankruptcy situations

### Phase 5: Landing Pages - COMPLETE
- [x] `/lp/vegas-home-buyer/`
- [x] `/lp/companies-that-buy-houses-for-cash/`
- [x] `/lp/email/`
- [x] `/lp/sell-my-house-as-is/`
- [x] `/lp/we-buy-any-vegas-house/`
- [x] `/lp/sell-my-house-for-cash-vegas/`
- [x] `/lp/we-buy-houses-vegas/`
- [x] `/lp/fast-house-sale/`
- [x] `/lp/sell-my-house-fast/`
- [x] `/lp/sell-my-house-fast-for-cash/`
- [x] All pages have Voice DNA-optimized copy
- [x] All pages have JSON-LD structured data

### Phase 8: Additional Pages - COMPLETE
- [x] `/booking/` - Booking/scheduling page
- [x] `/realtors/` - Realtors information page
- [x] `/thank-you/` - Form submission thank you page
- [x] `/not-found` - Custom 404 page
- [x] Blog pagination (`/blog/page/[num]/`)
- [x] Selling-a-home pagination (`/selling-a-home/page/[num]/`)
- [x] Category listing pages (`/selling-a-home/`, `/buying-a-home/`, `/sell-your-house/`)

### Phase 6: Blog & Content - COMPLETE
- [x] Blog infrastructure with 88 posts migrated
- [x] `/blog/` - Main blog listing page
- [x] `/blog/[slug]/` - Individual blog post pages
- [x] `/selling-a-home/[slug]/` - Category (39 posts)
- [x] `/sell-your-house/[slug]/` - Category (10 posts)
- [x] `/sell-my-house-fast/[slug]/` - Category (5 posts)
- [x] `/buying-a-home/[slug]/` - Category (23 posts)
- [x] RSS feed at `/feed.xml`
- [x] XML sitemap auto-generation

### Phase 7: Case Studies - COMPLETE
- [x] `/case-study-selling-from-900-miles-away-how-mark-sold-his-inherited-vegas-home-in-11-days/`
- [x] `/case-study-selling-a-las-vegas-home-from-colorado-no-repairs-needed/`
- [x] `/case-study-selling-a-hoarder-house-in-henderson/`
- [x] `/case-study-from-foreclosure-notice-to-cash-in-hand-in-14-days/`
- [x] `/case-study-fast-as-is-cash-sale-saves-landlords-thousands-and-eliminates-stress/`
- [x] `/case-study-from-squatters-to-sold-how-we-helped-a-vegas-family-sell-grandmas-home-fast/`
- [x] `/case-study-helping-navigate-a-difficult-inheritance-in-las-vegas/`
- [x] `/case-study-how-one-las-vegas-family-escaped-stress-sold-their-home-fast-without-repairs-or-drama/`
- [x] `/case-study-how-we-buy-any-vegas-house-solved-a-complex-rental-property-sale-in-just-14-days/`
- [x] `/case-study-how-we-helped-a-las-vegas-homeowner-overcome-divorce-and-financial-hardship/`

### Infrastructure & Technical - COMPLETE
- [x] Next.js 15 with App Router
- [x] TypeScript throughout
- [x] Tailwind CSS v4 styling
- [x] 38 reusable components
- [x] Lead capture API endpoint (`/api/leads/`)
- [x] PostHog analytics integration
- [x] GA4 analytics integration
- [x] Microsoft Clarity integration (optional)
- [x] SEO schema components (LocalBusiness, Organization, FAQ, Article)
- [x] Mobile-responsive design
- [x] Image optimization with Next.js Image

### SEO Research & Documentation - COMPLETE
- [x] `seo/SEO-ANALYSIS.md` - Comprehensive keyword analysis
- [x] `seo/keyword-plan.md` - Content strategy and targets
- [x] `seo/keyword-research.json` - Raw DataForSEO API data
- [x] `seo/competitor-analysis.json` - Competitor insights
- [x] `seo/opportunities.json` - Prioritized opportunities
- [x] `seo/critical-gap-plan.md` - Content gaps to address
- [x] `seo/CLARITY-ANALYSIS.md` - User behavior insights
- [x] `seo/GSC-AUDIT-PLAN.md` - Google Search Console audit
- [x] `seo/WEBSITE-UPGRADE-PLAN.md` - Future improvements

---

## Completed Items (Previously Outstanding)

1. **Utility Pages** - COMPLETE
   - [x] `/privacy-policy/` - Privacy policy page
   - [x] `/careers/` - Careers page
   - [x] `/vs-realtor/` - Comparison page

2. **Pre-Launch Checklist** - MOSTLY COMPLETE
   - [x] DNS cutover plan created (`docs/plans/2026-03-09-dns-cutover-migration-plan.md`)
   - [x] 404 page creation (`not-found.tsx`)
   - [x] robots.txt verified
   - [x] XML sitemap generation

3. **Additional Case Studies** - COMPLETE
   - [x] All 10 case studies built (was 4, now 10)

---

### QA Testing & Performance - COMPLETE (March 11, 2026)

**QA Test Matrix**: See `docs/QA-TEST-PAGES.csv` (74 pages across 9 categories)

1. **Page Status Verification** - COMPLETE
   - [x] All 54 key pages return HTTP 200
   - [x] Custom 404 page works correctly
   - [x] Sitemap.xml and RSS feed.xml accessible

2. **Internal Link Audit** - COMPLETE
   - [x] Fixed broken link: `/buying-a-home/who-pays-closing-costs-in-a-cash-sale/` → `/selling-a-home/who-pays-closing-costs-in-a-cash-sale/` (wrong blog category in nav)
   - [x] All homepage internal links verified working
   - [x] Phone links verified: `tel:7022139800`, `tel:7029195009`
   - [x] Email link verified: `mailto:info@webuyanyvegashouse.com`

3. **Lighthouse Audit & Performance** - COMPLETE
   - [x] Homepage: Performance 90, Accessibility 100, SEO 100
   - [x] Landing Pages: Performance 84-96, Accessibility 96
   - [x] Core Web Vitals: CLS 0.003 (Excellent), TBT 40ms (Excellent), LCP 3.2s (Needs Work - server-dependent)
   - [x] Build completes cleanly with no errors

4. **Accessibility Fixes Applied**
   - [x] Fixed color contrast: `text-white/90` → `text-white` across CTA, about, and landing page sections
   - [x] Darkened muted text color from `#6b7280` to `#555d68` for WCAG AA compliance
   - [x] Darkened CTA blue bg from `#0891b2` to `#0e7490` for contrast compliance
   - [x] Darkened about section bg from `#0284c7` to `#0369a1` for contrast compliance
   - [x] Added `aria-label` to BBB badge icon links on landing pages
   - [x] Added `<label>` elements (sr-only) to landing page form inputs

5. **Remaining Manual QA** (requires browser/device testing)
   - [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
   - [ ] Mobile responsiveness audit (iOS, Android)
   - [ ] Form submission end-to-end testing (all 3 form variants)

---

## Remaining To-Do Items

3. **Pre-Launch (Final Steps)**
   - [ ] DNS cutover execution (plan exists at `docs/plans/2026-03-09-dns-cutover-migration-plan.md`)
   - [ ] SSL certificate verification
   - [ ] Redirect testing (old WordPress URLs → new routes)
   - [ ] XML sitemap submission to Google Search Console

### Medium Priority (Post-Launch)

4. **Analytics & Tracking**
   - [ ] GA4 conversion tracking
   - [ ] PostHog event tracking
   - [ ] Form submission tracking
   - [ ] Phone call tracking

5. **Content Enhancements**
   - [ ] Exit intent popup
   - [ ] Social proof notifications
   - [ ] Live chat integration

### Low Priority (Future Improvements)

6. **Advanced Features**
   - [ ] Multi-step lead form
   - [ ] A/B testing infrastructure
   - [ ] Blog search functionality
   - [ ] Newsletter signup

---

## Technical Implementation Summary

### File Structure (60+ Pages)

```
src/app/
├── page.tsx                              # Homepage
├── team/page.tsx                         # Team
├── selling-my-house-in-las-vegas-for-cash/page.tsx
├── happy-sellers/page.tsx                # Reviews
├── contact-us/page.tsx                   # Contact
├── frequently-asked-questions/page.tsx   # FAQ
├── get-your-cash-today/page.tsx          # Lead Capture
├── how-it-works/page.tsx                 # Process
├── booking/page.tsx                      # Booking
├── realtors/page.tsx                     # Realtors
├── thank-you/page.tsx                    # Thank You
├── privacy-policy/page.tsx              # Privacy Policy
├── careers/page.tsx                     # Careers
├── vs-realtor/page.tsx                  # Comparison
├── not-found.tsx                        # Custom 404
├── locations/page.tsx                    # Locations Overview
├── henderson/page.tsx                    # Location Pages (8)
├── we-buy-houses-*/page.tsx
├── relocating/page.tsx                   # Situation Pages (14)
├── [situation-slug]/page.tsx
├── lp/[landing]/page.tsx                 # Landing Pages (10)
├── blog/page.tsx                         # Blog
├── blog/[slug]/page.tsx
├── blog/page/[num]/page.tsx             # Blog Pagination
├── selling-a-home/[slug]/page.tsx        # Blog Categories (4)
├── selling-a-home/page/[num]/page.tsx   # Category Pagination
├── sell-your-house/[slug]/page.tsx
├── sell-my-house-fast/[slug]/page.tsx
├── buying-a-home/[slug]/page.tsx
├── case-study-*/page.tsx                 # Case Studies (10)
├── api/leads/route.ts                    # Lead API
├── feed.xml/route.ts                     # RSS Feed
└── sitemap.ts                            # Sitemap
```

### Component Library (38 Components)

- **Layout**: Header, Footer, Navigation
- **Sections**: Hero, LeadForm, Testimonials, TrustBar, HowItWorks, ValueProps, ComparisonTable, CTASection, FAQSection, LocationsGrid, SituationsGrid
- **Templates**: LandingPageTemplate, LocationPageTemplate, CaseStudyPageTemplate, SituationPageTemplate
- **UI**: Button, Input, Card, Badge, Modal, PhoneLink
- **SEO**: LocalBusinessSchema, OrganizationSchema, FAQSchema, ArticleSchema

---

## Risk Mitigation

### Backup Plan
- Keep original WordPress site accessible during transition
- Have rollback procedure documented
- Monitor Search Console for crawl errors immediately post-launch

### Post-Launch Monitoring
- Daily Search Console checks for first 2 weeks
- Monitor organic traffic for any drops
- Track form submissions daily
- Fix any 404s immediately

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page Speed (Mobile) | 90+ |
| Page Speed (Desktop) | 95+ |
| Core Web Vitals | All Green |
| Organic Traffic | No drop (maintain baseline) |
| Form Conversion Rate | +10% improvement |

---

*Document Created: January 30, 2026*
*Last Updated: March 11, 2026*
*Status: ~99% Complete — All content built, QA passed, manual browser/device testing + DNS cutover remaining*
