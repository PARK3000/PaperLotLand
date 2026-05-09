# Build Page

Generate a Next.js page component from scraped content and design tokens.

## Arguments
- `$ARGUMENTS` - The page name to build (e.g., "homepage", "about", "services")

## Prerequisites
- Run `/scrape-site` first to get content
- Run `/extract-design` to get design tokens

## Instructions

1. **Load Resources**:
   - Read `scraped/content/[page-name].md` for content
   - Read `scraped/design-tokens.json` for styling
   - Read `scraped/metadata.json` for SEO data
   - Read `content/data/keywords.json` for target keywords

2. **Analyze Page Structure**:
   - Identify sections (hero, features, testimonials, CTA, etc.)
   - Map content to appropriate components
   - Plan component hierarchy

3. **Generate Components**:
   Create or use existing components in `src/components/sections/`

4. **Build the Page**:
   Create `src/app/[route]/page.tsx` with:
   - Proper metadata export (title, description, openGraph)
   - Semantic HTML structure
   - Responsive design
   - Optimized images using next/image

5. **Apply Design Tokens**:
   - Use colors from design tokens
   - Apply typography styles
   - Elevate with better whitespace and visual rhythm

6. **SEO Optimization**:
   - Include target keywords naturally
   - Add structured data (JSON-LD) if applicable
   - Ensure proper meta tags

## Design Elevation Guidelines

- **More whitespace**: Generous padding and margins
- **Clear hierarchy**: Obvious visual importance levels
- **Modern touches**: Subtle shadows, smooth transitions
- **Clean typography**: Proper line heights, letter spacing

## Output

Provide:
1. Page file created and location
2. Components generated or modified
3. SEO metadata applied
4. Suggestions for further enhancement
