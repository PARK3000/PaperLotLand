# GTM Integration Checklist

Quick reference checklist for completing the GTM integration.

---

## Phase 1: Code Implementation ✅ COMPLETE

- [x] Add GTM snippet to layout.tsx
- [x] Add GTM_ID to .env.local
- [x] Create pushToDataLayer() function
- [x] Update form-analytics.ts
- [x] Add field tracking to LeadForm
- [x] Add email capture tracking
- [x] Add enhanced conversion data
- [x] Update contact form
- [x] Create documentation

---

## Phase 2: GTM Workspace Configuration ⏳ PENDING

### Step 1: Create Variables (15 min)
- [ ] Create variable: `form_field_name`
- [ ] Create variable: `email_address`
- [ ] Create variable: `form_id`
- [ ] Create variable: `form_variant`
- [ ] Create variable: `lead_id`

### Step 2: Create Triggers (20 min)
- [ ] Create trigger: Form Field Focused (event: `form_field_focused`)
- [ ] Create trigger: Email Capture (event: `email_capture`)
- [ ] Create trigger: Lead Submission Generic (event: `lead_submission`)

### Step 3: Create GA4 Tags (30 min)
- [ ] Create tag: GA4 - Form Field Focused
- [ ] Create tag: GA4 - Email Capture
- [ ] Create tag: GA4 - Lead Submission (Generic)

### Step 4: Update Conversion Tags (30 min)
- [ ] Update: Google Ads (Full Form Submission) - use new trigger
- [ ] Update: Bing Form Submit Tag - use new trigger

### Step 5: Optional Cleanup (10 min)
- [ ] Pause old Gravity Forms triggers (gform_X)

---

## Phase 3: Testing ⏳ PENDING

### Local Testing
- [ ] Run `npm run dev`
- [ ] Open browser console
- [ ] Check GTM loaded: `window.google_tag_manager`
- [ ] Check dataLayer: `window.dataLayer`
- [ ] Focus form field → verify event in console
- [ ] Enter email → verify email_capture event
- [ ] Submit form → verify lead_submission event

### GTM Preview Mode
- [ ] Enable GTM Preview
- [ ] Enter dev/prod URL
- [ ] Test page load → base tags fire
- [ ] Test field focus → GA4 tag fires
- [ ] Test email capture → GA4 tag fires
- [ ] Test form submit → all conversion tags fire
- [ ] Test phone click → phone tag fires

### GA4 Realtime
- [ ] Open GA4 Realtime report
- [ ] Interact with forms
- [ ] Verify events appear (10-30 sec delay)
- [ ] Check event parameters

### Conversion Testing
- [ ] Google Ads → check conversion appears (24-48 hrs)
- [ ] Microsoft Ads → check conversion appears (24-48 hrs)
- [ ] Enhanced conversions → check match rates improving

---

## Phase 4: Deployment ⏳ PENDING

### Pre-Deploy
- [ ] All GTM tests pass
- [ ] No console errors
- [ ] GA4 events verified
- [ ] GTM container published

### Deploy
- [ ] Deploy to production
- [ ] Verify GTM loads on production
- [ ] Test dataLayer on production
- [ ] Run GTM Preview on production URL

### Post-Deploy
- [ ] Monitor GA4 for 24 hours
- [ ] Check conversion counts
- [ ] Monitor for errors
- [ ] Verify all tags firing

---

## Phase 5: Monitoring ⏳ PENDING

### Day 1
- [ ] Check GA4 event volume
- [ ] Verify no console errors
- [ ] Check form submissions tracking
- [ ] Verify phone clicks tracking

### Week 1
- [ ] Analyze form field abandonment
- [ ] Review email capture vs. submission
- [ ] Check conversion attribution
- [ ] Review session recordings (Clarity)

### Month 1
- [ ] Measure Google Ads ROAS improvement
- [ ] Analyze form optimization opportunities
- [ ] Review enhanced conversion match rates
- [ ] Plan next optimizations

---

## Quick Reference

### Test DataLayer Events
```javascript
// All events
window.dataLayer

// Field focus events
window.dataLayer.filter(e => e.event === 'form_field_focused')

// Email capture events
window.dataLayer.filter(e => e.event === 'email_capture')

// Lead submission events
window.dataLayer.filter(e => e.event === 'lead_submission')
```

### GTM Container
- **ID:** GTM-MH7HT8F
- **URL:** https://tagmanager.google.com

### GA4 Property
- **ID:** G-50DQ1QJ6VZ
- **URL:** https://analytics.google.com

---

## Documentation

- **Quick Start:** `/docs/GTM_QUICK_START.md`
- **Workspace Setup:** `/docs/GTM_WORKSPACE_SETUP.md`
- **Full Documentation:** `/docs/GTM_IMPLEMENTATION.md`
- **Summary:** `/GTM_INTEGRATION_SUMMARY.md`

---

## Success Criteria

- [x] Code deployed
- [ ] GTM workspace configured
- [ ] All tests passing
- [ ] Events in GA4
- [ ] Conversions in ad platforms
- [ ] No errors in 48 hours
- [ ] Data quality verified

---

**Current Status:** Code Complete ✅ | GTM Config Pending ⏳

**Next Action:** Follow `/docs/GTM_WORKSPACE_SETUP.md`

**Estimated Time to Complete:** 2-3 hours for GTM config + testing
