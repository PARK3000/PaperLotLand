# Onboarding Command

Guide the user through setting up a new website clone project.

## Arguments
- `$ARGUMENTS` - Optional: Target website URL to clone

## Process

### 1. Welcome & Verify Setup
Display a welcome message and verify MCP servers are configured:

```
Welcome to the Website Clone Template!

Let me verify your setup...
```

Check for required MCP tools:
- FireCrawl tools (firecrawl_scrape, firecrawl_map)
- DataForSEO tools (if available)

If tools are missing, provide setup instructions from CLAUDE.md.

### 2. Gather Project Information
If no URL provided in arguments, ask the user:
- What website do you want to clone?
- What is the business name?
- What is the primary service/product?

### 3. Update Onboarding Checklist
Read `config/onboarding-checklist.json` and update the metadata:
- Set `projectStarted` to current date
- Set `targetUrl` and `targetDomain` from user input

### 4. Initialize Configuration
Update the config files with basic information:
- `config/site.config.json` - Site name and URL
- `config/business.config.json` - Business name

### 5. Environment Setup Check
Verify `.env.local` exists. If not, prompt user to:
```bash
cp .env.example .env.local
```
And add their API keys.

### 6. Provide Next Steps
Display the recommended workflow:

```
Setup complete! Here's your workflow:

1. Scrape the target site:
   /scrape-site {targetUrl}

2. Extract the design system:
   /extract-design {targetUrl}

3. Analyze SEO opportunities:
   /analyze-seo {domain}

4. Generate keyword strategy:
   /generate-keyword-plan

5. Build pages from scraped content:
   /build-page homepage
   /build-page about
   /build-page services
   /build-page contact

6. Deploy to Vercel:
   vercel
```

### 7. Offer to Start
Ask if the user wants to begin with step 1 (scraping).

## Output
- Updated config files with project information
- Checklist status in `config/onboarding-checklist.json`
- Clear next steps for the user
