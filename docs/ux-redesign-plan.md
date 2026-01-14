# Plan: UX Redesign to Match Design System

## Overview
Redesign the Watchdog Chrome extension to match the design system defined in `UX/design_system.png`. This involves updating fonts, colors, and component styling for a polished iOS-like aesthetic.

## Design System Summary
- **Primary Blues:** #007AFF, #0056B3, #66B2FF (already configured)
- **Secondary Greys:** #1C1C1E, #8E8E93, #E5E5EA (already configured)
- **Semantic Colors:** Critical #FF3830, Serious #FF9500, Moderate #FFCC00, Minor #00C7BE
- **Typography:** Inter font with weights 300-700
- **UI Style:** Pill-shaped buttons, dark cards with subtle blue glow, pill badges

## Font Strategy (User Decision)
**Google Fonts CDN** - Load Inter from fonts.googleapis.com

---

## Phase 1: Foundation

### 1.1 Add Inter Font via Google Fonts
**File:** `src/sidepanel/index.html`

Add before `</head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 1.2 Update Typography Classes
**File:** `src/styles/globals.css`

Update typography classes to ensure correct font weights:
- `.text-h1`: 24px, font-weight 700 (Bold)
- `.text-h2`: 20px, font-weight 600 (Semibold)
- `.text-h3`: 16px, font-weight 500 (Medium)
- `.text-body`: 14px, font-weight 400 (Regular)
- `.text-caption`: 12px, font-weight 300 (Light)

### 1.3 Add Card Glow CSS
**File:** `src/styles/globals.css`

Add card glow utility class:
```css
.card-glow {
  border-color: rgba(0, 122, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 122, 255, 0.1);
}
```

---

## Phase 2: Base Component Updates

### 2.1 Button - Pill Shape
**File:** `src/components/ui/button.tsx`

- Change base class from `rounded-md` to `rounded-full`
- Remove `rounded-md` from size variants (sm, lg)

### 2.2 Card - Blue Border Glow
**File:** `src/components/ui/card.tsx`

Update Card className to add subtle blue glow:
```
border-primary/20 shadow-[0_0_15px_rgba(0,122,255,0.1)]
```

### 2.3 Badge - Severity Variants
**File:** `src/components/ui/badge.tsx`

Add severity variant options:
- `critical`: bg-critical text-white
- `serious`: bg-serious text-white
- `moderate`: bg-moderate text-[#1c1c1e]
- `minor`: bg-minor text-[#1c1c1e]

### 2.4 Input - Dark Background
**File:** `src/components/ui/input.tsx`

Ensure dark background styling: `bg-[#1c1c1e]`

---

## Phase 3: Component Polish

### 3.1 Header.tsx
- Add bottom border with glow: `border-b border-primary/10`
- Update title to use `text-h2`

### 3.2 IssueCard.tsx
- Use badge severity variants instead of custom className
- Update title to `text-h3`
- Add code block border: `border border-primary/10`

### 3.3 FilterBar.tsx
- Update labels to use `text-caption`

### 3.4 Summary.tsx
- Update count to use `text-h1`
- Update labels to use `text-caption`

### 3.5 IssueDetail.tsx
- Update title to `text-h2`
- Update section headings to `text-h3`

### 3.6 Settings.tsx
- Update title to `text-h1`
- Update labels to `text-h3`
- Update descriptions to `text-caption`

### 3.7 CodeBlock.tsx
- Add border glow: `border border-primary/10`

### 3.8 App.tsx
- Replace hardcoded `bg-[#1C1C1E]` with `bg-bg-dark` CSS variable

---

## Files to Modify (in order)

1. `src/sidepanel/index.html` - Add Google Fonts
2. `src/styles/globals.css` - Typography + card glow CSS
3. `src/components/ui/button.tsx` - Pill shape
4. `src/components/ui/card.tsx` - Blue glow
5. `src/components/ui/badge.tsx` - Severity variants
6. `src/components/ui/input.tsx` - Dark background
7. `src/sidepanel/components/Header.tsx`
8. `src/sidepanel/components/IssueCard.tsx`
9. `src/sidepanel/components/FilterBar.tsx`
10. `src/sidepanel/components/Summary.tsx`
11. `src/sidepanel/components/IssueDetail.tsx`
12. `src/sidepanel/components/Settings.tsx`
13. `src/sidepanel/components/CodeBlock.tsx`
14. `src/sidepanel/App.tsx`

---

## Verification

1. Run `npm run all` (format, lint, build)
2. Load extension in Chrome and verify:
   - Inter font renders with correct weights (300-700)
   - Buttons are pill-shaped (rounded-full)
   - Cards have subtle blue glow effect
   - Badges show correct severity colors
   - Typography hierarchy is clear (H1 > H2 > H3 > Body > Caption)
   - Overall dark, polished iOS-like aesthetic matches design system
