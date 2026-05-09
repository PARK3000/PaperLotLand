# Analyze SEO

Perform comprehensive SEO analysis on a domain using DataForSEO.

## Arguments
- `$ARGUMENTS` - The domain to analyze (e.g., example.com)

## Instructions

1. **Domain Analysis** using DataForSEO MCP:
   - Get domain overview and metrics
   - Analyze current organic rankings
   - Review backlink profile summary

2. **Keyword Research**:
   - Extract keywords the domain currently ranks for
   - Identify high-volume keywords in the niche
   - Find keyword gaps and opportunities
   - Analyze keyword difficulty vs search volume

3. **Competitor Analysis**:
   - Identify top competitors for the domain
   - Compare keyword overlap
   - Find competitor keywords we're missing
   - Analyze competitor content strategies

4. **SERP Analysis**:
   - Check current SERP positions for main keywords
   - Identify featured snippet opportunities
   - Review "People Also Ask" questions

5. **Save Results**:
   - `seo/keyword-research.json` - Raw keyword data
   - `seo/competitor-analysis.json` - Competitor insights
   - `seo/opportunities.json` - Prioritized opportunities

6. **Generate Report**: Create `seo/SEO-ANALYSIS.md` with:
   - Executive summary
   - Current rankings overview
   - Top keyword opportunities (sorted by potential)
   - Competitor insights
   - Content recommendations
   - Technical SEO notes

## Output

Provide:
1. Top 10 keyword opportunities with volume and difficulty
2. Main competitors identified
3. Quick wins (low difficulty, decent volume)
4. Content gaps to fill
5. Recommendation for `/generate-keyword-plan`
