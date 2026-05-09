# Extract Design System

Extract design tokens (colors, typography, spacing) from a target website.

## Arguments
- `$ARGUMENTS` - The URL of the website to extract design from

## Instructions

1. **Fetch the Website**:
   - Use WebFetch or FireCrawl to get the page HTML/CSS
   - Capture screenshots if possible for visual reference

2. **Extract Colors**:
   - Identify primary brand color
   - Identify secondary/accent colors
   - Extract neutral palette (backgrounds, text)
   - Note any gradients used

3. **Extract Typography**:
   - Identify heading font family
   - Identify body font family
   - Note font sizes (h1-h6, body, small)
   - Document font weights used

4. **Extract Spacing & Components**:
   - Identify spacing scale
   - Button styles (colors, radius, padding)
   - Card styles, form inputs, navigation patterns

5. **Generate Design Tokens**: Create `scraped/design-tokens.json` with colors, typography, spacing, and borderRadius values

6. **Create Style Guide**: Generate `scraped/STYLE-GUIDE.md`

## Elevation Notes

When using these tokens, aim to **elevate** the design:
- Cleaner spacing (more whitespace)
- Sharper typography hierarchy
- Modern micro-interactions
- Better visual rhythm

## Output

Provide:
1. Primary color palette identified
2. Fonts to use (or closest Google Fonts alternatives)
3. Key design characteristics
4. Tailwind config snippet to apply
