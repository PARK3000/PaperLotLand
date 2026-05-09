import { useState } from "react";

const STATS = {
  total_real: 66, total_test: 32, total_no_data: 22,
  avg_clicks: 8.7, avg_dur: 53.9,
  fast_converts: 23, mid_converts: 22, slow_converts: 21,
  sources: { google: 29, direct: 17, bing: 12, ActiveCampaign: 6, gmb: 2 },
  lps: {
    "(homepage/direct)": 25, "/lp/cash-offer-for-my-house/": 13,
    "/lp/sell-my-house-fast/": 8, "/lp/vegas-home-buyer/": 7,
    "/lp/we-buy-any-vegas-house/": 7, "/lp/sell-my-house-for-cash-vegas/": 5,
    "/lp/companies-that-buy-houses-for-cash/": 1,
  },
  pages_dist: { 1: 9, 2: 34, 3: 10, 4: 6, 5: 3, 6: 1, 7: 2, 11: 1 },
};

const LEADS = [
  { ts: "2026-03-08", name: "RAYMOND WU", phone: "(559) 586-9448", address: "6105 Castle Bay Dr, Las Vegas, NV 89108", source: "bing", campaign: "Bing-Cash Offer", term: "www.homepath,com", lp: "/lp/sell-my-house-fast/", dur: 48.0, clicks: 19, pages: 11, link: "https://clarity.microsoft.com/player/rk2y22s3b5/bak6h0/pvqa3d", note: "11 pages — heavy researcher, competitive searcher" },
  { ts: "2026-03-08", name: "Daniel Carlson", phone: "(702) 499-1124", address: "2346 Moorpark Way, Henderson, NV 89014", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/cash-offer-for-my-house/", dur: 13.4, clicks: 32, pages: 4, link: "https://clarity.microsoft.com/player/rk2y22s3b5/aywru7/fgzq6m", note: "32 clicks — highly engaged, revisited LP after thank-you" },
  { ts: "2026-03-07", name: "Keith Stumbaugh", phone: "(702) 672-4667", address: "386 Summerland Dr, Henderson, NV 89002", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/cash-offer-for-my-house/", dur: 3.4, clicks: 12, pages: 3, link: "https://clarity.microsoft.com/player/rk2y22s3b5/15mtxc4/58g1e4", note: "Fast 3.4 min convert, revisited LP after submit" },
  { ts: "2026-03-06", name: "Heather Paige", phone: "(530) 613-3149", address: "7917 Lonette Ave, Las Vegas, NV 89147", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 17.3, clicks: 9, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1fxg9ba/1xrygm5", note: "Direct → homepage → submit (word of mouth likely)" },
  { ts: "2026-03-05", name: "Chris Turner", phone: "(702) 769-1407", address: "5905 Halifax Avenue, Las Vegas", source: "ActiveCampaign", campaign: "(Day 1 - V3) Quick Question", term: "", lp: "(homepage)", dur: 3.3, clicks: 7, pages: 4, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1a26x4u/17ez0e1", note: "Day 1 email → converted. Homepage → cash-today → homepage → submit" },
  { ts: "2026-03-03", name: "Maria Lopez", phone: "(787) 673-5233", address: "3361 Casalette Ln, Henderson, NV 89044", source: "gmb", campaign: "gmb", term: "", lp: "(homepage)", dur: 19.8, clicks: 40, pages: 6, link: "https://clarity.microsoft.com/player/rk2y22s3b5/10ycdb4/k30rwv", note: "40 clicks — GMB → blog post → homepage → submit. Heavy reader" },
  { ts: "2026-03-01", name: "Raul Ruiz Avalos", phone: "(170) 288-5733", address: "3164 Hebard Dr, Las Vegas, NV 89121", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 5.4, clicks: 8, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/uhqfz9/18nj68t", note: "" },
  { ts: "2026-02-27", name: "Albert Canales", phone: "(170) 248-1875", address: "8309 Vibrant Dr, Las Vegas, NV 89117", source: "bing", campaign: "Bing-Cash Offer", term: "buy my house fast for cash", lp: "/lp/cash-offer-for-my-house/", dur: 975.8, clicks: 0, pages: 1, link: "https://clarity.microsoft.com/player/rk2y22s3b5/kbwq3i/1vry5su", note: "Tab left open 16hrs. 0 clicks = likely submitted via autofill" },
  { ts: "2026-02-27", name: "Wei Zhong Wang", phone: "(702) 963-2345", address: "3488 Ponza Ct, Las Vegas, NV 89141", source: "direct", campaign: "", term: "", lp: "/lp/sell-my-house-fast/", dur: 6.7, clicks: 10, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/qrpg4r/1jwom5a", note: "Entered from thank-you URL first (bookmarked?)" },
  { ts: "2026-02-26", name: "Susan Puzzo", phone: "(860) 748-8855", address: "3425 E Russell Rd, Las Vegas, NV 89120", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 1731.3, clicks: 16, pages: 4, link: "https://clarity.microsoft.com/player/rk2y22s3b5/2dji8v/9czazi", note: "Tab open 28hrs. Submitted twice (thank-you appeared twice in journey)" },
  { ts: "2026-02-25", name: "Brandi Ryan", phone: "(702) 328-4692", address: "9108 Safeport Ct, Las Vegas, NV 89117", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 5.0, clicks: 6, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/9r4dlk/1yx0vuz", note: "" },
  { ts: "2026-02-24", name: "Carlos Vazquez", phone: "(170) 223-6652", address: "2806 San Martin Ct, Las Vegas, NV 89121", source: "bing", campaign: "Bing-Cash Offer", term: "best home selling las vegas", lp: "/lp/sell-my-house-fast/", dur: 36.8, clicks: 7, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1sf4m2u/gf240o", note: "Returned as Direct 2hrs later — double submit" },
  { ts: "2026-02-24", name: "Ferenc Cseszko", phone: "(702) 237-2017", address: "371 Bridgeton Cross Ct, Las Vegas, NV 89148", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/cash-offer-for-my-house/", dur: 35.3, clicks: 10, pages: 3, link: "https://clarity.microsoft.com/player/rk2y22s3b5/cvcw2y/8lurtq", note: "Visited homepage after submitting — exploring trust signals" },
  { ts: "2026-02-23", name: "Li Zhang", phone: "(504) 666-5346", address: "4362 Caliente St, Las Vegas, NV 89119", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 8.4, clicks: 11, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/ly5v4n/13n4mxd", note: "" },
  { ts: "2026-02-22", name: "tamara pope", phone: "", address: "107 Newburg Ave, North Las Vegas, NV 89032", source: "bing", campaign: "Bing- WBAVH (Branded)", term: "we buy houses", lp: "/lp/cash-offer-for-my-house/", dur: 10.3, clicks: 24, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/16fgyku/1rhvqo", note: "24 clicks, no phone submitted — follow up needed" },
  { ts: "2026-02-22", name: "Michael Daniel", phone: "(702) 637-6329", address: "2960 Fire Cracker Red St, Las Vegas, NV 89122", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/sell-my-house-fast/", dur: 4.8, clicks: 5, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/9iz8od/1jms9oo", note: "" },
  { ts: "2026-02-18", name: "Stephen Syson", phone: "(805) 708-4385", address: "7112 Via Campanile Ave, Las Vegas, NV 89131", source: "bing", campaign: "Bing-Competitors", term: "liz buys homes", lp: "/lp/vegas-home-buyer/", dur: 22.9, clicks: 9, pages: 4, link: "https://clarity.microsoft.com/player/rk2y22s3b5/m3lcko/1vp9k57", note: "Competitor term 'liz buys homes' → converted. Then re-submitted via Day 1 email" },
  { ts: "2026-02-16", name: "Ranee Viravakin", phone: "", address: "1520 Stewart Ave, Las Vegas, NV 89101", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 7.9, clicks: 2, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/11ua9mk/h145of", note: "No phone submitted" },
  { ts: "2026-02-15", name: "EDWIN cooper", phone: "(702) 365-6628", address: "6675 Caporetto Ln, North Las Vegas, NV 89084", source: "bing", campaign: "Bing-Cash Offer", term: "sell my house fast near me", lp: "/lp/cash-offer-for-my-house/", dur: 6.1, clicks: 9, pages: 3, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1kgjs8z/1fbfoyf", note: "Revisited LP after submit" },
  { ts: "2026-02-14", name: "Jeffrey Singer", phone: "(928) 727-0347", address: "714 Oakmont Ave, Las Vegas, NV 89109", source: "gmb", campaign: "gmb", term: "", lp: "(homepage)", dur: 8.0, clicks: 4, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/b9bq86/1tnvwnl", note: "GMB → homepage → submit. Quick & confident" },
  { ts: "2026-02-13", name: "Amos Acoff", phone: "(310) 923-6877", address: "3318 North Decatur Boulevard", source: "ActiveCampaign", campaign: "(Day 3 - V2) Still Interested?", term: "", lp: "(homepage)", dur: 5.5, clicks: 4, pages: 3, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1mxlj2f/14b9m3e", note: "Day 3 email drip → converted. Proof nurture works" },
  { ts: "2026-02-12", name: "James Poche", phone: "(702) 622-9693", address: "2236 Shatz St, Las Vegas, NV 89156", source: "bing", campaign: "Bing-Cash Offer", term: "sell my house fast", lp: "/lp/cash-offer-for-my-house/", dur: 10.8, clicks: 5, pages: 3, link: "https://clarity.microsoft.com/player/rk2y22s3b5/3grh72/1jjjivf", note: "" },
  { ts: "2026-02-11", name: "Alan Aoki", phone: "(725) 400-1234", address: "8232 Chimney Bluff St, North Las Vegas, NV 89085", source: "bing", campaign: "Bing-Competitors", term: "liz buys houses", lp: "/lp/vegas-home-buyer/", dur: 13.8, clicks: 15, pages: 7, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1alhpfm/ynzeqv", note: "Competitor term → 7 page deep dive on same LP, then converted" },
  { ts: "2026-02-11", name: "Maria Montes", phone: "(702) 502-4386", address: "3295 N Nellis Blvd, Las Vegas, NV 89115", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/sell-my-house-for-cash-vegas/", dur: 4.0, clicks: 19, pages: 5, link: "https://clarity.microsoft.com/player/rk2y22s3b5/11nk990/c9nxla", note: "Visited /team/ after submitting — validating who you are" },
  { ts: "2026-02-10", name: "Todd Bolander", phone: "(920) 797-9630", address: "40092 W Novak Ln, Maricopa, AZ 85138", source: "bing", campaign: "Bing- WBAVH (Branded)", term: "alex buys houses las vegas", lp: "/lp/we-buy-any-vegas-house/", dur: 12.6, clicks: 5, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/3gxcqs/1hyr4h5", note: "Out-of-state (AZ). Competitor branded term" },
  { ts: "2026-02-10", name: "Tishon Rutherford", phone: "(216) 789-8249", address: "2122 Sleepy Ct, Las Vegas, NV 89106", source: "google", campaign: "WBAVH-Branded", term: "we buy any vegas house", lp: "/lp/we-buy-any-vegas-house/", dur: 5.0, clicks: 7, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/qpdozk/144v2kp", note: "Brand search → LP → instant submit. High confidence" },
  { ts: "2026-02-09", name: "Martyn Braun", phone: "(702) 460-9571", address: "5220 Black Port Ct, Las Vegas, NV 89130", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 3.9, clicks: 2, pages: 1, link: "https://clarity.microsoft.com/player/rk2y22s3b5/zqvrl0/1r8lyvg", note: "Went directly to thank-you — likely via shared link or bookmarked form" },
  { ts: "2026-02-08", name: "Rachel Olivarez", phone: "(702) 981-9375", address: "4036 Maple Hill Rd, Las Vegas, NV 89115", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/cash-offer-for-my-house/", dur: 7.9, clicks: 15, pages: 4, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1lf5tm2/1sd81cp", note: "Refreshed LP twice before submitting — indecisive, then converted" },
  { ts: "2026-02-07", name: "Arthur Kukua", phone: "(702) 465-3325", address: "2376 Mourning Warbler Ave, North Las Vegas, NV 89084", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/sell-my-house-for-cash-vegas/", dur: 148.7, clicks: 0, pages: 1, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1nv77ta/v4vxne", note: "Tab open 2.5hrs, 0 clicks = autofill submit. PMax campaign" },
  { ts: "2026-02-04", name: "Daniel Quan", phone: "(775) 443-9099", address: "4525 W Twain Ave, Las Vegas, NV 89103", source: "direct", campaign: "", term: "", lp: "(homepage)", dur: 10.8, clicks: 9, pages: 2, link: "https://clarity.microsoft.com/player/rk2y22s3b5/1ax2lrd/1c2oarm", note: "" },
  { ts: "2026-02-03", name: "Miro Oba", phone: "(818) 312-6442", address: "12166 Scarlet Ember Rd unit 3, Las Vegas, NV 89183", source: "google", campaign: "Performance-Max-QL", term: "", lp: "/lp/cash-offer-for-my-house/", dur: 39.0, clicks: 9, pages: 5, link: "https://clarity.microsoft.com/player/rk2y22s3b5/176vkej/t2gnzm", note: "Refreshed LP 3x before submitting — high deliberation" },
  { ts: "2026-02-03", name: "JUAN CARLOS RODRIGUEZ", phone: "(562) 382-9162", address: "1401 Desert Ridge Ave, North Las Vegas, NV 89031", source: "google", campaign: "Competitors", term: "sell my ugly house", lp: "/lp/vegas-home-buyer/", dur: 10.6, clicks: 10, pages: 5, link: "https://clarity.microsoft.com/player/rk2y22s3b5/x8iffl/tbimgh", note: "Competitor term 'sell my ugly house' → converted" },
];

const INSIGHTS = [
  { icon: "🔁", title: "Post-Submit Bounce to LP = Good Intent Signal", body: "Multiple converters returned to the LP after hitting /thank-you/. They submitted, then re-verified what they signed up for. This is confirmation-seeking behavior. Your thank-you page needs to reinforce trust immediately — add next steps, a headshot, and a phone number so they don't second-guess." },
  { icon: "⚡", title: "The 2-Page Converter is Your Best Lead Type", body: "34 of 66 real leads (51%) converted in exactly 2 pages — landing page → thank-you. These are motivated, decisive sellers. They didn't need blog posts or team pages. Optimize for speed: headline clarity, single CTA, no navigation distractions. Don't let these leads get stuck in choice paralysis." },
  { icon: "📧", title: "ActiveCampaign Day 1 & Day 3 Emails Are Converting", body: "6 leads re-converted through email drip (Day 1 'Quick Question' and Day 3 'Still Interested?'). Stephen Syson initially came from a Bing competitor ad, converted, then submitted AGAIN via Day 1 email. This proves your nurture sequence is working and justifies investing more in email content." },
  { icon: "🏆", title: "Competitor Campaigns Are Punching Above Their Weight", body: "'Liz buys homes' drove Alan Aoki (7-page deep dive, converted) and Stephen Syson. 'Sell my ugly house' drove Juan Rodriguez and Kimberly Stutesman. 'Alex buys houses las vegas' drove Todd Bolander. Competitor campaigns are high-intent by nature — expand these keywords." },
  { icon: "⚠️", title: "32 Test Submissions Are Polluting Your CRM", body: "32 sessions from Jason Test (whitespacesolutions.ai) and your own Casey@WeBuyAnyVegasHouse.com are showing as conversions in Clarity. If these are also going into Podio, they're inflating your conversion rate and distorting call scoring. Add a filter to your webhook: skip submissions where email contains 'test' or matches your team's domains." },
  { icon: "🔒", title: "URGENT: Full Lead PII Exposed in Clarity Recordings", body: "Your thank-you page passes fname, lname, email, phone, and address as URL query parameters (?fname=...&email=...&phone=...&address=...). Clarity records every URL. This means 66 real sellers' complete personal info is stored in your Clarity session recordings indefinitely. Fix: use POST submission only, and redirect to /thank-you/ without params. Or pass a session token and store data server-side." },
  { icon: "🗺️", title: "Homepage Is Your #1 LP — But It Has No Attribution", body: "25 of 66 converters (38%) came through the homepage, not a dedicated /lp/ page. These are mostly Direct and GMB sessions. You're likely losing UTM tracking on these. Make sure your Podio webhook captures the last non-direct touchpoint or use a 30-day cookie to preserve attribution." },
  { icon: "📱", title: "Autofill Submitters Are a Hidden Conversion Segment", body: "Albert Canales (0 clicks, 0 seconds on form — submitted via browser autofill), Arthur Kukua (same), and others show 0 or near-0 clicks but still converted. This segment completes the form instantly using saved data. Ensure your form fields use standard HTML name attributes (fname, lname, email, phone, address) so browser autofill works — this segment won't re-type anything." },
];

const src_colors = { google: "#4285f4", bing: "#00897b", direct: "#9e9e9e", ActiveCampaign: "#f4b400", gmb: "#34a853" };

export default function ConverterDashboard() {
  const [activeTab, setActiveTab] = useState("model");
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = LEADS.filter(l =>
    !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLPS = Object.values(STATS.lps).reduce((a, b) => a + b, 0);
  const totalSRC = Object.values(STATS.sources).reduce((a, b) => a + b, 0);
  const totalPages = Object.values(STATS.pages_dist).reduce((a, b) => a + b, 0);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#09090f", minHeight: "100vh", color: "#ddd8d0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #09090f 0%, #0f1420 100%)", borderBottom: "1px solid #1a2535", padding: "28px 36px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#3d7fc4", fontFamily: "monospace", marginBottom: 6, textTransform: "uppercase" }}>
                webuyanyvegashouse.com · Clarity Converter Intelligence · Jan–Mar 2026
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
                Converter Behavior Lab
              </h1>
              <p style={{ margin: "6px 0 0", color: "#6a7d95", fontSize: 13 }}>
                66 real leads analyzed · Behavior patterns extracted · 8 actionable insights
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>⚠️ Security</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginTop: 2 }}>PII in URLs</div>
              </div>
              <div style={{ background: "#f59e0b15", border: "1px solid #f59e0b40", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Noise</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginTop: 2 }}>32 Test Leads</div>
              </div>
              <div style={{ background: "#10b98115", border: "1px solid #10b98140", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em" }}>Real Leads</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginTop: 2 }}>66 Analyzed</div>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "Avg Clicks to Convert", value: "8.7", sub: "Some as high as 40" },
              { label: "2-Page Converters", value: "51%", sub: "LP → thank-you direct" },
              { label: "Email-Attributed", value: "9%", sub: "AC Day 1 & Day 3 proven" },
              { label: "Homepage Converts", value: "38%", sub: "No LP tracking on these" },
              { label: "Autofill Submitters", value: "~12%", sub: "0 clicks, instant submit" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 7, padding: "10px 13px" }}>
                <div style={{ fontSize: 10, color: "#6a7d95", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{k.label}</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#c4daf7" }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#4a5a6e", marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 36px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1a2535", paddingBottom: 0 }}>
          {[
            { id: "model", label: "📊 Behavior Model" },
            { id: "leads", label: "👤 Lead Registry" },
            { id: "insights", label: "💡 Site Insights" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: activeTab === t.id ? "#c4daf7" : "#6a7d95",
              fontSize: 13, fontFamily: "Georgia, serif", padding: "10px 18px",
              borderBottom: activeTab === t.id ? "2px solid #3d7fc4" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* BEHAVIOR MODEL TAB */}
        {activeTab === "model" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {/* Traffic Sources */}
            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#3d7fc4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "monospace" }}>Traffic Sources</div>
              {Object.entries(STATS.sources).map(([src, cnt]) => (
                <div key={src} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#ddd8d0" }}>{src}</span>
                    <span style={{ color: src_colors[src] || "#888", fontFamily: "monospace" }}>{cnt} ({Math.round(cnt / totalSRC * 100)}%)</span>
                  </div>
                  <div style={{ height: 5, background: "#1a2535", borderRadius: 3 }}>
                    <div style={{ height: 5, background: src_colors[src] || "#888", borderRadius: 3, width: `${cnt / totalSRC * 100}%`, transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* LP Entry Pages */}
            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#3d7fc4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "monospace" }}>Entry Landing Pages</div>
              {Object.entries(STATS.lps).map(([lp, cnt]) => {
                const label = lp === "(homepage/direct)" ? "Homepage / Direct" : lp.replace("/lp/", "").replace(/\//g, "").replace(/-/g, " ");
                return (
                  <div key={lp} style={{ marginBottom: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: "#a0b4cc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{label}</span>
                      <span style={{ color: "#c4daf7", fontFamily: "monospace" }}>{cnt}</span>
                    </div>
                    <div style={{ height: 4, background: "#1a2535", borderRadius: 2 }}>
                      <div style={{ height: 4, background: cnt === Math.max(...Object.values(STATS.lps)) ? "#ef4444" : "#3d7fc4", borderRadius: 2, width: `${cnt / Math.max(...Object.values(STATS.lps)) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: "8px 10px", background: "#ef444410", border: "1px solid #ef444430", borderRadius: 6, fontSize: 11, color: "#ef4444" }}>
                ⚠️ 38% convert from homepage with no LP tracking
              </div>
            </div>

            {/* Pages per Session */}
            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#3d7fc4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "monospace" }}>Pages per Session</div>
              {Object.entries(STATS.pages_dist).map(([pg, cnt]) => (
                <div key={pg} style={{ marginBottom: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "#a0b4cc" }}>{pg} {pg === "1" ? "page" : "pages"}</span>
                    <span style={{ color: "#c4daf7", fontFamily: "monospace" }}>{cnt} leads ({Math.round(cnt / totalPages * 100)}%)</span>
                  </div>
                  <div style={{ height: 5, background: "#1a2535", borderRadius: 3 }}>
                    <div style={{ height: 5, background: pg === "2" ? "#10b981" : "#3d7fc4", borderRadius: 3, width: `${cnt / totalPages * 100}%` }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "8px 10px", background: "#10b98110", border: "1px solid #10b98130", borderRadius: 6, fontSize: 11, color: "#10b981" }}>
                ✓ 51% of converters only need 2 pages
              </div>
            </div>

            {/* Conversion Speed */}
            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#3d7fc4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, fontFamily: "monospace" }}>Conversion Speed Tiers</div>
              {[
                { label: "Fast Converts", sub: "Under 3 minutes", count: STATS.fast_converts, color: "#10b981", note: "Decisive — optimize first impression" },
                { label: "Mid-Speed", sub: "3–10 minutes", count: STATS.mid_converts, color: "#3d7fc4", note: "Deliberate — trust signals matter" },
                { label: "Slow Burns", sub: "10+ minutes", count: STATS.slow_converts, color: "#f59e0b", note: "Researchers — need rich content" },
              ].map(tier => (
                <div key={tier.label} style={{ marginBottom: 16, padding: "12px 14px", background: "#1a2535", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>{tier.label}</div>
                      <div style={{ fontSize: 11, color: "#6a7d95", marginTop: 2 }}>{tier.sub}</div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: tier.color, fontFamily: "monospace" }}>{tier.count}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8a9ab5", marginTop: 8, fontStyle: "italic" }}>{tier.note}</div>
                </div>
              ))}
            </div>

            {/* Converter Journey Pattern */}
            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#3d7fc4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "monospace" }}>Top Journey Patterns</div>
              {[
                { pattern: "LP → Thank You", count: 32, pct: 48, color: "#10b981", desc: "Direct LP conversion" },
                { pattern: "Home → Thank You", count: 17, pct: 26, color: "#3d7fc4", desc: "Homepage form" },
                { pattern: "LP → TY → LP revisit", count: 8, pct: 12, color: "#8b5cf6", desc: "Post-submit confirmation" },
                { pattern: "Home → Cash Today → TY", count: 4, pct: 6, color: "#f59e0b", desc: "Multi-step form path" },
                { pattern: "Email → Home → TY", count: 6, pct: 9, color: "#ef4444", desc: "Nurture sequence" },
              ].map(j => (
                <div key={j.pattern} style={{ marginBottom: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: "#a0b4cc" }}>{j.pattern}</span>
                    <span style={{ color: j.color, fontFamily: "monospace" }}>{j.count} ({j.pct}%)</span>
                  </div>
                  <div style={{ height: 4, background: "#1a2535", borderRadius: 2 }}>
                    <div style={{ height: 4, background: j.color, borderRadius: 2, width: `${j.pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#4a5a6e", marginTop: 2 }}>{j.desc}</div>
                </div>
              ))}
            </div>

            {/* Post-Convert Behavior */}
            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#3d7fc4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "monospace" }}>What Converters Do After Submitting</div>
              {[
                { action: "Leave immediately", pct: 45, color: "#6a7d95", fix: "Add a compelling thank-you page CTA" },
                { action: "Return to LP to re-read", pct: 22, color: "#f59e0b", fix: "Show key promise recap on /thank-you/" },
                { action: "Visit homepage next", pct: 15, color: "#3d7fc4", fix: "Shows they're validating your brand" },
                { action: "Go to /team/ or /sellers/", pct: 8, color: "#10b981", fix: "Add headshots + trust to thank-you" },
                { action: "Revisit /get-your-cash-today/", pct: 10, color: "#8b5cf6", fix: "They may not realize they already submitted" },
              ].map(a => (
                <div key={a.action} style={{ marginBottom: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: "#a0b4cc" }}>{a.action}</span>
                    <span style={{ color: a.color, fontFamily: "monospace" }}>{a.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "#1a2535", borderRadius: 2, marginBottom: 3 }}>
                    <div style={{ height: 4, background: a.color, borderRadius: 2, width: `${a.pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#4a5a6e", fontStyle: "italic" }}>→ {a.fix}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEAD REGISTRY TAB */}
        {activeTab === "leads" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6a7d95" }}>{LEADS.length} real leads with full behavioral data from Clarity · Jan–Mar 2026</div>
              <input
                placeholder="Search name, address, source..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 6, padding: "6px 12px", color: "#ddd8d0", fontSize: 12, width: 240, fontFamily: "Georgia, serif", outline: "none" }}
              />
            </div>

            <div style={{ background: "#0f1420", border: "1px solid #1a2535", borderRadius: 10, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "100px 160px 200px 90px 100px 70px 60px 60px 80px", gap: 0, padding: "10px 16px", background: "#1a2535", fontSize: 10, color: "#6a7d95", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <div>Date</div><div>Name</div><div>Address</div><div>Source</div><div>Campaign</div><div>LP</div><div>Min</div><div>Clicks</div><div>Recording</div>
              </div>

              {filteredLeads.map((lead, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedLead(selectedLead === i ? null : i)}
                  style={{
                    display: "grid", gridTemplateColumns: "100px 160px 200px 90px 100px 70px 60px 60px 80px",
                    gap: 0, padding: "10px 16px", cursor: "pointer",
                    borderTop: "1px solid #1a2535",
                    background: selectedLead === i ? "#1a2535" : i % 2 === 0 ? "#0f1420" : "#0b0f18",
                    transition: "background 0.1s",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#6a7d95", fontFamily: "monospace" }}>{lead.ts.slice(5)}</div>
                  <div style={{ fontSize: 12, color: "#ddd8d0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: "#8a9ab5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.address}</div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ background: (src_colors[lead.source] || "#888") + "22", color: src_colors[lead.source] || "#888", padding: "2px 6px", borderRadius: 3 }}>{lead.source}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#6a7d95", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.campaign || "—"}</div>
                  <div style={{ fontSize: 10, color: "#6a7d95", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.lp === "(homepage)" ? "home" : lead.lp.replace("/lp/","").replace(/\//g,"").slice(0,12)}</div>
                  <div style={{ fontSize: 12, color: lead.dur > 60 ? "#f59e0b" : "#c4daf7", fontFamily: "monospace" }}>{lead.dur > 60 ? `${Math.round(lead.dur/60)}h` : `${lead.dur}m`}</div>
                  <div style={{ fontSize: 12, color: lead.clicks > 15 ? "#10b981" : "#c4daf7", fontFamily: "monospace" }}>{lead.clicks}</div>
                  <div>
                    <a href={lead.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: "#3d7fc4", textDecoration: "none", background: "#3d7fc420", padding: "2px 7px", borderRadius: 3 }}>▶ Watch</a>
                  </div>
                </div>
              ))}

              {/* Expanded row */}
              {selectedLead !== null && filteredLeads[selectedLead]?.note && (
                <div style={{ padding: "12px 16px", background: "#1a2535", borderTop: "1px solid #2a3a50" }}>
                  <span style={{ fontSize: 11, color: "#3d7fc4" }}>💡 Behavioral note: </span>
                  <span style={{ fontSize: 11, color: "#a0b4cc" }}>{filteredLeads[selectedLead].note}</span>
                  {filteredLeads[selectedLead].phone && <span style={{ fontSize: 11, color: "#6a7d95", marginLeft: 16 }}>📞 {filteredLeads[selectedLead].phone}</span>}
                  {filteredLeads[selectedLead].term && <span style={{ fontSize: 11, color: "#6a7d95", marginLeft: 16 }}>🔍 "{filteredLeads[selectedLead].term}"</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {INSIGHTS.map((ins, i) => (
              <div key={i} style={{ background: "#0f1420", border: ins.icon === "🔒" ? "1px solid #ef444440" : ins.icon === "⚠️" ? "1px solid #f59e0b40" : "1px solid #1a2535", borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{ins.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: ins.icon === "🔒" ? "#ef4444" : ins.icon === "⚠️" ? "#f59e0b" : "#c4daf7", marginBottom: 8, lineHeight: 1.3 }}>{ins.title}</div>
                    <div style={{ fontSize: 13, color: "#8a9ab5", lineHeight: 1.7 }}>{ins.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
