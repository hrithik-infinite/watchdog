# Plan: Migrate Watchdog App to shadcn/ui

## Overview
Migrate all 11 sidepanel components from custom Tailwind styling to use shadcn/ui components for consistency and maintainability.

## Current State
- **Already installed**: Button, Card, Badge, Select, Switch
- **CSS variables**: Already configured for shadcn in `globals.css`

## Icon Strategy (User Decision)
- **Use lucide-react** for all utility icons (Settings, Search, ChevronLeft, Copy, etc.)
- **Keep custom icons** only for: WatchDogLogo, EyeIcon, CheckCircleIcon, ErrorCircleIcon

## Migration Plan

### Phase 1: Install Missing shadcn Components
```bash
npx shadcn@latest add input label scroll-area separator tooltip
```

### Phase 2: Migrate Components (in dependency order)

#### 2.1 CodeBlock.tsx
- Replace copy button with shadcn `Button` variant="ghost" size="sm"
- Replace CheckIcon/CopyIcon with lucide-react `Check`/`Copy`

#### 2.2 Header.tsx
- Replace settings button with shadcn `Button` variant="ghost" size="icon"
- Replace SettingsIcon with lucide-react `Settings`
- Keep custom `WatchDogLogo`

#### 2.3 FilterBar.tsx
- Replace search input with shadcn `Input`
- Replace native selects with shadcn `Select`
- Replace SearchIcon with lucide-react `Search`
- Replace ChevronDownIcon with lucide-react `ChevronDown`

#### 2.4 ScanButton.tsx
- Replace custom button with shadcn `Button` size="lg"
- Replace SpinnerIcon with lucide-react `Loader2`
- Replace RefreshIcon with lucide-react `RefreshCw`

#### 2.5 Settings.tsx
- Replace back button with shadcn `Button` variant="ghost"
- Replace WCAG level buttons with shadcn `Button` group
- Replace custom toggle switches with shadcn `Switch`
- Replace ChevronLeftIcon with lucide-react `ChevronLeft`
- Wrap sections in shadcn `Card`

#### 2.6 EmptyState.tsx
- Replace action buttons with shadcn `Button`
- Keep custom large icons (EyeIcon, CheckCircleIcon, ErrorCircleIcon)
- Replace RefreshIcon with lucide-react `RefreshCw`

#### 2.7 ErrorBoundary.tsx
- Replace button with shadcn `Button` variant="default"
- Replace WarningIcon with lucide-react `AlertTriangle`

#### 2.8 IssueCard.tsx
- Wrap in shadcn `Card`
- Replace severity badge with shadcn `Badge`

#### 2.9 IssueDetail.tsx
- Replace navigation buttons with shadcn `Button`
- Replace severity badge with shadcn `Badge`
- Wrap WCAG info in shadcn `Card`
- Replace icons with lucide-react equivalents

#### 2.10 IssueList.tsx
- Replace empty state icon with lucide-react `Search`
- Keep IssueCard rendering as-is

#### 2.11 Summary.tsx
- Replace severity filter buttons with shadcn `Button` group

### Phase 3: Update Icons File
Update `icons/index.tsx` to only keep brand/custom icons:
- Keep: WatchDogLogo, EyeIcon, CheckCircleIcon, ErrorCircleIcon
- Remove: All utility icons (now using lucide-react)

### Phase 4: Cleanup
- Remove unused icon exports
- Update any remaining hardcoded colors to use CSS variables
- Run `npm run all` to verify build

## Files to Modify
1. `src/sidepanel/components/CodeBlock.tsx`
2. `src/sidepanel/components/Header.tsx`
3. `src/sidepanel/components/FilterBar.tsx`
4. `src/sidepanel/components/ScanButton.tsx`
5. `src/sidepanel/components/Settings.tsx`
6. `src/sidepanel/components/EmptyState.tsx`
7. `src/sidepanel/components/ErrorBoundary.tsx`
8. `src/sidepanel/components/IssueCard.tsx`
9. `src/sidepanel/components/IssueDetail.tsx`
10. `src/sidepanel/components/IssueList.tsx`
11. `src/sidepanel/components/Summary.tsx`
12. `src/sidepanel/components/icons/index.tsx`

## Verification
1. Run `npm run all` (format, lint, build)
2. Load extension in Chrome and test:
   - Header displays correctly with settings button
   - Scan button works in initial state
   - Filter dropdowns work
   - Settings toggles work
   - Issue cards display with correct severity badges
   - Issue detail navigation works
   - Empty states display correctly
   - Error boundary catches errors gracefully
