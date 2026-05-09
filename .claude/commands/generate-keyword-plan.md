# Generate Keyword Plan

Create a comprehensive keyword strategy based on SEO research.

## Arguments
- `$ARGUMENTS` - Optional focus area or specific keywords to prioritize

## Prerequisites
- Run `/analyze-seo` first to generate research data
- Ensure `seo/keyword-research.json` exists

## Instructions

1. **Load Research Data**:
   - Read `seo/keyword-research.json`
   - Read `seo/competitor-analysis.json`
   - Read `seo/opportunities.json`
   - Read `scraped/metadata.json` for business context

2. **Categorize Keywords**:
   - **Primary Keywords**: High volume, core to business (3-5)
   - **Secondary Keywords**: Supporting topics (10-15)
   - **Long-tail Keywords**: Specific queries, lower competition (20+)
   - **Local Keywords**: If applicable (location-based)

3. **Map Keywords to Pages**:
   - Homepage: Primary brand + main service keywords
   - Service pages: Specific service keywords
   - Blog/content: Long-tail and question keywords
   - Location pages: Local keywords (if applicable)

4. **Create Content Calendar**:
   - Prioritize by: search volume x (1 - difficulty)
   - Group related keywords for pillar content
   - Identify quick-win opportunities

5. **Generate Plan Document**: Create `seo/keyword-plan.md`

6. **Update Keywords Config**:
   - Save prioritized keywords to `content/data/keywords.json`

## Output

Provide:
1. Summary of keyword strategy
2. Top 5 priority keywords to target
3. Recommended first content pieces
4. Next steps for implementation
