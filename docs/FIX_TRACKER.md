# WatchDog — Fix Tracker

Living checklist of every finding we are committing to fix, derived from
[`PRODUCT_ANALYSIS.md`](./PRODUCT_ANALYSIS.md). Each row carries the finding ID
(cross-references the analysis), the primary `file:line`, and status. New
*features* (Phase 2/3 additions) are tracked at the bottom; this doc's focus is
the **fixes**.

**Legend:** ✅ done · 🚧 in progress · ⬜ pending  ·  Eff: S `<1d` / M `~days` / L `1–2wk` / XL `>2wk`

**Status summary:** Phase 0 trust+core-loop landed in **PR #3** (`fix/scanner-accuracy`, 8 commits, 1035 tests green). Everything below Phase 0's "remaining" block is not started.

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
| ⬜ | testing-3 | Add CI (typecheck/lint/test/build on PR, Node 22) | `.github/` (absent) | med | S |
| ⬜ | testing-5 | Broaden coverage `include` to all of `src`, set `all:true` + thresholds | `vitest.config.ts:15` | med | S |
| ⬜ | correctness-8 / secpriv-2 | Escape page-derived `selector`/`message`/`url` in `exportHTML` | `export.ts:461,464,471,475,405,495` | med | S |
| ⬜ | cws-6 / correctness-26 | Wire or delete the 3 dead Settings toggles (WCAG level, Show Incomplete, Auto-highlight) | `Settings.tsx:108`, `store/index.ts:123` | high(trust) | S–M |
| ⬜ | testing-1 | Background/service-worker unit tests (routing, badge, install, settings) | `background/*` | med | S |
| ⬜ | testing-2 | Export-module tests (snapshot each format; assert escaping) | `lib/export.ts` | high | S |

---

## Phase 1 — CWS launch gate

### The tool's own accessibility (an a11y tool must pass its own audit)

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ⬜ | cws-15 | `IgnoreIssueModal` → real dialog (`role`, focus trap, Esc, labels) | `IgnoreIssueModal.tsx` | med | S |
| ⬜ | cws-16 | `AuditSelector` conflicting ARIA + keyboard-unreachable tooltip | `AuditSelector.tsx` | med | S |
| ⬜ | cws-17 | `IssueCard` Space key + nested interactive `<a>` | `IssueCard.tsx` | med | S |
| ⬜ | cws-18 | `ScoreGauge` accessible name (`role=img` + label) | `ScoreGauge.tsx` | low | S |
| ⬜ | cws-12 | App-level `aria-live` region for scan progress/completion | `App.tsx`/`ScanProgress.tsx` | med | S |
| ⬜ | cws-13 | `role=progressbar` + `aria-valuenow` on the progress bar | `ScanProgress.tsx` | low | S |
| ⬜ | cws-19 | `aria-pressed` on severity/hide-known filter toggles | `Summary.tsx`/`FilterBar.tsx` | med | S |
| ⬜ | cws-20 | `aria-label` on the search input | `FilterBar.tsx` | low | S |
| ⬜ | cws-14 | Global `prefers-reduced-motion` guard | `styles/globals.css` | med | S |
| ⬜ | cws-8 | Add `_execute_action` command; fix misleading README shortcut line | `manifest.config.ts` | low | S |

### Listing / docs / correctness of claims

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ⬜ | ux-public-2 | Stop labeling every issue "WCAG" (add audit-type field) | `IssueCard.tsx:63`, scanners | med | S |
| ⬜ | deadcode-13 / cws-3 | Remove false "With screenshot" PDF claim; audit-aware report titles | `export.ts:397`, `ExportButton.tsx` | low | S |
| ⬜ | cws-1 | Capture store screenshots + promo tiles *(needs owner)* | `store-assets/` | high | S |
| ⬜ | cws-2 | Broaden listing/manifest copy to all six audits | `package.json:4`, `watchdog_description.txt` | high | S |
| ⬜ | secpriv-1 / cws-21 | Privacy doc: "no network" is false (scanners `fetch()`) — reword | `PRIVACY.md` | med | S |
| ⬜ | secpriv-4 / cws-22 | Privacy doc: storage mechanism/retention misstated | `PRIVACY.md` | med | S |
| ⬜ | secpriv-5 | Privacy/README: `<all_urls>` content script + `scripting` undocumented | `PRIVACY.md`, `README.md` | med | S |
| ⬜ | secpriv-7 / cws-23 | Document `scripting` permission; "4 permissions" lists 3 | `README.md`, `PRIVACY.md` | low | S |
| ⬜ | cws-4 / cws-10 | Fix repo/support links, version drift (footer `v1.0.0` on 1.0.1), add LICENSE | README, `Settings.tsx`, `CHANGELOG.md` | low | S |
| ⬜ | deadcode-10/11/12 | Single-source the a11y rule count (39) — UI/docs disagree (15/12/20/35) | `constants.ts:3`, `AuditSelector.tsx:40` | low | S |
| ⬜ | secpriv-3 | CSV formula-injection prefix guard (`= + - @`) | `export.ts` | low | S |
| ⬜ | secpriv-8 | Explicit `content_security_policy.extension_pages` | `manifest.config.ts` | low | S |
| ⬜ | secpriv-9 | Drop redundant `styles.css` from `web_accessible_resources` | `manifest.config.ts:47` | low | S |
| ⬜ | secpriv-10 | Build SVG vision filters via `createElementNS` (not `innerHTML`) | `vision-filters.ts:66` | low | S |
| ⬜ | secpriv-6 | **Decision:** drop `<all_urls>` for on-demand injection (removes install warning) | `manifest.config.ts` | med | M |

---

## Phase 2 — Incomplete / unwired features to finish

| ✓ | ID | Fix | file:line | Sev | Eff |
|---|----|-----|-----------|-----|-----|
| ⬜ | deadcode-2 / feat-compet-5 | Wire the built-but-unused history/trends layer to UI (summary snapshots) | `shared/storage.ts` | — | L |
| ⬜ | correctness-35 | History: wrap `set()` in try/catch; prune cross-domain; size guard | `shared/storage.ts:12,77` | low | S |
| ⬜ | correctness-32 | History: fix duplicate `selector::ruleId` miscount in `compareScanResults` | `shared/storage.ts:173` | low | S |
| ⬜ | deadcode-4 / correctness-27 | Render or remove the collected-but-unused axe `incomplete[]` ("needs review") | scanner + UI | low | S |
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

Tracked in [`PRODUCT_ANALYSIS.md` §4](./PRODUCT_ANALYSIS.md) — Site-owner mode, "Why this matters", "Top fixes" card, plain-language severity/exports, vision-sim/focus-order promotion, WAVE-style overlay, contrast eyedropper, real report screenshots, etc. Deferred until the fix backlog above is in good shape; sequence per the analysis.

---

## Explicitly NOT doing (rejected in analysis — do not resurrect)

- Duplicate-injection "bug" (`correctness-6`, `err-14`, `perf-rel-8`) — re-injection is the correct MV3 pattern after update.
- `correctness-33` (list-view ring), `secpriv-11` (sender validation) — non-issues.
- Building literally for the "general public" / platform-specific no-code fix guides / Jira-GitHub issue creation / CrUX field data / percentile benchmarks — wrong audience or low value.
