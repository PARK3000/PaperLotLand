# DNS Cutover Plan: WordPress → Vercel

**Date:** March 9, 2026
**Current state:** WordPress on Cloudways (webuyanyvegashouse.com) → Vercel (webuyanyvegashouse.vercel.app)

---

## Pre-Cutover Checklist

### 1. WordPress Backup (Do first, before anything else)

- [ ] **Cloudways full backup:** Settings → Backups → Take Backup Now
- [ ] **Download backup locally** — don't rely solely on Cloudways retention
- [ ] **Manual database export:** WP-CLI `wp db export` or phpMyAdmin
- [ ] **Archive `/wp-content/`** — themes, plugins, uploads, Gravity Forms entries
- [ ] **Export Gravity Forms entries** — these live in the WP database; export CSV copies separately via GF → Import/Export
- [ ] **Screenshot/record current Google Analytics and Search Console data** — baseline for comparison post-cutover

### 2. Set Up Legacy Subdomain for Continued WordPress Access

This is the critical piece. After DNS points to Vercel, you need another way into WordPress.

**Sequence:**

1. **Choose subdomain:** `legacy.webuyanyvegashouse.com` (or `wp.webuyanyvegashouse.com`)
2. **Create DNS A record** for the subdomain pointing to your Cloudways server IP — do this BEFORE changing the main domain
3. **In Cloudways:** Application → Domain Management → add the subdomain as an alias
4. **Provision SSL** for the subdomain via Cloudways (Let's Encrypt — Application → SSL Certificate)
5. **Test:** Verify `legacy.webuyanyvegashouse.com` resolves and `/wp-admin` works
6. **After cutover:** Update WordPress `home` and `siteurl` in `wp_options` to `https://legacy.webuyanyvegashouse.com` so internal WP links don't redirect you to the Vercel site

**Gotcha:** If Cloudways has the main domain set as "primary," removing its DNS may cause issues. Verify that the subdomain alias is enough to keep the application running, or switch the primary domain to the subdomain before cutover.

### 3. Lower DNS TTL

- [ ] **2-3 days before cutover:** Drop TTL to 300 seconds (5 minutes) on the main domain's A record
- [ ] Verify the TTL change has propagated: `dig webuyanyvegashouse.com +short` should show TTL ≤ 300

### 4. ~~Fix Missing 301 Redirects in `next.config.ts`~~ DONE

All missing redirects added to `next.config.ts`. Build verified clean.

### 5. Verify Existing Pages Return 200

The Vercel crawl missed many pages that DO exist as `page.tsx` files (situation pages, location pages). These weren't crawled likely because they're not linked prominently. Verify they return 200:

- [ ] All 16 situation pages (`/stop-a-foreclosure/`, `/facing-bankruptcy/`, etc.)
- [ ] All 9 location pages (`/henderson/`, `/we-buy-houses-summerlin/`, etc.)
- [ ] All 10 case study pages
- [ ] All 10 landing pages (`/lp/*`)
- [ ] `/blog/page/2/` through `/blog/page/9/` (dynamic routes should handle this)

### 6. ~~Fix Broken Link Placeholders~~ DONE

Placeholder links already fixed in main branch. Blog posts with wrong domains/paths (`avoiding-foreclosure...json`, `when-is-a-good-time...json`) also fixed.

### 7. Verify Lead Capture Pipeline

- [ ] Test form submission on Vercel preview deployment (`/get-your-cash-today/`, `/contact-us/`, popup form)
- [ ] Verify submissions reach your CRM / email system
- [ ] Verify the `/api/leads/` endpoint returns proper responses
- [ ] Test the abandoned leads cron (`/api/cron/abandoned-leads`) works on Vercel

### 8. Verify Tracking & Analytics

- [ ] GA4 tag fires on Vercel site (check via GTM preview mode)
- [ ] PostHog events tracking
- [ ] ClickCease active (confirmed present on both sites)
- [ ] Microsoft Clarity recording (if configured on Vercel)
- [ ] Google Ads conversion tracking fires on form submit + thank-you page

### 9. MX / Email Records

- [ ] Document ALL current DNS records (A, AAAA, CNAME, MX, TXT/SPF, DKIM, DMARC)
- [ ] Ensure MX records, SPF, DKIM are preserved when switching DNS
- [ ] If using Cloudflare or a DNS proxy, understand where records actually live

### 10. Google Ads

- [ ] Update any final URLs in Google Ads campaigns if URL paths changed
- [ ] Verify conversion tracking works on the Vercel site
- [ ] Consider pausing campaigns during the 15-minute cutover window to avoid wasted spend on potential downtime

---

## Cutover Day

### Execution (pick a low-traffic time — weekday morning)

1. **Final backup** of WordPress (one more for safety)
2. **Update DNS:** Change A record / CNAME to point to Vercel
   - If using Vercel Domains: Add domain in Vercel Dashboard → Settings → Domains, then follow their DNS instructions
   - Vercel will auto-provision SSL
3. **Verify propagation:** `dig webuyanyvegashouse.com` — look for new IP
4. **Test in browser:** Clear cache, verify homepage loads from Vercel
5. **Test critical paths:**
   - Homepage loads
   - Lead form submits successfully
   - Blog loads, individual posts load
   - Landing pages (`/lp/*`) load
   - 301 redirects fire for old WP URLs
6. **Update WordPress:** On the legacy subdomain, update `siteurl` and `home` in `wp_options` to `https://legacy.webuyanyvegashouse.com`
7. **Submit updated sitemap** in Google Search Console

### Monitoring (first 48 hours)

- [ ] Watch GA4 real-time for traffic continuity
- [ ] Check Google Search Console for crawl errors (will take 1-2 days to appear)
- [ ] Monitor form submissions — compare volume to pre-cutover baseline
- [ ] Check Vercel deployment logs for 404s and 500s
- [ ] Verify Google Ads conversions still tracking

---

## Rollback Plan

**If something goes wrong:**

1. **Point DNS back** to the Cloudways IP address
2. With 300s TTL, traffic returns to WordPress within ~5 minutes
3. Keep Cloudways application running and untouched for **at least 4 weeks** post-cutover

**Triggers for rollback:**
- Lead form is broken and submissions aren't being captured
- Major pages returning 404/500
- Google Ads conversion tracking broken (wasting ad spend)
- Site not loading at all

**Do NOT rollback for:**
- Minor styling issues
- Individual blog posts 404ing (fix redirects instead)
- Slow initial load (Vercel cold starts — will resolve)

---

## Post-Cutover Cleanup (Week 2-4)

- [ ] Restore DNS TTL to normal (3600 or higher)
- [ ] Monitor Google Search Console for 404 errors and add any missing redirects
- [ ] Monitor Google rankings for target keywords — compare to baseline
- [ ] Disable WP-Cron on the legacy subdomain to prevent duplicate emails/actions
- [ ] After 4 weeks with no issues, consider downgrading or shutting down Cloudways (keep backups)
- [ ] Update Google Business Profile if any URLs changed
- [ ] Update any directory listings (Yelp, Facebook, etc.) if deep links changed
- [ ] File a Change of Address in Google Search Console if applicable (probably not needed since domain stays the same)

---

## Risk Summary

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Missing 301 redirects → SEO traffic loss | **HIGH** | Add all redirects in next.config.ts before cutover |
| Lead form broken → lost revenue | **HIGH** | Test thoroughly on preview deployment |
| MX records lost → email breaks | **HIGH** | Document all DNS records before touching anything |
| Google Ads tracking breaks → wasted spend | **MEDIUM** | Test conversion tracking; pause campaigns during cutover |
| WP admin inaccessible after cutover | **MEDIUM** | Legacy subdomain setup before cutover |
| Cloudways requires primary domain | **LOW** | Test subdomain access while main domain still active |
| Blog pagination breaks | **LOW** | Verify dynamic route `/blog/page/[num]/` works |
