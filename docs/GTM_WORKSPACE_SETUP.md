# GTM Workspace Configuration Checklist

**Container:** GTM-MH7HT8F
**Status:** ⏳ Code Complete, GTM Configuration Pending
**Estimated Time:** 2-3 hours

---

## Prerequisites

- ✅ GTM snippet added to website (layout.tsx)
- ✅ Events pushing to dataLayer from code
- ✅ Access to GTM workspace
- ✅ Access to GA4 property (G-50DQ1QJ6VZ)

---

## Step 1: Create Data Layer Variables (15 min)

Go to: **Variables** → **New**

### Variable 1: form_field_name
- **Name:** `form_field_name`
- **Type:** Data Layer Variable
- **Data Layer Variable Name:** `form_field_name`
- **Data Layer Version:** Version 2
- **Save**

### Variable 2: email_address
- **Name:** `email_address`
- **Type:** Data Layer Variable
- **Data Layer Variable Name:** `email_address`
- **Data Layer Version:** Version 2
- **Save**

### Variable 3: form_id
- **Name:** `form_id`
- **Type:** Data Layer Variable
- **Data Layer Variable Name:** `form_id`
- **Data Layer Version:** Version 2
- **Save**

### Variable 4: form_variant
- **Name:** `form_variant`
- **Type:** Data Layer Variable
- **Data Layer Variable Name:** `form_variant`
- **Data Layer Version:** Version 2
- **Save**

### Variable 5: lead_id
- **Name:** `lead_id`
- **Type:** Data Layer Variable
- **Data Layer Variable Name:** `lead_id`
- **Data Layer Version:** Version 2
- **Save**

---

## Step 2: Create Custom Event Triggers (20 min)

Go to: **Triggers** → **New**

### Trigger 1: Form Field Focused
- **Name:** `Form Field Focused`
- **Trigger Type:** Custom Event
- **Event name:** `form_field_focused`
- **This trigger fires on:** All Custom Events
- **Save**

### Trigger 2: Email Capture
- **Name:** `Email Capture`
- **Trigger Type:** Custom Event
- **Event name:** `email_capture`
- **This trigger fires on:** All Custom Events
- **Save**

### Trigger 3: Lead Submission (Generic)
- **Name:** `Lead Submission (Generic)`
- **Trigger Type:** Custom Event
- **Event name:** `lead_submission`
- **This trigger fires on:** All Custom Events
- **Save**

---

## Step 3: Create GA4 Event Tags (30 min)

Go to: **Tags** → **New**

### Tag 1: GA4 - Form Field Focused
- **Name:** `GA4 - Form Field Focused`
- **Tag Type:** Google Analytics: GA4 Event
- **Configuration Tag:** Choose `{{GA4 ID}}` or create new with G-50DQ1QJ6VZ
- **Event Name:** `form_field_focused`
- **Event Parameters:**
  - Parameter Name: `field_name` → Value: `{{form_field_name}}`
  - Parameter Name: `form_id` → Value: `{{form_id}}`
  - Parameter Name: `form_variant` → Value: `{{form_variant}}`
- **Triggering:** Select `Form Field Focused` trigger
- **Save**

### Tag 2: GA4 - Email Capture
- **Name:** `GA4 - Email Capture`
- **Tag Type:** Google Analytics: GA4 Event
- **Configuration Tag:** `{{GA4 ID}}`
- **Event Name:** `email_capture`
- **Event Parameters:**
  - Parameter Name: `email_address` → Value: `{{email_address}}`
  - Parameter Name: `form_id` → Value: `{{form_id}}`
  - Parameter Name: `form_variant` → Value: `{{form_variant}}`
- **Triggering:** Select `Email Capture` trigger
- **Save**

**⚠️ Privacy Note:** Consider hashing `{{email_address}}` for GDPR compliance

### Tag 3: GA4 - Lead Submission (Generic)
- **Name:** `GA4 - Lead Submission (Generic)`
- **Tag Type:** Google Analytics: GA4 Event
- **Configuration Tag:** `{{GA4 ID}}`
- **Event Name:** `lead_submission`
- **Event Parameters:**
  - Parameter Name: `form_id` → Value: `{{form_id}}`
  - Parameter Name: `lead_id` → Value: `{{lead_id}}`
  - Parameter Name: `email` → Value: `{{email}}`
  - Parameter Name: `phone` → Value: `{{phone}}`
- **Triggering:** Select `Lead Submission (Generic)` trigger
- **Save**

---

## Step 4: Update Existing Conversion Tags (30 min)

### Update: Google Ads (Full Form Submission)
1. Find tag: **Google Ads (Full Form Submission)**
2. Click to edit
3. **Triggering:**
   - Remove trigger: `gform_8`
   - Add trigger: `Lead Submission (Generic)`
4. **Save**

### Update: Bing Form Submit Tag
1. Find tag: **Bing Form Submit Tag**
2. Click to edit
3. **Triggering:**
   - Remove old triggers (if any)
   - Add trigger: `Lead Submission (Generic)`
4. **Save**

### Update: Get My Offer Button Click (Optional)
1. Find tag: **Get My Offer Button Click**
2. This already works with click trigger
3. **Optional:** Also fire on `Lead Submission (Generic)` for redundancy
4. **Save**

---

## Step 5: Optional - Pause Old Triggers (10 min)

**These triggers will never fire (expecting Gravity Forms):**
- gform_7
- gform_8
- gform_9
- gform_10
- gform_11
- gform_18
- gform_5

**Options:**
1. **Pause them:**
   - Go to Triggers
   - Click each trigger
   - Click "Pause" in top right
   - Keeps them for reference

2. **Delete them:**
   - More work but cleaner workspace

3. **Leave them:**
   - No harm (they just won't fire)

**Recommended:** Pause them (can unpause if needed later)

---

## Step 6: Test in Preview Mode (30 min)

### Enable Preview Mode
1. Click **Preview** button in top right of GTM workspace
2. Enter your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://webuyanyvegashouse.com`
3. GTM Tag Assistant opens in new window

### Test Sequence

#### Test 1: Page Load
- **Action:** Load homepage
- **Expected:**
  - ✅ GA4 - Base tag fires
  - ✅ Microsoft Clarity tag fires
  - ✅ Pearl Diver tag fires
  - ✅ Google Ads base tag fires
  - ✅ Microsoft Ads base tag fires

#### Test 2: Form Field Focus
- **Action:** Click on address field
- **Expected:**
  - ✅ `form_field_focused` event in dataLayer
  - ✅ GA4 - Form Field Focused tag fires
  - ✅ Variables show: `form_field_name=address`, `form_id=lead-form-quick`

#### Test 3: Multiple Field Focuses
- **Action:** Click on phone field, then name field
- **Expected:**
  - ✅ `form_field_focused` event fires for each field
  - ✅ GA4 tag fires multiple times with different field names

#### Test 4: Email Capture
- **Action:** Type valid email in email field (on full form variant)
- **Expected:**
  - ✅ `email_capture` event in dataLayer
  - ✅ GA4 - Email Capture tag fires
  - ✅ Variables show: `email_address=user@example.com`

#### Test 5: Form Submission
- **Action:** Fill out and submit form
- **Expected:**
  - ✅ `lead_submission` event in dataLayer
  - ✅ GA4 - Lead Submission tag fires
  - ✅ Google Ads conversion tag fires
  - ✅ Microsoft Ads conversion tag fires
  - ✅ Enhanced Conversion tag fires
  - ✅ Variables show: email, phone, firstName, lastName, lead_id

#### Test 6: Phone Click
- **Action:** Click phone number link
- **Expected:**
  - ✅ Click To Call trigger fires
  - ✅ Phone Call GA4 tag fires
  - ✅ Google Ads Phone conversion fires

### Troubleshooting Preview Mode

**If tags don't fire:**
1. Check event name matches trigger exactly (case-sensitive)
2. Check dataLayer has correct event:
   ```javascript
   window.dataLayer.filter(e => e.event === 'form_field_focused')
   ```
3. Check trigger conditions (no additional filters blocking)
4. Refresh both windows and try again

**If variables are empty:**
1. Check spelling of dataLayer key matches variable name
2. Check dataLayer actually has the key:
   ```javascript
   window.dataLayer.filter(e => e.form_field_name)
   ```
3. Check Data Layer Version is set to Version 2

---

## Step 7: Test in GA4 Realtime (15 min)

### Open GA4 Realtime Report
1. Go to https://analytics.google.com
2. Select property G-50DQ1QJ6VZ
3. Go to **Reports** → **Realtime**

### Test Events Appear

#### Test 1: Form Field Focused
- **Action:** Focus on address field on your site
- **Expected:** See `form_field_focused` event in Realtime
- **Check Parameters:**
  - `field_name`: address
  - `form_id`: lead-form-quick

#### Test 2: Email Capture
- **Action:** Enter valid email
- **Expected:** See `email_capture` event
- **Check Parameters:**
  - `email_address`: (your test email)
  - `form_id`: lead-form-full

#### Test 3: Lead Submission
- **Action:** Submit form
- **Expected:** See `lead_submission` event
- **Check Parameters:**
  - `form_id`: lead-form-quick
  - `lead_id`: (from API)
  - `email`, `phone`: (if provided)

**⚠️ Note:** Events may take 10-30 seconds to appear in Realtime

### Troubleshooting GA4

**If events don't appear:**
1. Check GTM Preview shows tag firing
2. Wait 60 seconds (can take up to 1 minute)
3. Check you're looking at correct GA4 property
4. Check GA4 configuration tag ID is correct (G-50DQ1QJ6VZ)
5. Clear browser cache and try again

---

## Step 8: Publish Container (10 min)

### Create Version
1. Click **Submit** button in top right of GTM workspace
2. **Version Name:** `Add field-level tracking and update form events`
3. **Version Description:**
```
- Added custom event triggers: form_field_focused, email_capture, lead_submission
- Created dataLayer variables: form_field_name, email_address, form_id, form_variant
- Added GA4 event tags for field tracking
- Updated conversion tags to use new lead_submission event
- Replaces Gravity Forms triggers with custom React form events
```
4. Click **Publish**

### Post-Publish
1. Version number increments (was v46, now v47)
2. Changes are live immediately
3. Continue monitoring in Preview mode on production

---

## Step 9: Verify in Production (30 min)

### Check Production Site
1. Go to production URL: https://webuyanyvegashouse.com
2. Open browser DevTools console
3. Check GTM loaded:
```javascript
console.log(window.google_tag_manager['GTM-MH7HT8F'])
```

### Test All Events Again
- Repeat Step 6 tests on production
- Use GTM Preview on production URL
- Verify in GA4 Realtime

### Monitor for 48 Hours
1. Check GA4 events are coming in
2. Check Google Ads conversions appear
3. Check Microsoft Ads conversions appear
4. Look for any errors or anomalies

---

## Step 10: Set Up GA4 Custom Definitions (20 min)

### Add Custom Dimensions

Go to: **GA4 Admin** → **Custom definitions** → **Create custom dimensions**

#### Dimension 1: Field Name
- **Dimension name:** Field Name
- **Scope:** Event
- **Event parameter:** field_name
- **Save**

#### Dimension 2: Form ID
- **Dimension name:** Form ID
- **Scope:** Event
- **Event parameter:** form_id
- **Save**

#### Dimension 3: Form Variant
- **Dimension name:** Form Variant
- **Scope:** Event
- **Event parameter:** form_variant
- **Save**

### Mark Conversions

Go to: **GA4 Events** → Find events → **Mark as conversion**

- ✅ `lead_submission` - Mark as conversion
- ✅ `email_capture` - Mark as conversion (partial lead)
- ⬜ `form_field_focused` - Don't mark (too many events)

---

## Success Checklist

After completing all steps, verify:

### GTM Container
- ✅ New variables created (form_field_name, email_address, etc.)
- ✅ New triggers created (Form Field Focused, Email Capture, Lead Submission)
- ✅ New GA4 tags created and firing
- ✅ Conversion tags updated with new triggers
- ✅ Container published (version 47+)

### Testing
- ✅ GTM Preview shows all tags firing correctly
- ✅ DataLayer shows correct events and data
- ✅ GA4 Realtime shows events appearing
- ✅ All form interactions tracked

### Production
- ✅ Production site loading GTM correctly
- ✅ Events firing on production
- ✅ No console errors
- ✅ GA4 receiving data

### Monitoring (48 hours)
- ✅ GA4 events steady flow
- ✅ Google Ads conversions appearing
- ✅ Microsoft Ads conversions appearing
- ✅ No data quality issues

---

## Expected Results

### Immediate (After Publishing)
- Form field interactions tracked in GA4
- Email captures tracked as partial leads
- Full form submissions tracked with user data
- Phone clicks tracked

### Within 24 Hours
- Google Ads conversions start appearing
- Microsoft Ads conversions start appearing
- Enhanced conversions improving match rates

### Within 1 Week
- Enough data to analyze form abandonment by field
- Identify which fields cause most drop-off
- Email capture vs. full submission rates
- Form variant performance comparison

### Within 1 Month
- Google Ads ROAS improvement (20-30% from enhanced conversions)
- Optimized form based on field-level data
- Better understanding of user behavior
- More accurate conversion attribution

---

## Common Issues & Solutions

### Issue: Tags Fire Multiple Times

**Symptom:** Same tag fires 2-3 times for one action

**Cause:** Multiple triggers firing on same event

**Solution:**
1. Check triggers in GTM Preview
2. Make triggers more specific with filters
3. Or combine into one trigger

### Issue: Variables Show "undefined"

**Symptom:** Variable shows "undefined" in GTM Preview

**Cause:** DataLayer key doesn't match variable name

**Solution:**
1. Check exact spelling (case-sensitive)
2. Check dataLayer has the key:
   ```javascript
   console.log(window.dataLayer.filter(e => e.form_field_name))
   ```
3. Update variable name to match dataLayer key

### Issue: Events in DataLayer but Tags Don't Fire

**Symptom:** See events in dataLayer console, but tags don't fire

**Cause:** Trigger event name doesn't match

**Solution:**
1. Check trigger event name matches exactly (case-sensitive)
2. Event: `form_field_focused` vs `formFieldFocused` - must match exactly
3. Update trigger to match event name in code

### Issue: Duplicate Events in GA4

**Symptom:** Same event appears twice in GA4

**Cause:** Hybrid approach sends to both GTM and direct gtag

**Solution:**
1. **Intended behavior** for hybrid approach
2. Can deduplicate in GA4 reports if needed
3. Or disable one source (GTM GA4 Base tag OR direct gtag)

### Issue: Enhanced Conversions Not Showing

**Symptom:** Google Ads not showing enhanced conversion data

**Cause:** User data not in dataLayer or tag not firing

**Solution:**
1. Check dataLayer has email, phone, firstName, lastName:
   ```javascript
   window.dataLayer.filter(e => e.event === 'lead_submission')
   ```
2. Check Enhanced Conversion tag fires in GTM Preview
3. Wait 24-48 hours for data to appear in Google Ads
4. Check Google Ads conversion action has enhanced conversions enabled

---

## Support

**GTM Issues:**
- GTM Help: https://support.google.com/tagmanager
- Tag Assistant: https://tagassistant.google.com

**GA4 Issues:**
- GA4 Help: https://support.google.com/analytics
- DebugView: GA4 Admin → DebugView (real-time debugging)

**Conversion Tracking:**
- Google Ads Help: https://support.google.com/google-ads
- Microsoft Ads Help: https://help.ads.microsoft.com

**Code Issues:**
- See `GTM_IMPLEMENTATION.md` for code documentation
- Check browser console for JavaScript errors
- Verify dataLayer with `console.log(window.dataLayer)`

---

## Next Review: 1 Week After Launch

**What to Check:**
1. Event volume in GA4 (should be consistent)
2. Conversion counts in Google Ads and Microsoft Ads
3. Form abandonment data by field
4. Email capture vs. full submission rates
5. Any errors or anomalies in data

**Optimization Opportunities:**
1. Fields with high abandonment → simplify or remove
2. Email capture without submission → retargeting campaigns
3. Form variants with low conversion → test alternatives
4. High drop-off points → A/B test improvements

---

**Estimated Total Time:** 2-3 hours
**Difficulty:** Intermediate
**Prerequisites:** GTM admin access, basic GTM knowledge

Good luck! 🚀
