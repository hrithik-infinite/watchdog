# Chrome Web Store assets (cws-1)

The image assets the Web Store listing needs. **Screenshots must be captured from
the running extension** — they can't be generated from code, so this directory
holds the spec and a checklist; drop the captured PNGs in `screenshots/` and
`promo/` as named below.

> Why this is a launch gate: the Web Store **requires at least one screenshot**
> to publish. Everything else here is optional or only used for featuring.

## Requirements (as of this writing — verify against the current CWS docs)

| Asset | Size | Format | Required? |
|---|---|---|---|
| Screenshot | **1280×800** or 640×400 | PNG (24-bit, no alpha) or JPEG | **Yes — at least 1, up to 5** |
| Small promo tile | **440×280** | PNG/JPEG | Optional (CWS auto-generates one if absent) |
| Marquee promo tile | **1400×560** | PNG/JPEG | Only if you want to be eligible for featuring |
| Store icon | 128×128 | PNG | Already shipped (`icons/icon-128.png`) |

Use **1280×800** for screenshots (sharper than 640×400). Keep one consistent
size across all of them.

## The shots to capture (showcase the site-owner experience)

Capture in **Site-owner mode** (the default) unless noted — that's the audience
the listing targets. Suggested order tells a story from install to fix:

1. **`01-onboarding.png`** — the first-run tour (persona picker + "nothing is
   uploaded"). Sells the positioning in one frame.
2. **`02-audit-selector.png`** — the audit chooser in site-owner mode: plain
   one-liners ("Does your site load fast?") with all six audits selected.
3. **`03-results-overview.png`** — a results screen showing the score gauge and
   the **Top fixes** card at the top.
4. **`04-issue-list.png`** — the issue list with plain-language cards (severity
   chips, plain element descriptors, "why this matters").
5. **`05-issue-detail.png`** — one issue opened: "Why this matters", the plain
   element descriptor with **Highlight**, and the fix.
6. **`06-on-page-highlight.png`** — the extension highlighting a real element on
   a page (the visual overlay), or a vision simulator applied to a page.

Pick the **strongest 5** (the publish max) — 1, 3, 4, 5, and either 2 or 6.

## How to capture

1. `npm run build`, then load `dist/` as an unpacked extension at
   `chrome://extensions` (Developer mode on).
2. Open the side panel on a content-rich public page (a real marketing/site page
   shows better than a blank test page). Avoid pages with personal data.
3. Size the browser window so the side panel renders at a clean width, then use
   an OS/window screenshot (⌘⇧4 on macOS, drag the panel region) **or** capture
   the panel and pad/scale to exactly 1280×800.
4. For the on-page highlight shot, capture the page + panel together so the
   highlighted element and its issue are both visible.
5. Export as 24-bit PNG **without an alpha channel** (CWS rejects alpha on some
   asset slots). Crop/letterbox to the exact target size.

## Directory layout

```
store-assets/
  README.md          (this file)
  screenshots/       1280×800 captures — 01..06 above
  promo/             440×280 small tile, 1400×560 marquee (optional)
```

## Checklist before submitting

- [ ] ≥ 1 screenshot at exactly 1280×800 (or 640×400), PNG without alpha
- [ ] Screenshots show **site-owner mode** and the Phase-2 surfaces (Top fixes,
      plain cards, why-it-matters)
- [ ] No personal data / private pages visible in any capture
- [ ] (Optional) 440×280 small tile and 1400×560 marquee in `promo/`
- [ ] Listing copy matches `docs/watchdog_description.txt`
