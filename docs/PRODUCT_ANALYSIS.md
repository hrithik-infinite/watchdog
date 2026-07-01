# WatchDog v1.0.1 — End-to-End Product & Code Analysis (Final)

Prepared for the owner. Scope: full product + functionality review of the shipped MV3 extension, with a clear split between NET-NEW findings and what `docs/V2_PLAN.md` already covers. Every claim is traced to source.

---

## 1. Executive Summary

### Product state

WatchDog is a feature-complete, single-page Chrome MV3 side-panel app running six audit engines (Accessibility via axe-core, plus hand-rolled Performance, SEO, Security, Best-Practices, PWA scanners) entirely in the page context, rendering results in a React/Zustand side panel. The MV3 architecture is sound: listeners register at top level and survive worker restarts; axe-core and pdf-lib are lazy-loaded; the scan/highlight/ignore/export loop works on the happy path; ~1,800 assertions span 23 test files.

But it is not ready for the general public, and in places not ready for *anyone*:

- **The core measurement is wrong in verified ways.** Performance CLS and TBT are roughly doubled (`performance-scanner.ts:129-171, :316-350`). The Security/Best-Practices/PWA scanners emit systematic **false positives** on essentially every real site (`security-scanner.ts:185-204, :70-93`; `best-practices-scanner.ts:142-144, :610-615, :334-344`; `pwa-scanner.ts:57-66`) — *and* a systematic **false negative**: the headline "vulnerable libraries" check only inspects `window` globals, so bundled (webpack/Vite/Rollup) apps — i.e. most modern sites — get a clean bill of health the tool never actually verified (`best-practices-scanner.ts:131-196`). For an audit tool, accuracy *is* the product.
- **The core loop has silent-failure holes.** A failed single scan dumps the user back to the home picker with no error (`useScanner.ts:129-130` + `store/index.ts:84-90`); a partial multi-scan failure hides *every* successfully-collected issue behind the error screen (`useScanner.ts:230-233` + `App.tsx:239-242`); a hung scan freezes the UI forever with no cancel (`useScanner.ts:69-72`, `ScanProgress.tsx`).
- **Visibly broken controls.** Three of six Settings toggles (WCAG level, Show Incomplete, Auto-highlight) persist but do nothing (`Settings.tsx:108-149`; `store/index.ts:123-167`); every issue — even a Performance metric — is labeled "WCAG …" (`IssueCard.tsx:63-69`).
- **It cannot be listed yet.** Zero store screenshots/promo tiles (hard CWS gate), accessibility-only listing copy on a six-audit product, no LICENSE file, a Settings footer hardcoded `v1.0.0` on a `1.0.1` build, and a privacy policy that materially misdescribes what the extension does.

### The core strategic tension: "general public" is the wrong target — build for site owners

The owner wants WatchDog "more usable by the general public." That ask is mis-scoped, and building toward it literally would waste effort. **Every unit of value WatchDog produces presupposes the user controls and can change the audited site** — add alt text, set server headers, fix markup, edit meta tags. A web *consumer* has no use for "Add the HSTS header to your server configuration" (`security-scanner.ts:89`) or a `.htaccess` snippet. The remediation layer is entirely site-modification guidance (`fixes.ts:5-326`), and the store copy already names the real audience: "Designers, developers, QA testers, or anyone building accessible products" (`watchdog_description.txt`).

The **realistic, winnable audience is non-developer site owners**: small-business owners, bloggers/content creators, marketers, agency PMs, manual QA. They control a site and care about "is it fast / will Google find me / is it safe / can everyone use it," but cannot act on raw axe rule IDs, CSS selectors, CI/CD JSON, or OWASP links. The move is not to dumb the tool down for browsers-at-large; it is to **reposition around site owners and small teams, add a "Site-owner mode" that swaps jargon/fix-guidance/export-defaults, and keep developer artifacts behind a "Developer mode."** V2_PLAN is dev-focused and does not address this — it is the largest net-new opportunity in this report.

This also resolves a credibility problem: the listing courts "everyone" while every result surface is developer-grade (`cws-7`). Either narrow the promise or build the plain-language layer. Build it — it is the differentiator vs Lighthouse, which already owns the developer.

### Top 5 highest-leverage moves

1. **Stop shipping wrong numbers.** Fix the verified accuracy cluster — CLS/TBT doubling (`correctness-3`), HttpOnly-on-every-site (`correctness-10`), meta-CSP false "missing CSP" (`correctness-12`), underscore-as-lodash CVE (`correctness-13`), lazy images "broken" (`correctness-14`), unsized-image false positives (scanners-core map), broken-manifest silent pass (`correctness-17`), and the **vuln-lib false negative** (scanners-core map). Accuracy is the product. All small effort, high trust impact.
2. **Close the silent-failure holes in the core loop.** Error-screen-unreachable (`correctness-1`), multi-scan data loss (`err-2`), scan timeout + cancel button (`err-1`), on-demand injection self-heal (`err-4`). The difference between "tool failed and told me" and "tool looks broken."
3. **Clear the CWS launch gate and the day-one-1-star surface.** Screenshots/promo tiles (`cws-1`), broaden listing copy to all six audits (`cws-2`), delete-or-wire the three dead toggles (`cws-6`), fix WCAG-everywhere mislabel (`ux-public-2`), reconcile version/license/links/privacy docs, fix the worst self-inflicted a11y bugs *in an a11y tool* (`cws-15/16/17`).
4. **Reposition for site owners (the actual ask).** Ship `ux-public-17` Site-owner mode plus its backlog: onboarding (`ux-public-1`), "Why this matters" (`ux-public-3`), "Top fixes" action card (`ux-public-11`), plain-language severity (`ux-public-5`), plain export (`ux-public-6`), audit-aware copy (`ux-public-16`).
5. **Promote the demo-able differentiators.** Surface vision simulators and focus-order out of Settings and tie them to findings (`ux-public-10`); add a WAVE-style "show all on page" overlay (`feat-compet-10`) and an eyedropper contrast checker (`feat-compet-2`). These are the visceral, screenshot-worthy features that sell to a non-developer audience and that Lighthouse lacks.

---

## 2. Code Gaps & Bugs to Fix (prioritized P0–P3)

Severity/impact/effort carried from verified findings. `file:line` is the primary source. All NET-NEW unless flagged **[V2]**.

### P0 — falsifies core output, data loss, security, or launch-blocking trust

| ID | Bug | file:line | Sev | Eff |
|---|---|---|---|---|
| correctness-3 | Performance CLS **and** TBT double-count buffered entries (read synchronously, then re-observed with `buffered:true`); ratings flip good→needs-improvement, false issues emitted | `performance-scanner.ts:129-147,:153-171,:316-328,:336-350` | high | S |
| correctness-1 | Single-scan error wiped: `setError()` then `setScanResult(null)` clears `error`; user lands on home picker with no message; error EmptyState unreachable | `useScanner.ts:129-130`; `store/index.ts:84-90`; `App.tsx:210,239` | high | S |
| err-2 / correctness-2 | Partial multi-scan failure sets both `scanResult` and `error`; `App.tsx:242` gate `!error && scanResult` hides **all** successfully-collected issues | `useScanner.ts:230-233`; `App.tsx:239-242` | high | S |
| cws-6 / correctness-26 / deadcode-3 | WCAG-level, Show-Incomplete, Auto-highlight toggles persist but are read by nothing; dead controls read as "broken" | `Settings.tsx:108-151`; `store/index.ts:123-167`; `useScanner.ts:69-72` | high(trust) | S–M |
| correctness-8 / secpriv-2 | `exportHTML` interpolates page-derived `selector`/`message`/`url` unescaped (only `element.html`/`fix.code` escaped); stored HTML/script injection in downloaded report. Blast radius is the local-file origin + multi-step trigger, but it is an injection in a security tool's own artifact | `export.ts:461,464,471,475,405,495` | medium | S |

### P1 — wrong/missing results users rely on, silent failures, core-loop resilience

| ID | Bug | file:line | Sev | Eff |
|---|---|---|---|---|
| **vuln-lib-fn** (scanners-core map) | "Vulnerable libraries" only detects `window`-global libs (jQuery/_/React/Vue/etc.); bundled apps expose no globals → headline CVE check silently finds nothing on most modern sites. Cheap fix: relabel as "globally-exposed library versions only"; real fix: parse bundles | `best-practices-scanner.ts:131-196` (detect), `:211-241` (consume) | medium | S (label) / L (real) |
| err-1 / perf-rel-5 | No scan timeout / AbortController / cancel button; a hung `axe.run` on a large DOM freezes the panel on ScanProgress (E004 defined but never thrown) | `useScanner.ts:69-72`; `scanner.ts:138`; `ScanProgress.tsx`; `errors.ts:34-39,84-85` | medium | S |
| err-4 | PING-only "ensure loaded" never injects despite `scripting` permission + comment claiming on-demand injection; first-run scans on pre-existing tabs die with E003 | `useScanner.ts:7-14,115,175`; `background/index.ts:30-41` | medium | S |
| err-3 | Web Store / PDF / `file://` / `view-source:` / `edge://` fall through to "refresh the page" (E003) — advice that loops forever for unscannable page types | `useScanner.ts:107-113,7-14`; `errors.ts:27-33,81` | medium | S |
| err-6 | Vision/focus toggles call `onUpdate` first, then message in a silent `try/catch`; on un-injectable pages the switch stays "on" while nothing applied → false confidence in an a11y testing tool | `Settings.tsx:51-66,68-83` | medium | S |
| correctness-10 | Security: HttpOnly "missing" fires whenever `document.cookie` is non-empty — false positive on nearly every site | `security-scanner.ts:185-204` | medium | S |
| correctness-12 / secpriv-12 | Security headers read via separate `fetch(HEAD)`, missing `<meta http-equiv>` CSP → false "Missing CSP"; credentialed same-origin extra request | `security-scanner.ts:70-93,95-108,75` | medium | S |
| correctness-13 | underscore.js mis-detected as lodash (`win._.VERSION`, underscore branch dead-gated `!lodash`); emits false lodash CVE | `best-practices-scanner.ts:142-144,190-193` | medium | S |
| correctness-14 | `loading="lazy"`/in-flight images flagged "failed to load" (`!img.complete \|\| naturalHeight===0`) | `best-practices-scanner.ts:610-615` | medium | S |
| **unsized-img-fp** (scanners-core map) | Unsized-image check only accepts width/height attrs or inline style; images sized via stylesheet/class flagged "missing explicit width/height" on well-built responsive pages | `best-practices-scanner.ts:334-344` | low | S |
| correctness-17 | PWA: linked-but-unreachable/malformed manifest → `fetchManifest` null → all content checks skipped → graded "fully installable" | `pwa-scanner.ts:57-66,102-104,509-511` | medium | S |
| correctness-4 | Highlight/rescan/vision/focus target the **active** tab, not the **scanned** tab (panel is window-global); switching tabs after a scan mis-targets | `messaging.ts:121-124`; `useHighlight.ts:9-28`; `useScanner.ts:100,160`; `Settings.tsx:56-78` | medium | M |
| correctness-24 | Focus-order: no visibility/aria-hidden filter, NaN `parseInt` tabindex, no MutationObserver → wrong/inflated tab-order model | `focus-order.ts:15-41,136-151` | medium | S |
| correctness-29 | Scoring not normalized per audit (fixed `MAX_WEIGHTED_ISSUES=100`); per-element perf issues over-penalize; multi-scan double-counts overlapping defects | `scoring.ts:16-18,42-49`; `performance-scanner.ts:600-638,784-823` | medium | M |
| perf-rel-4 | Performance audit imposes a flat ~1000ms wait per scan (`:1011`) that subsumes the three 500ms observer windows; the 500ms→1000ms half is provably dead time. Multi-scan pays it serially → multi-second spinner with no value. Reducing 1000→500ms is strictly free | `performance-scanner.ts:1011`; observer windows `:193,:295,:369`; `useScanner.ts:184-212` | low | S |
| perf-rel-2 | Focus-order: unthrottled capture-phase scroll listener calls `getBoundingClientRect` per element per event → layout thrashing on the audited page | `focus-order.ts:136-147,76-82` | medium | S |
| perf-rel-6 | IssueList renders every issue, no virtualization; color-contrast-heavy / multi-audit results mount hundreds of card subtrees | `IssueList.tsx:32-44`; `useScanner.ts:204,219` | medium | S |
| perf-rel-7 | Whole-store subscription + `getFilteredIssues` recomputed each render, search undebounced, cards not memoized → keystroke lag at large N | `useIssues.ts:4-21`; `store/index.ts:123-167,175-182` | medium | S |
| err-9 | Only render-phase ErrorBoundary; no global `unhandledrejection`/`onerror`; async throws in export/copy/settings vanish silently (console stripped in prod) | `ErrorBoundary.tsx:25-27`; `CopyDropdown.tsx:37` | low | S |
| err-10 | Export failures (esp. PDF: pdf-lib throws on any non-WinAnsi char from arbitrary public sites) revert "Exporting…"→"Export" with no error | `ExportButton.tsx:26-49`; `export.ts:28-38,509-513` | medium | S **[V2]** |
| err-5 | Highlight fails silently (logger.error only, stripped in prod); clicking an issue post-navigation no-ops with zero feedback | `useHighlight.ts:17-19,29-31`; `App.tsx:117,179-181` | low | S |
| correctness-21 | Resource/image/JS size sums `transferSize` (0 for cross-origin without TAO); heavy CDN pages look lightweight | `performance-scanner.ts:493,513-544` | low | S |
| fixes-fragile (scanners-core map) | Accessibility fix code does naive string-replace on 200-char-truncated `element.html`; e.g. image-alt injects `alt` even when one exists → invalid example markup | `fixes.ts:6-9,329-338` | low | S |

### P2 — lower-frequency wrong results, hygiene that matters

| ID | Bug | file:line | Sev | Eff |
|---|---|---|---|---|
| correctness-5 | Badge shows only the **last** audit's count in a multi-scan (last-write-wins; combined total stays client-side) | `content/index.ts:35-38`; `background/index.ts:71-75`; `useScanner.ts:215-222` | low | S |
| checkConsoleErrors (scanners-core map) | "Console Errors"/"Error Handlers" check cannot read the console; it counts `[onerror]` attributes (>5) — misleading label, unrelated signal | `best-practices-scanner.ts:571-602` | low | S |
| correctness-22 | Vision/focus state not re-applied on load; teardown only on `beforeunload` → stale overlays persist on SPA route changes | `content/index.ts:83-87,89`; `Settings.tsx:52,69` | low | S |
| correctness-23 | Focus-order hide re-queries DOM (orphans outlines on changed elements); `removeHighlight` resets inline outline to `''` not original | `focus-order.ts:126-133,168-171,87-100` | low | S |
| correctness-25 / secpriv-10 | Vision filters built via `innerHTML`, omit `color-interpolation-filters="sRGB"` → simulation computed in linearRGB (wrong color space); destructive root-filter reset | `vision-filters.ts:66-71,91,102,109` | low | S |
| correctness-11 | noopener heuristic flags already-safe `target=_blank` (OR of noopener/noreferrer; modern browsers imply noopener) | `security-scanner.ts:350-358` | low | S |
| correctness-16 | Notification/geolocation checks only scan inline `<script>` text; external bundles never inspected; substring matches comments | `best-practices-scanner.ts:289-305,800-813` | low | S |
| correctness-15 | Empty-link counter double-counts a link that is both `href="#"` and has no text/img | `best-practices-scanner.ts:684-697` | low | S |
| correctness-18 | PWA icon size by substring `includes('192')/('512')` — `1192x1192`/`1920x1080` false-pass | `pwa-scanner.ts:220-224` | low | S |
| correctness-19 | SEO title/desc thresholds (`<30/>60`, `<120`) contradict their own "50-60"/"150-160" copy | `seo-scanner.ts:52,58,103,109` | low | S |
| correctness-20 | Performance uses deprecated `performance.timing`/`navigationStart`; negative/absent load time | `performance-scanner.ts:409,416,467` | low | S |
| correctness-7 | Non-atomic read-modify-write on `chrome.storage.local`; rapid ignore/settings writes drop updates | `shared/storage.ts:358-363,70-85,374-376`; `background/storage.ts:17-26` | low | S |
| correctness-30 / err-12 | Background & content catch read `error.message` with no `instanceof` guard; non-Error throw degrades message / TypeError-in-catch | `background/index.ts:59-62`; `content/index.ts:13-16` | low | S |
| correctness-34 | `handleSelectIssue` always sends HIGHLIGHT_ELEMENT even for non-a11y scans; `head`/element selectors actually scroll the page | `App.tsx:107-121,189,278` | low | S |
| err-7 | Background `saveSettings` swallows errors, returns `{success:true}`; optimistic store update means failed writes are invisible | `background/storage.ts:17-26`; `background/index.ts:84-87`; `useSettings.ts:27-32` | low | S **[V2]** |
| err-8 | `ignoreIssue` write failure → IgnoreIssueModal catch only `console.error`, no `onClose`/error; modal sits after spinner stops | `shared/storage.ts:358-364`; `IgnoreIssueModal.tsx:42-61` | low | S |
| err-11 | Error codes derived by brittle message substring matching; rewording a throw silently reclassifies to E005; "connection"/"network" → false E008 | `errors.ts:70-101`; `useScanner.ts:12,103,112` | low | S |
| err-13 / correctness-28 | `SCAN_RESULT` fire-and-forget, no `.catch` → unhandled rejection on "context invalidated"; badge-update failures dropped | `content/index.ts:35-38` | low | S |
| correctness-31 | `clearBadge` resets text but not background color; stale per-tab color residue | `background/badge.ts:30-33,44-52` | low | S |

### P3 — latent / dead-code / edge cases

| ID | Bug | file:line | Sev | Eff |
|---|---|---|---|---|
| correctness-32 | `compareScanResults` Set-based counts miscount duplicate `selector::ruleId`; `totalDiff` can disagree with the issue lists; latent until History wired | `shared/storage.ts:173-175,200-212,216` | low | S **[V2]** |
| correctness-35 | `saveScanToHistory` `set()` has no try/catch; unbounded cross-domain growth stores full `issues[]`; quota rejection unhandled (latent) | `shared/storage.ts:12,77-85,17-27` | low | S **[V2]** |
| perf-rel-3 | Focus-order teardown gated on `getElementById(container)`; on SPA body-wipe the window scroll/resize listeners leak | `focus-order.ts:156-176,146-150` | low | S |
| perf-rel-1 | Always-injected `<all_urls>` content script statically bundles all 5 non-axe scanners (~82KB chunk parsed on every page load); code-split each behind `import()` like axe-core | `manifest.config.ts:36-42`; `scanner.ts:12-16`; `content/index.ts:9,83,89` | low | S |
| perf-rel-12 | Content script emits raw `console.log` on **every** page load (bypasses dev-gated logger; ships to prod) | `content/index.ts:89` | low | S |
| perf-rel-11 | Install/update injection loops `await` per tab sequentially; swallowed failures; slow worker first-run with many tabs | `background/index.ts:17-46` | low | S |
| perf-rel-13 | Vision simulators set a CSS filter on `documentElement`, forcing full-page rasterization while active (opt-in cost; breaks fixed/sticky containing blocks) | `vision-filters.ts:91,102` | low | S |
| perf-rel-9 / perf-rel-10 | axe-core ships as a 568KB chunk loaded per-scanned-tab (inherent — track on version bumps); side-panel main bundle 425KB JS + 60KB CSS (8 Radix pkgs + Tailwind dominate; pdf-lib already split) | `scanner.ts:23-29`; `dist/assets/*` | low | S |

> **Rejected — do not resurrect.** `correctness-6`, `err-14`, `perf-rel-8` (duplicate-injection): on update the old content script is orphaned (context invalidated), so re-injection is the correct MV3 pattern, not a double-listener bug. The only real residue is a missing defensive idempotency guard (hygiene, see testing-9). `correctness-33` (list-view ring) and `secpriv-11` (sender validation) were rejected as non-issues.

---

## 3. Incomplete / Unwired Features to Finish

Built (often tested) but unreachable, or half-wired with UI that lies.

- **Scan-history / trends data layer — fully built, zero UI** (`deadcode-2`/`feat-compet-5`, **[V2]** WS5). `shared/storage.ts` implements `saveScanToHistory`/`getAllScanHistory`/`getScanHistoryForDomain`/`getPreviousScan`/`compareScanResults`/`formatRelativeTime` with a 1,414-line test file, but **no production caller** — scans are never persisted, pruned, or diffed. Before wiring: switch to summary snapshots (currently stores full `issues[]` incl. `element.html`, capped 10/domain but unbounded across domains, no `unlimitedStorage`), wrap `set()` in try/catch (`correctness-35`), fix the duplicate-hash diff (`correctness-32`). Effort L.
- **Three dead Settings toggles** (`cws-6`/`correctness-26`/`deadcode-3`). WCAG-level and Show-Incomplete ignored by `getFilteredIssues`; the scan payload sends only `auditType`; Auto-highlight never consulted (hover gated on `canHighlight`). **Decide per toggle:** Auto-highlight is a one-line gate; Show-Incomplete needs the incomplete render section below; WCAG-level needs the level threaded into the scan payload → axe `runOnly` tags or post-filter. If not wiring now, **delete the controls** — do not ship dead toggles into a public release.
- **`incomplete[]` (axe "needs manual review") collected but never rendered** (`deadcode-4`/`correctness-27`). Produced and combined, then dropped at the UI; the other five scanners hardcode `incomplete: []`. Add a "Needs manual review" section gated on `showIncomplete`, or remove the plumbing. This is the data half of the Show-Incomplete toggle.
- **Four stub audit types** mobile/links/i18n/privacy (`deadcode-1`, **[V2]**). In the triple-defined `AuditType` union, fall through to `throw "not yet implemented"` (`scanner.ts:193-197`), but not rendered in the 6-card selector — unreachable, not a live crash. Per V2_PLAN: implement i18n/mobile/privacy, **delete the `links` member** (needs network/host-permissions, breaks local-only story), then re-evaluate E006 (`deadcode-14`).
- **PDF "With screenshot" generates no screenshot** (`deadcode-13`/`cws-3`). Label promises it; `exportPDF` is pdf-lib-only and `html2canvas` isn't a dependency. README even names a stack (jsPDF/html2canvas) the project doesn't use. Also: `exportHTML`/`exportPDF` hardcode "WatchDog Accessibility Report / powered by axe-core" for *every* audit type (`export.ts:397-398,570`) while the copy exporters already thread `auditType` — plumb `selectedAuditType` in or remove the claims.
- **`useTheme` fully implemented + tested, never imported** (`deadcode-5`). App hardcodes `bg-bg-dark`; no component uses `dark:` variants, so wiring the hook alone toggles a `.dark` class nothing reacts to. Decide: build real theming (UI must respond) or delete hook + test.
- **Dead exports**: `overlay.highlightMultiple` and `vision-filters.getCurrentVisionFilter` are tested but unwired (`deadcode-6`); `errors.formatError` and `messaging.sendMessage`/`sendTabMessage` unused while call sites use raw `chrome.*` (`deadcode-7`); `EmptyState` `initial` variant never rendered (`deadcode-8`); dead empty-body autocomplete branch in `checkPasswordPaste` (`deadcode-9`). Remove or wire — `highlightMultiple` specifically feeds the WAVE overlay in §4.

---

## 4. New Features for General-Public (Site-Owner) Usability — the heart of the ask

The answer to "what to ADD." Sequenced: first make the *existing* output legible to a non-developer (cheap, compounding), then add the demo-able differentiators, then heavier net-new capabilities. Effort and permission cost called out per item.

### Tier A — Make current output legible (do first; mostly S effort, no new permissions)

1. **Site-owner repositioning + a Developer/Site-owner mode** (`ux-public-17`, umbrella, L). The framing for everything else. A persisted persona toggle (settings infra + `storage` permission already exist) that swaps: jargon → plain language, fix snippets → plain "what to change," export defaults (hide JSON/GitHub/Markdown), learn-more links. **No new permission.** Items 2–12 are the Site-owner-mode backlog.
2. **First-run onboarding** (`ux-public-1`/`cws-5`/`feat-compet-19`, **[V2]** but undesigned, S). One plain sentence, a privacy reassurance ("Everything runs on your computer; nothing is uploaded"), and one primary "Check this page" CTA running a sensible default. Gate on a persisted `hasSeenOnboarding` flag. Also introduce how to *read* results (the score gauge, severity colors, highlighting, export) — currently never explained. **No new permission.**
3. **Default to a broader scan instead of accessibility-only** (`ux-public-9`, S–M). AuditSelector defaults to `Set(['accessibility'])` (`AuditSelector.tsx:115`), the most jargon-heavy audit, as the first impression. For the non-developer flow, default to "Check everything" (or lead Performance + SEO + Accessibility) and keep single-audit selection as an advanced affordance. `selectAll()` already exists, so the default change is one line; do **not** restructure results around it. **No new permission.**
4. **Stop labeling everything "WCAG"** (`ux-public-2`, S). Non-a11y scanners stuff fake values into `wcag` so a Performance issue renders "WCAG Performance (Level AA)" (`IssueCard.tsx:63-69`; `performance-scanner.ts:570-575`). Add a discriminating standard/audit-type field threaded through the six scanners (the `Category` enum can't discriminate — it has no `accessibility` value and categories overlap), render WCAG only for true accessibility issues, and show a neutral label otherwise ("Google SEO guideline", "Web security best practice"). **No new permission.**
5. **"Why this matters" field on every issue** (`ux-public-3`, M). Add an optional `whyItMatters` to `Issue`, populated per check with human/business consequence ("Visitors using a screen reader can't tell what this button does", "Slow pages make customers leave"). Render above the technical description in `IssueDetail`, one-liner on `IssueCard`. M because content must be authored across six scanners plus a ruleId→copy map for axe rules. **No new permission.**
6. **Plain-language severity** (`ux-public-5`, S). Human subtitles (Critical = "Some people can't use this", Serious = "Big problems for many users", Moderate = "Noticeable issues", Minor = "Small polish") in Summary tooltips and filter options. Radix Tooltip already in use. **No new permission.**
7. **Lead exports with a plain "Share report"; tuck dev formats away** (`ux-public-6`, M). The menu labels JSON "For CI/CD pipelines" and leads the copy menu with "Copy as Markdown"/"Copy for GitHub" (`ExportButton.tsx:79`; `CopyDropdown.tsx:87-91`) — meaningless to a site owner. Lead with "Share report / Email a summary" producing a clean, audit-aware, jargon-free HTML/PDF (plain "what's wrong + why it matters"); move JSON/GitHub/Markdown under an "Advanced / for developers" submenu (the Site-owner-mode default already hides them). Pairs with the audit-aware report-title fix. **No new permission.**
8. **Audit-aware success / "ready" / report copy** (`ux-public-16`, `deadcode-13`, S). EmptyState says "passed all accessibility checks" after a Performance scan (`EmptyState.tsx:59`); thread `scanResult`/`auditType` and use generic copy ("No problems found on this page. Nice work!"). Make export/report titles audit-aware. **No new permission.**
9. **Plain audit one-liners + tucked-away acronyms** (`ux-public-8`, S). Rewrite each card as a question/benefit ("Performance = Does your site load fast?", "SEO = Will Google find and rank your page?") and move LCP/TTFB/CSRF/service-worker into an optional "technical details" expander (`AuditSelector.tsx:41-99,327-344`). **No new permission.**
10. **Score explainer + rename F-grade** (`ux-public-7`, S). Add an info tooltip ("100 = no problems found; lower means more or more serious problems") and rename the grade-F label "Critical" (`scoring.ts:102`) to avoid collision with the Critical severity count. Note the gauge label is currently suppressed (`showLabel={false}`), so the collision is latent — still worth the rename. **No new permission.**
11. **Plain "Hide / Dismiss" ignore flow** (`ux-public-15`, S) and **plain category groupings + hide-when-single-value filter** (`ux-public-14`, S). Rename "Mark Known"/"False positive" to "Hide"/"Not actually a problem" (labels only, stored codes unchanged), and derive the category filter from categories actually present (it currently always renders 8 static options, mostly empty for single audits). **No new permission.**
12. **Plain element descriptor instead of raw HTML on cards** (`ux-public-13`, S). Parse tag + accessible name from `element.html` to show "the 'Buy now' button" and collapse markup under "Show code" in Site-owner mode. **No new permission.**

### Tier B — Demo-able differentiators (M effort, no new permissions; these win the audience vs Lighthouse)

13. **"Top fixes" action card** (`ux-public-11`, M). Group `scanResult.issues` by `ruleId`, rank by severity×count, show the 3–5 highest-impact actions in plain language with counts ("12 images are missing descriptions"). Pure derived view of existing data. Highest-value single UX add for a non-developer: turns a paralyzing list into a starting point. **No new permission.**
14. **Promote vision simulators + focus-order out of Settings** (`ux-public-10`, M). Add an "Experience your site" action on results and deep-link the colorblind simulator from color-contrast issues (`constants.ts:71`). Reuses existing messaging. The most visceral, screenshot-worthy capabilities, currently buried two layers deep. **No new permission.**
15. **WAVE-style "show all on page" overlay** (`feat-compet-10`, M). Wire `highlightMultiple` (dead, `deadcode-6`) into a toggle drawing severity-colored markers for every issue in context, with a MutationObserver to keep them positioned. Reuse the badge primitives in `focus-order.ts`. No major competitor's free tier does whole-page in-context mapping this cleanly. **No new permission.**
16. **Interactive contrast checker / eyedropper** (`feat-compet-2`, M). EyeDropper API + `captureVisibleTab` (covered by `activeTab`) + canvas: sample fg/bg, show live WCAG AA/AAA pass, nudge to a passing pair. Standard in axe DevTools/WAVE; WatchDog only reports contrast after the fact today. **No new permission.**
17. **Real screenshot in PDF/HTML reports** (`feat-compet-9`, M). `captureVisibleTab` + canvas crop to the highlighted element. Fixes the false "With screenshot" claim *and* improves the report a site owner emails to their web person. **No new permission.**
18. **"Import report" + relabel "Shareable report"** (`feat-compet-8`, S). File input + FileReader to reopen an exported JSON. Cheapest credible "sharing" without backend/host-permissions. **No new permission.**

### Tier C — Heavier net-new (larger effort and/or permission cost; sequence after Tier A/B, gate behind explicit action)

19. **Interactive keyboard tab-stop walkthrough** (`feat-compet-3`, M). `focusin`/`keydown(Tab)` listeners draw the *real* focus path, flagging traps, off-screen focus, skipped controls — far stronger than the static, sometimes-wrong overlay. **No new permission.**
20. **Screen-reader / accessible-structure preview** (`feat-compet-11`, M). Heading outline + landmark map + accessible-name preview (axe-core already bundles accname). Educational for non-AT users. **No new permission.**
21. **AI "Explain / Suggest fix"** (`feat-compet-4`, M). Opt-in action sending issue + element HTML to an LLM for plain-language explanation + tailored fix — the clearest path to serving non-developers who can't act on raw rule text. **Permission cost: high.** New `host_permissions`, sends page data off-device, breaks the local-only `PRIVACY.md` claim, raises CWS data-use review. Strictly opt-in, disclosed, off by default.
22. **Element-scoped scan** (`feat-compet-13`, M). Click-to-select picker → `axe.run(context)` on the subtree. Developer power-feature; **no new permission**. Don't scope the other five scanners (page-global by nature).
23. **Live "Preview fix" on the page** (`feat-compet-20`, M). Revertible DOM patch + re-run the rule to confirm it passes. Differentiator no major competitor offers, but only ~10–12 attribute-level rules support it cleanly, and `FixSuggestion` is an unstructured string today (needs a structured patch field). **No new permission.**

### Tier D — Pro / team features (defer; these serve the *developer* audience, several carry permission cost)

24. **Multi-page / site crawl** (`feat-compet-6`, L) — needs `tabs` and/or sitemap `host_permissions`; weakens "only the page you're on."
25. **Scheduled monitoring + regression alerts** (`feat-compet-7`, M headline, tab-orchestration is the real cost) — `alarms`+`notifications` (low) + `tabs`/broad host (the actual CWS risk). Pairs with the history layer.
26. **Headless CLI / GitHub Action** (`feat-compet-12`, XL) — separate npm package reusing pure `scoring.ts`/`scanner` logic; **no CWS impact**. The JSON export already implies a CI workflow that doesn't exist.
27. **Guided manual WCAG assessment** (`feat-compet-1`, XL) — ~50-step WCAG 2.x AA checklist; the only path to claiming conformance vs "no automated violations." **No new permission**, but power-user-targeted.
28. **Performance throttling / device emulation** (`feat-compet-16`, XL) — requires `debugger` (severe CWS friction). Pragmatic alternative: **label scores as unthrottled lab values** (S) — without it, fast dev machines report falsely good scores.
29. **Performance budgets / threshold gating** (`feat-compet-17`, M) and theming (`deadcode-5`) — pair with history/CI; low value for the one-click audience.

> **Rejected feature asks (do not build for this audience):** platform-specific no-code fix guides (`ux-public-4`), simplifying authoritative learn-more links (`ux-public-12`), Jira/GitHub issue creation (`feat-compet-14`), CrUX field data (`feat-compet-15`), percentile benchmarks (`feat-compet-18`).

---

## 5. Product / UX / Accessibility-of-the-Tool Improvements

Interaction-quality and "an a11y tool that fails its own audit" issues. The latter are reputationally load-bearing.

**The tool's own UI fails accessibility checks it would flag on others:**

- **IgnoreIssueModal is not an accessible dialog** (`cws-15`, medium, S): bare div, no `role=dialog`/`aria-modal`/`aria-labelledby`, no focus trap, no Escape, non-dismissible backdrop, unlabeled "X", fake radios. Rebuild on a dialog primitive (note `@radix-ui/react-dialog` is not yet installed — a manual fix avoids a new dependency) or add the attributes + focus management.
- **AuditSelector conflicting ARIA + keyboard-unreachable tooltip** (`cws-16`, medium, S): cards set `role=checkbox` *and* `aria-pressed` *and* `aria-checked`; the info tooltip (the only place "checks/does NOT check" lives) is a `tabIndex=-1` span nested inside the card button. Use `role=checkbox`+`aria-checked` only, wrap the grid in `role=group`, make the info affordance focusable and not nested.
- **IssueCard Enter-only + nested interactive** (`cws-17`, medium, S): `role=button` handles Enter but not Space, and contains a "Learn more" `<a>` (nested-interactive — exactly what axe flags). Handle Space (preventDefault), move the link outside the role=button region.
- **Score gauge has no accessible name** (`cws-18`, low, S): SVG has no `role=img`/`aria-label`; in the only mount site `showLabel={false}`, so AT users get a bare number with no scale or grade. Add `role=img` + `aria-label="Score: 82 out of 100, Good"`.

**Scan/filter feedback is silent to assistive tech:**

- **No aria-live anywhere; scan progress unannounced** (`cws-12`, **[V2]**, medium, S): SR users hear nothing on start, transition, or completion. Add an **App-level** `aria-live=polite role=status` region (must live above ScanProgress, which unmounts) announcing audit transitions + "Scan complete, 12 issues found"; add `aria-busy` to results. Do **not** put the 2s-cycling messages in the live region.
- **Progress bar has no progressbar semantics** (`cws-13`, low, S): add `role=progressbar` + `aria-valuemin/max/now`.
- **Filter state visual-only + filtering unannounced** (`cws-19`, **[V2]**, medium, S): Summary severity buttons and the hide-known toggle convey active state by color only — add `aria-pressed` (precedent already at `AuditSelector.tsx:235`); announce result counts.
- **Search input placeholder-only** (`cws-20`, **[V2]**, low, S): add `aria-label="Search issues"`.

**Motion / vestibular:**

- **No `prefers-reduced-motion`** (`cws-14`, medium, S): pervasive infinite animation (ping ring, 1.5s spinner, 5 bounce dots, scan sweep, pulse skeletons) with no reduced-motion guard — self-undermining for a tool shipping a low-vision simulator. Add a global `@media (prefers-reduced-motion: reduce)` block.

**Other UX:**

- **No keyboard command to open/scan** (`cws-8`, low, S): no `commands` in the manifest, yet README says "use keyboard shortcut (if configured)" — and with no `commands` declared the extension doesn't even appear on `chrome://extensions/shortcuts`, so a user *cannot* configure one. Add an `_execute_action` command (no permission; reuses existing `openPanelOnActionClick`) and fix the misleading README line.
- **Two export scopes for the same data**: CopyDropdown is audit-aware and copies the *filtered* set; ExportButton/file exports are not audit-aware and download the *full* set. Reconcile.

---

## 6. Security, Privacy & CWS-Readiness

WatchDog's pitch is privacy-first and local-only, and the **documentation contradicts the code in ways a CWS reviewer (and the project's own "Code is Truth" claim) will catch.**

**Code-level security (real, fixable):**

- **HTML export injection** (`secpriv-2`/`correctness-8`, medium, S): page-controlled `element.selector` (built raw `#${element.id}` in the custom scanners) flows unescaped into the downloaded report; an `id` like `a"><img onerror=…>` executes when the report is opened at `file://`. Add one `escapeHtml()` helper applied to `message`/`description`/`fix.description`/`selector` and the url text; validate/encode the href. Constrained blast radius (local-file origin, multi-step trigger) but unacceptable in a security tool's own artifact.
- **CSV formula injection unguarded** (`secpriv-3`/`correctness-9`, low, S): `escapeCsvValue` doesn't prefix-guard leading `= + - @`. Latent defense-in-depth today (no cell currently leads with attacker content), but a 3-line OWASP hardening worth adding before a future scanner emits page-text-leading messages.
- **Credentialed same-origin HEAD probe** (`secpriv-12`/`correctness-12`, low, S): the header check sends the user's cookies as an extra authenticated request and misses meta-CSP. Add `meta[http-equiv]` inspection for CSP/Referrer-Policy (note HSTS/X-Frame-Options/X-Content-Type-Options cannot be meta-delivered, so a network read is still needed for those).
- **`innerHTML` for SVG filter primitives** (`secpriv-10`, low, S): the one `innerHTML` in the content layer; CWS scanners/linters flag it. Rebuild with `createElementNS` (also fixes the sRGB color-space bug, `correctness-25`).
- **No explicit `content_security_policy.extension_pages`** (`secpriv-8`, **[V2]**, low, S): the suggested value equals the MV3 default, so it's reviewer-confidence signaling, not runtime hardening.
- **`web_accessible_resources` exposes `styles.css` to `<all_urls>`** (`secpriv-9`, low, S): a fingerprinting vector; the CSS is already injected via `content_scripts.css`, so the WAR entry is likely redundant — verify and remove (note the injected highlight classes remain detectable via computed-style probing, so this is partial de-fingerprinting).

**Privacy-doc vs code mismatches (CWS data-use accuracy risk — fix before submitting):**

- **"No network requests / no data leaves device" is false** (`secpriv-1`/`cws-21`, medium, S): the Security scanner `fetch(HEAD)`s the page URL (`security-scanner.ts:75`) and the PWA scanner `fetch()`es the (possibly cross-origin) manifest (`pwa-scanner.ts:58`). No data goes to third parties, but the absolute wording is wrong. Reword to "scans may issue same-origin requests to the page/manifest to read headers and content; no data is sent to third parties."
- **Storage mechanism/retention misstated** (`secpriv-4`/`cws-22`, medium, S): `PRIVACY.md` claims "Session Storage … cleared when you close the browser" and "URLs not collected," but results are in-memory Zustand, ignored-issues persist `domain`+`selector`+`ruleId`+`message` in `chrome.storage.local` indefinitely, and the (dead) history path would persist full URL + `element.html`. It also lists a "Theme preference" stored feature that doesn't ship. Rewrite to describe persistent local storage of settings + ignored-issue records; remove the theme claim and the session-storage wording.
- **activeTab-only framing vs `<all_urls>` content script** (`secpriv-5`, medium, S): `PRIVACY.md` says "Cannot access tabs you're not actively scanning," but a static content script matches `<all_urls>` at `document_idle` and the background proactively injects into every open tab on install/update — and this triggers Chrome's "read and change all your data on all websites" install warning. Update the docs (README omits the content script *and* the `scripting` permission entirely).
- **`scripting` undocumented; "4 permissions" lists 3** (`secpriv-7`/`cws-23`, low, S): document `scripting` in README + PRIVACY and the CWS justification field; the prose enumerates 3 while claiming 4 — add the missing entry (the count itself is correct).
- **Store host-permission justification mismatches the manifest** (product-surface map, low, S): `watchdog_description.txt:20-29` provides a "HOST PERMISSION JUSTIFICATION" for "broad host access," but the manifest declares no `host_permissions` (broad access comes from the `<all_urls>` content script). Reconcile the reviewer-facing justification with the actual mechanism so it doesn't read as a copy/paste from a different permission model.

**The strategic security recommendation (M, net-new):**

- **Eliminate broad host access via on-demand injection** (`secpriv-6`, medium, M). The *only* thing forcing the scary all-sites warning is the static `<all_urls>` content script. The extension already holds `activeTab`+`scripting` and already injects programmatically. Dropping the declarative script and injecting on user gesture would (a) remove the install warning — a real adoption killer for a public audience, (b) make the activeTab-only privacy claims actually *true*, (c) cut CWS broad-host friction. Tradeoffs: PING handshake + install-time pre-injection rework, CRXJS build reconfiguration, and `activeTab` doesn't follow tab switches with a persistent side panel (re-gesture per tab — a real UX regression to weigh). V2_PLAN keeps permissions identical and only plans to *document* the justification — so this stronger option is net-new and worth presenting as a decision.

**Launch-blocking listing items (CWS):**

- **No screenshots or promo tiles exist** (`cws-1`, **[V2]**, high, S): the ≥1 screenshot (1280×800 or 640×400) is the hard publishing gate; the 440×280 tile is now auto-generated/optional and the 1400×560 marquee is for featuring. Capture 4–6 screenshots (selector, scan-in-progress, issue list, issue detail + fix, element highlighting, vision simulator) under a tracked `store-assets/`.
- **Listing copy is accessibility-only** (`cws-2`, **[V2]**, medium/high, S): the manifest description (from `package.json:4`) and `watchdog_description.txt` ignore the five non-a11y audits — zero search discoverability. Lead with "All-in-one website auditor: Accessibility, Performance, SEO, Security, Best Practices, PWA" (~89 chars, fits the 132-char manifest limit).
- **No LICENSE file** (product-surface map): `package.json` declares ISC, README links `[LICENSE]` twice + a badge, but the file is absent. Add it.
- **Broken/placeholder support+repo links** (`cws-4`, low, S): README uses `your-username/watchdog`; PRIVACY uses `hrithik-infinite/watchdog`. Pick one canonical repo, set a real Support destination, verify the privacy-policy URL resolves (the only true submission-gating link).
- **Version drift** (`cws-10`, low, S): Settings footer hardcodes `v1.0.0` on a `1.0.1` build; README/PRIVACY/CHANGELOG all say 1.0.0 with no 1.0.1 entry. Derive the footer from the build version (Vite `define`), add the changelog entry.
- **Rule-count claims disagree everywhere** (`deadcode-10/11/12`, `cws-11`): code has 39 MVP_RULES, docs say 35, UI shows 15/12/20/12/15/7 — none agree (the comment at `constants.ts:3` is self-contradictory). Single-source the a11y count from `MVP_RULES.length` and reconcile the rest in one pass.
- **Two planning docs define different "v2.0"** (product-surface map, low): `implementation-roadmap.md` (CLI/CI-CD/VS Code) vs `V2_PLAN.md` (deps + History + deeper auditing). Mark the roadmap superseded so "what is v2" is unambiguous.
- **Zero i18n** (`cws-9`, **[V2]**, low, M): no `_locales`/`chrome.i18n`; low priority for a dev-leaning audience but caps the global ceiling. The minimal manifest `__MSG_` + `_locales/en/messages.json` pipeline is S; full string extraction is the M part.

---

## 7. Testing & CI Gaps

The suite is large but **structurally aimed away from the riskiest code**, and in one case it *locks in a bug*.

- **No CI at all** (`testing-3`, **[V2]**, medium, S): no `.github/`. Scripts exist (`typecheck`, `lint --max-warnings 0`, `test --coverage`, `build`) but nothing gates push/PR. Add `ci.yml` (Node 22) blocking on red; wire releases via the already-present `@changesets/cli`. **First priority** — it makes every other test useful.
- **Coverage config hides the gaps** (`testing-5`, medium, S): `coverage.include` is only `content/**`, `hooks/**`, `shared/**`, with `all:false` — so `background/**`, `lib/export.ts`, `components/**`, `App.tsx` never enter the denominator, producing a misleadingly healthy number. Broaden `include` to all of `src`, set `all:true`, add a `coverage.thresholds` gate. (`store/**` is omitted from `include` but *does* have a test — the omission is a curated subset, not a clean tested/untested split.)
- **Export module (905 lines, 8 formats) untested** (`testing-2`, high, S): the primary output path and a security surface. Add `export.test.ts`: snapshot each format, assert HTML escaping of `message`/`description`/`fix.description`/`selector`/`url`, assert CSV neutralizes leading `=+-@`, assert PDF resolves to a non-empty Blob. Pair the escaping assertions with the `correctness-8` fix.
- **Background/service-worker layer zero tests** (`testing-1`, medium, S): the message router, badge mapping, install injection, settings CRUD — `chrome.*` is already mockable. Cover `handleMessage` routing (incl. unknown type + non-Error throw), `updateBadge`/`clearBadge` (incl. stale-color case), `onInstalled` (skips privileged URLs, swallows per-tab failure, re-runs on update), `saveSettings` merge.
- **Multi-scan partial-failure test locks the bug** (`testing-7`/`err-2`, medium, S): `useScanner.test.tsx:644-646` asserts both `error` AND `scanResult` are defined — codifying the buggy state. Fix the hook, change the test to the corrected contract, and add an App.tsx integration test asserting passing-audit issues still render. (E007 copy literally says "Check the results for successful audits" — the code contradicts itself.)
- **Zero React component tests** (`testing-6`, **[V2]**, medium, M): `@testing-library/react` is used only via `renderHook`; no component is ever `render()`ed. The documented a11y defects in §5 (modal, ScoreGauge, IssueCard) have **no regression guard**. Add tests for interactive surfaces first (FilterBar, Summary buttons, IssueDetail nav/Mark-Known, IgnoreIssueModal, AuditSelector, ExportButton/CopyDropdown, ScoreGauge), then App.tsx routing — assert behavior **and** a11y roles together.
- **No e2e / integration harness** (`testing-4`, medium, M) and **two unwired violation fixtures** (`testing-11`, medium, M): the core value — six audits against a real DOM, content-script injection, message round-trips, badge updates — is never validated end to end (everything runs in happy-dom with mocked axe + mocked sibling scanners). Both `test-site/` and `tests/fixtures/test-page.html` catalog intentional violations keyed to rule IDs — the obvious oracles, unused. Add a Playwright suite loading the built extension against `test-site/`, asserting detected rule IDs/counts, content-script injection, PING handshake, one export download.
- **happy-dom false confidence** (`testing-10`, medium, M): vision-filter/focus-order/overlay tests pass regardless of real-browser correctness (no real layout/`getBoundingClientRect`, no rendering — though happy-dom *does* parse SVG-namespaced `innerHTML`, so that specific sub-claim is moot). Move SVG-filter and layout-dependent assertions into the e2e suite; in unit tests assert structural contracts (filter id applied, `createElementNS` used) not visual correctness.
- **Content-script injection edge cases** (`testing-9`, low, M) and **storage error/quota/concurrency** (`testing-13`, low, S): untested. The latter's irony — `storage.test.ts` is 1,414 lines on the *dead* history layer while the *wired* settings store (`background/storage.ts`) and the ignore-write error paths have no tests.
- **ErrorBoundary untested** (`testing-8`, **[V2]**, low, S): add a throwing-child + reset test.

---

## 8. Prioritized Roadmap — "Start Here" Backlog

Sequenced P0→P3. Each item tagged **[NET-NEW]** or **[V2]**. Within a phase, order top-to-bottom.

### Phase 0 — Trust & correctness foundation (do before anything public-facing)

| Item | IDs | NET-NEW / V2 | Eff |
|---|---|---|---|
| Add CI (typecheck/lint/test/build on PR, Node 22) + broaden coverage config | testing-3, testing-5 | **[V2]** / **[NET-NEW]** | S |
| Fix performance CLS/TBT double-count (with perf-rel-4 — same observer orchestration) | correctness-3, perf-rel-4 | **[NET-NEW]** | S |
| Fix accuracy cluster: HttpOnly, meta-CSP, underscore-as-lodash, lazy/unsized-images, broken-manifest-passes, vuln-lib false-negative (relabel now / real later), checkConsoleErrors label | correctness-10,12,13,14,17 + unsized-img-fp, vuln-lib-fn, checkConsoleErrors (map) | **[NET-NEW]** | S each |
| Fix error-screen-unreachable (single scan) | correctness-1 | **[NET-NEW]** | S |
| Fix multi-scan data loss + correct the test that locks it | err-2/correctness-2, testing-7 | **[NET-NEW]** | S |
| Scan timeout (Promise.race→E004) + Cancel button | err-1/perf-rel-5 | **[NET-NEW]** | S |
| On-demand injection self-heal on PING failure | err-4 | **[NET-NEW]** | S |
| Escape page-derived text in HTML export (+ test) | correctness-8/secpriv-2, testing-2 | **[NET-NEW]** | S |
| Delete-or-wire the 3 dead Settings toggles | cws-6/correctness-26 | **[NET-NEW]** | S–M |
| Add background + export unit tests | testing-1, testing-2 | **[NET-NEW]** | S |

### Phase 1 — CWS launch gate

| Item | IDs | NET-NEW / V2 | Eff |
|---|---|---|---|
| Capture store screenshots + promo tiles | cws-1 | **[V2]** | S |
| Broaden listing/manifest copy to all six audits | cws-2 | **[V2]** | S |
| Reconcile privacy/store docs with code (network, storage, activeTab, scripting, host-justification) | secpriv-1,4,5,7 / cws-21,22,23 + product-surface | **[NET-NEW]** | S |
| Add LICENSE, fix version drift, fix repo/support links, single-source rule counts, mark roadmap superseded | cws-4,10,11; deadcode-10,11,12 | **[NET-NEW]** | S |
| Fix the tool's own a11y bugs (modal, AuditSelector ARIA, IssueCard, ScoreGauge, aria-live, progressbar, prefers-reduced-motion, filter aria-pressed, search label) | cws-12,13,14,15,16,17,18,19,20 | mixed (12,19,20 **[V2]**; rest **[NET-NEW]**) | S each |
| Remove false "With screenshot" label + audit-aware report titles | deadcode-13/cws-3 | **[NET-NEW]** | S |
| Surface export/copy/global async failures (toast + unhandledrejection) | err-9,10 | **[NET-NEW]** (err-10 **[V2]**) | S |

### Phase 2 — Site-owner repositioning (the heart of the ask)

| Item | IDs | NET-NEW / V2 | Eff |
|---|---|---|---|
| First-run onboarding (gated flag) + default to broader scan | ux-public-1/cws-5/feat-compet-19, ux-public-9 | **[V2]** (undesigned) / **[NET-NEW]** | S |
| Developer/Site-owner mode toggle (umbrella) | ux-public-17 | **[NET-NEW]** | L |
| Stop labeling everything WCAG (audit-type field through scanners) | ux-public-2 | **[NET-NEW]** | S |
| "Why this matters" field per issue | ux-public-3 | **[NET-NEW]** | M |
| "Top fixes" action card | ux-public-11 | **[NET-NEW]** | M |
| Lead with plain "Share report"; tuck dev formats away | ux-public-6 | **[NET-NEW]** | M |
| Plain-language severity, audit-aware success/empty copy, plain audit one-liners, score explainer, plain ignore/category/element copy | ux-public-5,7,8,13,14,15,16 | **[NET-NEW]** | S each |

### Phase 3 — Differentiators & remaining bug cleanup

| Item | IDs | NET-NEW / V2 | Eff |
|---|---|---|---|
| Promote vision simulators + focus-order to results; deep-link from contrast issues | ux-public-10 | **[NET-NEW]** | M |
| WAVE-style "show all on page" overlay (wire highlightMultiple) | feat-compet-10, deadcode-6 | **[NET-NEW]** | M |
| Eyedropper contrast checker | feat-compet-2 | **[NET-NEW]** | M |
| Real screenshot in reports; import-report; relabel | feat-compet-9,8 | **[NET-NEW]** | M/S |
| Target-the-scanned-tab fix; scoring normalization; focus-order perf+model fixes; IssueList virtualization; store hot-path memoization; drop the 1s perf wait; code-split scanners | correctness-4,24,29; perf-rel-1,2,4,6,7 | **[NET-NEW]** | S–M |
| Remaining P2 bugs (badge, SPA teardown, deprecated timing, thresholds, fixes.ts string-replace, etc.) | correctness-5,11,15,16,18,19,20,21,22,23,25,30,31,34; err-3,5,6,7,8,11,13; fixes-fragile | **[NET-NEW]** (err-7 **[V2]**) | S each |
| Wire history/trends UI (summary snapshots + size guard + diff fix) | deadcode-2/feat-compet-5, correctness-32,35 | **[V2]** | L |
| Add e2e suite wired to test-site/; component tests; ErrorBoundary test | testing-4,6,8,9,10,11,13 | mixed (6,8 **[V2]**) | M |
| Eliminate broad host access via on-demand injection (decision) | secpriv-6 | **[NET-NEW]** | M |
| Implement i18n/mobile/privacy scanners; delete `links`; remove dead code | deadcode-1,5,7,8,9,14 | deadcode-1 **[V2]**; rest **[NET-NEW]** | S–M |

### Phase 4 — Pro/team backlog (defer; dev-audience, several with permission cost)

Guided WCAG assessment (`feat-compet-1`, XL, no-perm), tab-stop walkthrough (`feat-compet-3`, M), screen-reader preview (`feat-compet-11`, M), AI fixes (`feat-compet-4`, M, **new host-permission + breaks local-only**), multi-page crawl (`feat-compet-6`, L, **tabs/host**), scheduled monitoring (`feat-compet-7`, M, **tabs/alarms/notifications**), CLI/CI product (`feat-compet-12`, XL, no-CWS-impact), perf throttling (`feat-compet-16`, XL, **debugger** — or just label scores as unthrottled, S), budgets (`feat-compet-17`), element-scoped scan (`feat-compet-13`), live preview-fix (`feat-compet-20`), theming (`deadcode-5`).

---

### Bottom line

The fastest path to a defensible public launch is not new features — it is **Phase 0 + Phase 1**: stop the tool from producing wrong numbers (including the silent vuln-lib false negative) and silent failures, then close the CWS gate and the day-one-review surface (dead toggles, WCAG mislabel, privacy-doc accuracy, the tool's own a11y bugs). Almost entirely small-effort, evidence-backed, and net-new beyond V2_PLAN. **Phase 2** then answers the actual ask correctly — by aiming at site owners rather than the literal general public — and **Phase 3** ships the visceral differentiators (vision simulators promoted, WAVE overlay, contrast picker) that distinguish WatchDog from the Lighthouse the developer already has.