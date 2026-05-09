---
module: Hero Section
date: 2026-03-03
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Dark navy outline on hero autocomplete input that could not be removed"
  - "outline-none and focus:outline-none Tailwind classes had no effect"
  - "Issue persisted across 5+ commit attempts to override styles"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [tailwind-v4, css-cascade-layers, focus-outline, outline-none, layer-utilities]
---

# Troubleshooting: Tailwind v4 Utility Classes Cannot Override Unlayered Global CSS

## Problem

A dark navy `outline` appeared on the hero section's address autocomplete input on focus, and no combination of Tailwind utility classes (`outline-none`, `focus:outline-none`, `ring-0`, `border-0`, `shadow-none`, `[box-shadow:none]`) could remove it. The issue consumed 4+ hours across 5+ commits of increasingly aggressive override attempts.

## Environment

- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS v4 (using `@import 'tailwindcss'` and `@theme`)
- Affected Component: `src/components/sections/hero.tsx` + `src/components/ui/address-autocomplete-input.tsx` + `src/styles/globals.css`
- Date: 2026-03-03

## Symptoms

- Dark navy (`#06263A`) 2px solid outline appeared around the hero input when focused
- `outline-none` class was present in the DOM (confirmed via `element.className`)
- Computed style showed `outline: rgb(6, 38, 58) solid 2px` despite `outline-none` being applied
- Every Tailwind override class was ignored: `outline-none`, `focus:outline-none`, `ring-0`, `border-0`, `shadow-none`, `[box-shadow:none]`
- The issue only appeared on focus (`:focus-visible` state)

## What Didn't Work

**Attempted Solution 1:** Adding increasingly aggressive Tailwind override classes to the hero input's `className` prop
- **Why it failed:** `tailwind-merge` was not the issue — the classes were correctly merged and present in the DOM. The CSS cascade itself was the problem.

**Attempted Solution 2:** Using arbitrary value syntax like `[box-shadow:none]` and `[outline:none]`
- **Why it failed:** Same cascade issue — arbitrary values also generate rules inside `@layer utilities`, which cannot beat unlayered CSS.

**Attempted Solution 3:** Using `:where()` wrapper on the global `:focus-visible` rule for zero specificity
- **Why it failed:** `:where()` reduces specificity to zero, but CSS cascade **layers** take precedence over specificity. Unlayered CSS always beats `@layer utilities` regardless of specificity.

**Attempted Solution 4:** Trying to override via `cn()` / `tailwind-merge` by passing `className` last
- **Why it failed:** `tailwind-merge` correctly resolved class conflicts, but the resulting Tailwind utilities were still inside `@layer utilities` and lost to the unlayered global rule.

## Solution

**Two changes were needed:**

### 1. Fix the CSS cascade layer ordering (`globals.css`)

```css
/* Before (broken) — unlayered CSS always beats @layer utilities: */
:where(:focus-visible) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* After (fixed) — @layer base loses to @layer utilities in the cascade: */
@layer base {
  :where(:focus-visible) {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```

### 2. Add `variant` prop to avoid class override fights (`address-autocomplete-input.tsx`)

```tsx
// Before (broken) — hero tries to override base styles via className:
<AddressAutocompleteInput
  className="rounded-none border-0 border-transparent bg-transparent shadow-none outline-none ring-0 focus:border-transparent focus:shadow-none focus:outline-none focus:ring-0"
/>

// After (fixed) — bare variant skips decorative styles entirely:
<AddressAutocompleteInput
  variant="bare"
  className="rounded-none"
/>
```

The component conditionally applies chrome styles only in `variant="default"`:

```tsx
className={cn(
  'w-full py-3 transition-colors',
  'placeholder:text-[var(--color-text-muted)]',
  variant === 'default' && [
    'rounded-lg border bg-white text-[var(--color-text-secondary)] shadow-sm',
    'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 ...',
    error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]',
  ],
  variant === 'bare' && 'border-0 bg-transparent shadow-none outline-none ring-0 ...',
  className
)}
```

## Why This Works

### Root Cause: CSS Cascade Layer Ordering

In Tailwind CSS v4, **all utility classes are generated inside `@layer utilities`**. The CSS cascade specification defines a strict layer ordering:

```
@layer base  <  @layer utilities  <  unlayered CSS
```

**Unlayered CSS always wins over layered CSS**, regardless of specificity. The `:where()` wrapper only reduces specificity to zero — but specificity is irrelevant when layers are involved. Layer ordering takes absolute precedence.

The global `:focus-visible` rule was **unlayered**, so it beat every Tailwind utility class (`outline-none`, `ring-0`, etc.) because those utilities lived inside `@layer utilities`.

### The Fix

Moving the `:focus-visible` rule into `@layer base` puts it below `@layer utilities` in the cascade. Now Tailwind's `outline-none` (in `@layer utilities`) properly overrides the base focus style (in `@layer base`).

The `variant="bare"` prop is a secondary defense — it prevents the need for `tailwind-merge` to resolve conflicting classes between the component's base styles and the hero's overrides, especially for arbitrary CSS variable values like `border-[var(--color-border)]` that `tailwind-merge` may not handle reliably.

## Prevention

- **Never write global CSS rules outside of `@layer` blocks in Tailwind v4 projects.** Any unlayered CSS will silently override all Tailwind utilities, and no amount of `!important`-free class overrides will fix it.
- **When a Tailwind utility class has no effect**, check computed styles in DevTools. If the class is present but not winning, inspect the cascade — look for unlayered CSS rules in the stylesheet.
- **Use the CSS cascade layer mental model:** `@layer base` < `@layer components` < `@layer utilities` < unlayered. If your global styles need to be overridable by utilities, they must be in `@layer base`.
- **For reusable components with opinionated styles**, provide a `variant` prop (e.g., `"bare"`) rather than relying on consumers to override via `className` — `tailwind-merge` can't reliably resolve all conflicts, especially with CSS variable arbitrary values.

## Related Issues

No related issues documented yet.
