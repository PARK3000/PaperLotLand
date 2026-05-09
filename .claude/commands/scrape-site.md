# Scrape Website

Scrape a target website to extract content, images, and metadata for cloning.

## Arguments
- `$ARGUMENTS` - The URL of the website to scrape (e.g., https://example.com)

## Instructions

1. **Validate the URL**: Ensure the provided URL is valid and accessible

2. **Scrape the website** using FireCrawl MCP:
   - Use `firecrawl_scrape` to get the main page content
   - Use `firecrawl_crawl` to crawl all pages on the site
   - Extract content in markdown format
   - Capture all images and assets

3. **Extract and organize**:
   - Save page content to `scraped/content/[page-name].md`
   - Download images to `scraped/images/`
   - Create `scraped/metadata.json` with:
     ```json
     {
       "url": "original URL",
       "scrapedAt": "timestamp",
       "pages": ["list of pages"],
       "title": "site title",
       "description": "site description",
       "businessInfo": {
         "name": "",
         "phone": "",
         "email": "",
         "address": ""
       },
       "navigation": [],
       "socialLinks": []
     }
     ```

4. **Extract design tokens**:
   - Identify primary colors from the site
   - Note font families used
   - Document layout patterns
   - Save to `scraped/design-tokens.json`

5. **Generate summary**: Create `scraped/SUMMARY.md` with:
   - Overview of what was scraped
   - Page count and structure
   - Key content identified
   - Images extracted
   - Recommended next steps

## Output

After scraping, provide:
1. Summary of pages scraped
2. Key business information found
3. Design elements identified
4. Recommended next command (`/analyze-seo` or `/extract-design`)
