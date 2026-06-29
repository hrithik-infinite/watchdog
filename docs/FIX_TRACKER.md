# WatchDog — Fix Tracker

Living checklist of every finding we are committing to fix, derived from
[`PRODUCT_ANALYSIS.md`](./PRODUCT_ANALYSIS.md). Each row carries the finding ID
(cross-references the analysis), the primary `file:line`, and status. New
*features* (Phase 2/3 additions) are tracked at the bottom; this doc's focus is
the **fixes**.

**Legend:** ✅ done · 🚧 in progress · ⬜ pending  ·  Eff: S `<1d` / M `~days` / L `1–2wk` / XL `>2wk`

**Status summary:** Phase 0 (trust + core-loop), **nearly all of Phase 1** (CWS launch gate), and **Phase 2 — Site-owner repositioning** (roadmap §8; = this tracker's "Phase 4 — New features" below) have landed on `fix/scanner-accuracy` / **PR #3** — **1117 tests green**, tsc + eslint + build clean, CI workflow added. Phase 2 this round (7 commits): persona spine + Settings toggle (`ux-public-17`), first-run onboarding (`ux-public-1`), Top-fixes card (`ux-public-11`), "why this matters" per issue (`ux-public-3`), plain issue cards + element descriptor + Hide (`ux-public-13,15`), shareable-report-led exports (`ux-public-6`), plain audit one-liners + broad default scan (`ux-public-8,9`), score explainer + plain severity + derived category filter (`ux-public-5,7,14`), audit-aware empty state (`ux-public-16`). Still pending: owner-dependent store assets (`cws-1`, `cws-2` package.json copy), the on-demand-injection decision (`secpriv-6`), background tests (`testing-1`), a coverage threshold gate; tracker "Phase 2/3" (history/trends layer, remaining P1–P3 bug cleanup).

---

## Phase 0 — Trust & correctness foundation

### Scanner accuracy — DONE (PR #3)

| ✓ | ID | Fix | file:line | Commit |
|---|----|-----|-----------|--------|
| ✅ | correctness-3 | CLS/TBT no longer double-count buffered observer entries | `performance-scanner.ts:113,300` | `3f1b722` |
| ✅ | correctness-12 | Honor CSP/Referrer-Policy delivered via `<meta http-equiv>` | `security-scanner.ts:70` | `43016a9` |
| ✅ | correctness-10 | Only flag session/auth-named readable cookies (not every cookie) | `security-scanner.ts:185` | `43016a9` |
| ✅ | correctness-13 | Distinguish underscore from lodash (no false lodash CVE) | `best-practices-scanner.ts:131` | `0ea067f` |
| ✅ | correctness-14 | Broken-image check uses `complete && naturalWidth===0` | `best-practices-scanner.ts:604` | `0ea067f` |
| ✅ | unsized-img-fp | Honor CSS `aspect-ratio` for the unsized-image check | `best-practices-scanner.ts:327` | `0ea067f` |
| ✅ | correctness-17 | Unreachable/invalid manifest no longer graded "installable" | `pwa-scanner.ts:501` | `61bc7b5` |
| ✅ | vuln-lib-fn | Library scan states its global-only scope (no silent clean bill) | `best-practices-scanner.ts:211` | `fcf4246` |
| ✅ | checkConsoleErrors | Removed unsound console-error/inline-onerror check | `best-practices-scanner.ts` | `fcf4246` |

### Core-loop resilience — DONE (PR #3)

| ✓ | ID | Fix | file:line | Commit |
|---|----|-----|-----------|--------|
| ✅ | correctness-1 | Failed scan keeps its error (no silent home-screen) | `store/index.ts:84`, `useScanner.ts:125` | `84baaf8` |
| ✅ | err-2 / correctness-2 | Partial multi-scan shows results + banner, not hidden | `App.tsx:239`, `useScanner.ts:230` | `84baaf8` |
| ✅ | testing-7 | Corrected the test that codified the partial-failure bug | `useScanner.test.tsx` | `84baaf8` |
| ✅ | err-4 | Content script injects on demand instead of "refresh" | `useScanner.ts:7` | `c23a085` |
| ✅ | err-1 / perf-rel-5 | Per-audit 30s timeout (E004) + Cancel button | `useScanner.ts`, `ScanProgress.tsx` | `f2b67cf` |

### Phase 0 — remaining (not yet started)

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ✅ | testing-3 | CI workflow (typecheck/lint/test/build, Node 22) on PR + master | `.github/workflows/ci.yml` | med | S |
| ✅ | testing-5 | Broadened coverage `include` to all `src`, `all:true` (honest ~77%) *(threshold gate still pending)* | `vitest.config.ts` | med | S |
| ✅ | correctness-8 / secpriv-2 | Escape page-derived `selector`/`message`/`url` in `exportHTML` *(done with the export cluster)* | `export.ts` | med | S |
| ✅ | cws-6 / correctness-26 | All 3 Settings toggles wired: WCAG-level filter, Auto-highlight-on-hover, Show-Incomplete (+ "Needs manual review" section) | `store/index.ts`, `IssueCard.tsx`, `IncompleteSection.tsx` | high(trust) | S–M |
| ⬜ | testing-1 | Background/service-worker unit tests (routing, badge, install, settings) | `background/*` | med | S |
| ✅ | testing-2 | Export-module tests (escaping + CSV neutralization) *(done with the export cluster)* | `lib/__tests__/export.test.ts` | high | S |

---

## Phase 1 — CWS launch gate

### The tool's own accessibility (an a11y tool must pass its own audit)

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ✅ | cws-15 | `IgnoreIssueModal` → real focus-trapping dialog (role/aria-modal/labelledby, Esc, radio group) | `IgnoreIssueModal.tsx` | med | S |
| ✅ | cws-16 | `AuditSelector` ARIA fixed (checkbox+aria-checked only, role=group, focusable info) | `AuditSelector.tsx` | med | S |
| ✅ | cws-17 | `IssueCard` Space key + "Learn more" link moved out of the button role | `IssueCard.tsx` | med | S |
| ✅ | cws-18 | `ScoreGauge` `role=img` + computed aria-label | `ScoreGauge.tsx` | low | S |
| ✅ | cws-12 | App-level `aria-live` region announcing scan start/completion | `App.tsx` | med | S |
| ✅ | cws-13 | `role=progressbar` + aria-valuemin/max/now on the progress bar | `ScanProgress.tsx` | low | S |
| ✅ | cws-19 | `aria-pressed` on severity/hide-ignored toggles | `Summary.tsx`/`FilterBar.tsx` | med | S |
| ✅ | cws-20 | `aria-label="Search issues"` on the search input | `FilterBar.tsx` | low | S |
| ✅ | cws-14 | Global `prefers-reduced-motion` guard | `styles/globals.css` | med | S |
| ✅ | cws-8 | `_execute_action` command added *(README shortcut wording: minor follow-up)* | `manifest.config.ts` | low | S |

### Listing / docs / correctness of claims

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ✅ | ux-public-2 | Issues labelled by audit standard, not always "WCAG" (`standard` field tagged in scanPage; IssueCard/IssueDetail relabel) | `types.ts`, `scanner.ts`, `IssueCard.tsx`, `IssueDetail.tsx` | med | S |
| ✅ | deadcode-13 / cws-3 | Removed false "With screenshot" option; audit-aware report titles | `export.ts`, `ExportButton.tsx` | low | S |
| ⬜ | cws-1 | Capture store screenshots + promo tiles *(needs owner)* | `store-assets/` | high | S |
| ⬜ | cws-2 | Broaden listing/manifest copy to all six audits — README updated; **`package.json` description pending** *(stop-and-ask)* | `package.json:4` | high | S |
| ✅ | secpriv-1 / cws-21 | Privacy/README: reworded to same-origin reads (no third-party data) | `PRIVACY.md`, `README.md` | med | S |
| ✅ | secpriv-4 / cws-22 | Corrected storage mechanism/retention; dropped theme claim | `PRIVACY.md` | med | S |
| ✅ | secpriv-5 | Documented `<all_urls>` content script + install warning | `PRIVACY.md`, `README.md` | med | S |
| ✅ | secpriv-7 / cws-23 | Documented `scripting`; fixed the permission count | `README.md`, `PRIVACY.md` | low | S |
| ✅ | cws-4 / cws-10 | Canonical repo/support links, footer → 1.0.1, CHANGELOG entry, LICENSE added | README, `Settings.tsx`, `CHANGELOG.md`, `LICENSE` | low | S |
| ✅ | deadcode-10/11/12 | a11y rule count derived from `MVP_RULES.length`; comment corrected to 39 | `constants.ts`, `AuditSelector.tsx` | low | S |
| ✅ | secpriv-3 | CSV formula-injection prefix guard (`= + - @`) | `export.ts` | low | S |
| ✅ | secpriv-8 | Explicit `content_security_policy.extension_pages` | `manifest.config.ts` | low | S |
| ✅ | secpriv-9 | Removed redundant `styles.css` `web_accessible_resources` (verified safe) | `manifest.config.ts` | low | S |
| ✅ | secpriv-10 | SVG vision filters via `createElementNS` + `sRGB` color space | `vision-filters.ts` | low | S |
| ⬜ | secpriv-6 | **Decision:** drop `<all_urls>` for on-demand injection (removes install warning) — **deferred** | `manifest.config.ts` | med | M |

---

## Phase 2 — Incomplete / unwired features to finish

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ⬜ | deadcode-2 / feat-compet-5 | Wire the built-but-unused history/trends layer to UI (summary snapshots) | `shared/storage.ts` | — | L |
| ⬜ | correctness-35 | History: wrap `set()` in try/catch; prune cross-domain; size guard | `shared/storage.ts:12,77` | low | S |
| ⬜ | correctness-32 | History: fix duplicate `selector::ruleId` miscount in `compareScanResults` | `shared/storage.ts:173` | low | S |
| ✅ | deadcode-4 / correctness-27 | axe `incomplete[]` now rendered in a "Needs manual review" section (gated on Show-Incomplete) | `IncompleteSection.tsx`, `App.tsx` | low | S |
| ⬜ | deadcode-1 | Implement i18n/mobile/privacy audits; delete the `links` stub | `scanner.ts:193`, union (×3) | — | S–M |
| ⬜ | deadcode-5 | `useTheme` is built/tested but unused — wire real theming or delete | `hooks/useTheme.ts` | low | S |
| ⬜ | deadcode-6/7/8/9 | Remove/wire dead exports (`highlightMultiple`, `sendMessage`, `EmptyState.initial`, etc.) | various | low | S |

---

## Phase 3 — Remaining bug cleanup (P1–P3 from the analysis)

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ⬜ | correctness-4 | Highlight/rescan target the **scanned** tab, not the active tab | `messaging.ts:121`, `useHighlight.ts` | med | M |
| ⬜ | correctness-24 | Focus-order: visibility/aria-hidden filter, NaN tabindex, MutationObserver | `focus-order.ts:15` | med | S |
| ⬜ | correctness-29 | Per-audit score normalization (fixed `MAX_WEIGHTED_ISSUES`) | `scoring.ts:16` | med | M |
| ⬜ | perf-rel-2 | Throttle focus-order scroll listener (layout thrash) | `focus-order.ts:136` | med | S |
| ⬜ | perf-rel-6 | Virtualize `IssueList` for large result sets | `IssueList.tsx:32` | med | S |
| ⬜ | perf-rel-7 | Memoize store hot path / debounce search | `useIssues.ts:4`, `store/index.ts:123` | med | S |
| ⬜ | perf-rel-4 | Drop the dead 500ms of the perf scanner's ~1s wait | `performance-scanner.ts` | low | S |
| ⬜ | perf-rel-1 | Code-split the 5 non-axe scanners behind `import()` | `manifest.config.ts:36`, `scanner.ts:12` | low | S |
| ⬜ | perf-rel-12 | Remove raw `console.log` shipped on every page load | `content/index.ts:89` | low | S |
| ⬜ | correctness-5 | Badge shows combined total, not last audit's count | `content/index.ts:35`, `background/index.ts:71` | low | S |
| ⬜ | correctness-22/23 | Vision/focus overlays: re-apply on SPA nav, restore original outline | `content/index.ts:83`, `focus-order.ts:126` | low | S |
| ⬜ | correctness-25 | Vision filters: `color-interpolation-filters="sRGB"` (correct color space) | `vision-filters.ts:66` | low | S |
| ⬜ | correctness-11 | noopener heuristic stops flagging already-safe `target=_blank` | `security-scanner.ts:350` | low | S |
| ⬜ | correctness-16 | Notification/geolocation checks ignore external bundles & comments | `best-practices-scanner.ts:289` | low | S |
| ⬜ | correctness-15 | Empty-link counter double-counts `href="#"` + empty | `best-practices-scanner.ts:684` | low | S |
| ⬜ | correctness-18 | PWA icon size by substring (`1192`/`1920` false-pass) | `pwa-scanner.ts:220` | low | S |
| ⬜ | correctness-19 | SEO title/desc thresholds contradict their own copy | `seo-scanner.ts:52,58,103` | low | S |
| ⬜ | correctness-20 | Replace deprecated `performance.timing`/`navigationStart` | `performance-scanner.ts:409` | low | S |
| ⬜ | correctness-21 | Resource sizes miss cross-origin (`transferSize` 0 without TAO) | `performance-scanner.ts:493` | low | S |
| ⬜ | correctness-7 | Atomic read-modify-write on `chrome.storage.local` | `shared/storage.ts:358`, `background/storage.ts:17` | low | S |
| ⬜ | correctness-30 / err-12 | `instanceof Error` guards in background/content catch blocks | `background/index.ts:59`, `content/index.ts:13` | low | S |
| ⬜ | correctness-34 | Don't send HIGHLIGHT for non-a11y scans (scrolls the page) | `App.tsx:107` | low | S |
| ⬜ | correctness-31 | `clearBadge` also resets background color | `background/badge.ts:30` | low | S |
| ⬜ | fixes-fragile | Accessibility fix code: stop naive string-replace producing invalid markup | `fixes.ts:6,329` | low | S |
| ⬜ | err-9 | Global `unhandledrejection`/`onerror` handling | `ErrorBoundary.tsx:25` | low | S |
| ⬜ | err-10 | Surface export failures (esp. PDF non-WinAnsi chars) to the user | `ExportButton.tsx:26`, `export.ts:28` | med | S |
| ⬜ | err-3 | Distinct message for unscannable page types (Web Store / PDF / `file://`) | `useScanner.ts:107` | med | S |
| ⬜ | err-5/6/7/8/11/13 | Misc silent-failure paths (highlight, vision toggles, settings/ignore writes, error-code matching, fire-and-forget SCAN_RESULT) | various | low | S |

### Testing & CI (beyond Phase 0)

| ✓ | ID | Fix | Sev | Eff |
|---|----|-----|-----|-----|
| ⬜ | testing-6 | Component tests for interactive surfaces + App routing (repo has **zero**) | med | M |
| ⬜ | testing-4 / testing-11 | Playwright e2e against `test-site/` + the unused violation fixtures | med | M |
| ⬜ | testing-10 | Move layout/SVG-correctness assertions out of happy-dom into e2e | med | M |
| ⬜ | testing-8/9/13 | ErrorBoundary, content-script injection edges, storage quota/concurrency | low | S–M |

---

## Phase 4 — New features (additions, not fixes)

> Roadmap §8 calls this cluster **"Phase 2 — Site-owner repositioning"**; the
> tracker numbers it Phase 4. Same work. The Tier-A legibility backlog has now
> landed (PR #3); Tier-B/C differentiators remain.

### Site-owner repositioning — DONE (PR #3)

| ✓ | ID | Feature | file:line | Commit |
|---|----|---------|-----------|--------|
| ✅ | ux-public-17 | Developer/Site-owner persona setting (the umbrella) + `lib/persona.ts` selectors/copy maps | `types.ts`, `constants.ts`, `Settings.tsx` | `e370fce` |
| ✅ | ux-public-1 / cws-5 | First-run onboarding (persona picker, privacy reassurance, primary CTA), gated on `hasSeenOnboarding` | `Onboarding.tsx`, `App.tsx` | `2049fe0` |
| ✅ | ux-public-11 | "Top fixes" action card (group by ruleId, rank by severity×count) | `TopFixesCard.tsx` | `2049fe0` |
| ✅ | ux-public-16 / deadcode-13 | Audit-aware success/empty copy (no more "passed all accessibility checks" after a perf scan) | `EmptyState.tsx`, `App.tsx` | `2049fe0` |
| ✅ | ux-public-3 | "Why this matters" per issue — ruleId→consequence map tagged in scanPage, rendered above the description | `why-it-matters.ts`, `scanner.ts`, `IssueDetail.tsx`, `IssueCard.tsx` | `fa3dc9e`, `74d9534` |
| ✅ | ux-public-13 | Plain element descriptor (`describeElement`) leads; raw markup behind "Show code" (site-owner) | `element-descriptor.ts`, `IssueCard.tsx`, `IssueDetail.tsx` | `74d9534` |
| ✅ | ux-public-15 | Plain "Hide" / "Not actually a problem" ignore flow (site-owner; codes unchanged) | `IssueDetail.tsx`, `IgnoreIssueModal.tsx` | `74d9534`, `a6eb8b2` |
| ✅ | ux-public-6 | Lead with shareable report; tuck JSON/CSV/Markdown/GitHub under "Advanced" (site-owner) | `ExportButton.tsx`, `CopyDropdown.tsx` | `22d3a2c` |
| ✅ | ux-public-8 | Plain audit one-liners; acronyms moved to the technical-details tooltip | `AuditSelector.tsx` | `b8f2fba` |
| ✅ | ux-public-9 | Default to a broad scan (all six) in site-owner mode | `AuditSelector.tsx` | `b8f2fba` |
| ✅ | ux-public-5 | Plain-language severity subtitles (Summary + filter options) | `Summary.tsx`, `FilterBar.tsx` | `a6eb8b2` |
| ✅ | ux-public-7 | Score explainer tooltip + grade-F renamed "Failing" (no Critical-severity collision) | `Summary.tsx`, `scoring.ts` | `a6eb8b2` |
| ✅ | ux-public-14 | Category filter derived from categories present; hidden when ≤1 | `FilterBar.tsx` | `a6eb8b2` |

### Still to do (Tier B/C differentiators — Phase 3 in the roadmap)

Tracked in [`PRODUCT_ANALYSIS.md` §4](./PRODUCT_ANALYSIS.md) Tier B/C — promote vision-sim/focus-order to results (`ux-public-10`), WAVE-style whole-page overlay (`feat-compet-10`), contrast eyedropper (`feat-compet-2`), real report screenshots (`feat-compet-9`), import-report (`feat-compet-8`), element-scoped scan, live preview-fix. Plus the export.ts report **content** rewrite (the menu now leads with "Share report", but the HTML/PDF body is not yet jargon-free/why-it-matters-led).

---

## Explicitly NOT doing (rejected in analysis — do not resurrect)

- Duplicate-injection "bug" (`correctness-6`, `err-14`, `perf-rel-8`) — re-injection is the correct MV3 pattern after update.
- `correctness-33` (list-view ring), `secpriv-11` (sender validation) — non-issues.
- Building literally for the "general public" / platform-specific no-code fix guides / Jira-GitHub issue creation / CrUX field data / percentile benchmarks — wrong audience or low value.
