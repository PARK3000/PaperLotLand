# GTM Integration - Quick Start Guide

## ✅ What's Done (Code Implementation)

### 1. GTM Container Connected
- GTM snippet added to `/src/app/layout.tsx`
- Container ID: `GTM-MH7HT8F`
- Loads on all pages with `strategy="afterInteractive"`
- Includes noscript fallback

### 2. Hybrid Tracking Approach
- **GTM** handles third-party tags (Google Ads, Microsoft Ads, Clarity)
- **Direct GA4** handles detailed analytics events
- **Unified dataLayer** pushes to both simultaneously

### 3. DataLayer Push Function
- Created `pushToDataLayer()` in `/src/lib/analytics/gtag.ts`
- Pushes events to GTM dataLayer
- Also sends to direct GA4 when available
- Exported via `/src/lib/analytics/index.ts`

### 4. Form Analytics Updated
**File:** `/src/lib/analytics/form-analytics.ts`

**Events Now Push to DataLayer:**
- `form_start` - When user focuses first field
- `lead_submission` - When form successfully submits (with user data)

**Enhanced Conversions Data:**
- Sends `email`, `phone`, `firstName`, `lastName` with lead_submission
- Enables better Google Ads conversion matching

### 5. LeadForm Component Enhanced
**File:** `/src/components/sections/lead-form.tsx`

**New Tracking:**
- `form_field_focused` - Every field focus
- `email_capture` - When valid email entered
- Enhanced form success with user data

**Fields Tracked:**
- Name (standard/full variants)
- Address (all variants)
- Phone (all variants)
- Email (full variant only)

### 6. Contact Form Enhanced
**File:** `/src/app/contact-us/page.tsx`

**New Tracking:**
- `form_field_focused` - Every field focus
- `email_capture` - When valid email entered

**Fields Tracked:**
- First Name
- Last Name
- Email
- Phone
- Subject
- Message

---

## ⏳ What's Pending (GTM Workspace Configuration)

### Required: Configure GTM Workspace

**Time Estimate:** 2-3 hours
**Follow:** `GTM_WORKSPACE_SETUP.md` for detailed steps

**Summary:**
1. Create dataLayer variables (form_field_name, email_address, etc.)
2. Create custom event triggers (form_field_focused, email_capture, lead_submission)
3. Create GA4 event tags for field tracking
4. Update existing conversion tags to use new triggers
5. Test in GTM Preview mode
6. Publish container

---

## 🚀 How to Test Right Now (Before GTM Configuration)

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser Console
```javascript
// Check GTM loaded
console.log('GTM Loaded:', !!window.google_tag_manager)
console.log('GTM Container:', window.google_tag_manager?.['GTM-MH7HT8F'])

// Check dataLayer exists
console.log('DataLayer:', window.dataLayer)
```

### 3. Test Form Interactions

**Go to:** http://localhost:3000

**Actions:**
1. Focus on address field
2. Focus on phone field
3. Enter valid email (if full form)
4. Submit form

**Check DataLayer:**
```javascript
// See all events
console.log(window.dataLayer)

// Filter specific events
console.log('Field Focus Events:',
  window.dataLayer.filter(e => e.event === 'form_field_focused'))

console.log('Email Capture Events:',
  window.dataLayer.filter(e => e.event === 'email_capture'))

console.log('Lead Submission Events:',
  window.dataLayer.filter(e => e.event === 'lead_submission'))
```

**Expected Output:**
```javascript
// Field focus event
{
  event: 'form_field_focused',
  form_field_name: 'address',
  form_id: 'lead-form-quick',
  form_variant: 'quick'
}

// Email capture event
{
  event: 'email_capture',
  email_address: 'user@example.com',
  form_id: 'lead-form-full',
  form_variant: 'full'
}

// Lead submission event
{
  event: 'lead_submission',
  form_id: 'lead-form-quick',
  lead_id: 'abc123',
  email: 'user@example.com',
  phone: '7025551234',
  firstName: 'John',
  lastName: 'Smith'
}
```

---

## 📊 DataLayer Event Reference

### form_field_focused
**When:** User focuses any form field
**Data:**
- `event`: "form_field_focused"
- `form_field_name`: Field name (e.g., "address", "phone", "email")
- `form_id`: Form identifier (e.g., "lead-form-quick")
- `form_variant`: Form variant (e.g., "quick", "standard", "full")

### email_capture
**When:** User enters valid email format
**Data:**
- `event`: "email_capture"
- `email_address`: Email entered
- `form_id`: Form identifier
- `form_variant`: Form variant

### lead_submission
**When:** Form successfully submits
**Data:**
- `event`: "lead_submission"
- `form_id`: Form identifier
- `lead_id`: ID from API response
- `email`: User's email (if provided)
- `phone`: User's phone (if provided)
- `firstName`: First name from full name
- `lastName`: Last name from full name

### form_start
**When:** User focuses first field (one-time per session)
**Data:**
- `event`: "form_start"
- `form_id`: Form identifier
- `form_variant`: Form variant
- `first_field`: Name of first field focused

---

## 🎯 What This Enables (After GTM Configuration)

### Conversion Tracking
- ✅ Google Ads conversions with enhanced matching
- ✅ Microsoft Ads conversions
- ✅ Phone click tracking
- ✅ Email capture as partial leads

### User Behavior Analysis
- ✅ Which fields users interact with
- ✅ Field abandonment rates
- ✅ Email capture vs. full submission
- ✅ Form variant performance
- ✅ Time spent in each field

### Marketing Tools
- ✅ Retarget users who captured email but didn't submit
- ✅ Optimize ad spend based on actual conversions
- ✅ Identify form friction points
- ✅ A/B test form improvements

### Third-Party Integrations
- ✅ Microsoft Clarity session recordings
- ✅ Pearl Diver lead intelligence
- ✅ QualiFi lead scoring
- ✅ Easy to add new marketing pixels

---

## 🔄 Current Tracking Status

### ✅ Working Now (Before GTM Config)
- GTM container loads
- Events push to dataLayer
- Third-party tags fire (Clarity, Pearl Diver, etc.)
- Phone click tracking works
- Thank you page tracking works
- Direct GA4 tracking works

### ⏳ Requires GTM Configuration
- Field-level tracking tags
- Email capture conversion tags
- Updated lead submission triggers
- Google Ads conversion updates
- Microsoft Ads conversion updates

---

## 📝 Next Steps

### For Developer:
1. ✅ Code changes complete
2. ✅ Test dataLayer locally (see above)
3. ⏳ Deploy to production
4. ⏳ Monitor console for errors

### For Marketing/Analytics:
1. ⏳ Follow `GTM_WORKSPACE_SETUP.md`
2. ⏳ Configure triggers and tags in GTM
3. ⏳ Test with GTM Preview mode
4. ⏳ Publish GTM container
5. ⏳ Monitor GA4 for 48 hours

### Timeline:
- **Code:** ✅ Complete
- **GTM Config:** 2-3 hours (pending)
- **Testing:** 1 hour
- **Production Deploy:** Immediate
- **Monitoring:** 48 hours post-deploy

---

## 🆘 Troubleshooting

### GTM Not Loading?
```javascript
// Check env variable
console.log('GTM ID:', process.env.NEXT_PUBLIC_GTM_ID)
// Should show: GTM-MH7HT8F

// Check if GTM loaded
console.log('GTM:', window.google_tag_manager)
// Should show object with GTM-MH7HT8F key
```

**Fix:**
- Verify `.env.local` has `NEXT_PUBLIC_GTM_ID=GTM-MH7HT8F`
- Restart dev server after adding env vars
- Clear browser cache

### DataLayer Not Populated?
```javascript
// Check if dataLayer exists
console.log('DataLayer exists:', Array.isArray(window.dataLayer))
// Should be: true

// Check if pushToDataLayer function works
window.dataLayer.push({ event: 'test', test: true })
console.log('Last event:', window.dataLayer[window.dataLayer.length - 1])
// Should show: { event: 'test', test: true }
```

**Fix:**
- Check GTM snippet in layout.tsx
- Verify no console errors
- Check form components import pushToDataLayer

### Events Not Firing?
```javascript
// Test manual push
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'form_field_focused',
    form_field_name: 'test',
    form_id: 'test-form'
  })
}

// Check it appears
console.log(window.dataLayer.filter(e => e.event === 'form_field_focused'))
```

**Fix:**
- Check onFocus handlers are on form fields
- Verify pushToDataLayer import in component
- Check browser console for errors

---

## 📚 Documentation

**Full Documentation:**
- `GTM_IMPLEMENTATION.md` - Complete implementation guide
- `GTM_WORKSPACE_SETUP.md` - Step-by-step GTM configuration
- This file - Quick start reference

**External Resources:**
- GTM Help: https://support.google.com/tagmanager
- GA4 Help: https://support.google.com/analytics
- DataLayer Spec: https://developers.google.com/tag-platform/devguides/datalayer

---

## ✨ Summary

**Code Status:** ✅ Complete and ready
**GTM Status:** ⏳ Requires workspace configuration
**Testing:** ✅ Can test dataLayer now
**Production:** ⏳ Ready to deploy after GTM config

**Next Action:** Follow `GTM_WORKSPACE_SETUP.md` to configure GTM workspace (2-3 hours)
