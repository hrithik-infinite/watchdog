import type { RuleId } from './constants';
import type { ElementInfo, FixSuggestion } from './types';

// ---------------------------------------------------------------------------
// Robust HTML edit helpers
//
// The fix CODE we emit is the user's own markup with a single, targeted edit.
// Naive String.replace() on raw HTML is fragile: a `>` or a tag name can appear
// inside an attribute value, and String.replace only rewrites the FIRST match —
// so the edit can land inside a quoted value and produce garbled, invalid HTML
// (e.g. `<button data-x="3 > 2">` had its attribute split in two). These helpers
// find the real structural position with quote awareness and return null when
// they can't, so callers fall back to an instructional snippet instead of broken
// markup.
// ---------------------------------------------------------------------------

// Index of the `>` that terminates the first element's opening tag, skipping any
// `>` that sits inside a quoted attribute value. Returns -1 if there is no
// well-formed opening tag.
function findOpeningTagEnd(html: string): number {
  const start = html.indexOf('<');
  if (start === -1) return -1;
  let quote: '"' | "'" | null = null;
  for (let i = start + 1; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i;
    }
  }
  return -1;
}

// Insert ` attr` into the opening tag, just before its closing `>` (or before the
// `/` of a self-closing `/>`). Returns null when no opening tag is found so the
// caller can fall back rather than emit broken HTML.
function addAttributeToOpeningTag(html: string, attr: string): string | null {
  const end = findOpeningTagEnd(html);
  if (end === -1) return null;
  const selfClose = html[end - 1] === '/';
  const insertAt = selfClose ? end - 1 : end;
  const before = html.slice(0, insertAt).replace(/\s+$/, '');
  const after = html.slice(insertAt);
  return `${before} ${attr.trim()}${selfClose ? ' ' : ''}${after}`;
}

// Insert text content immediately before the element's FINAL closing tag. Uses
// lastIndexOf so a `</tag>` that appears earlier inside an attribute value can't
// be mistaken for the real closing tag. Returns null if there is no closing tag.
function addTextBeforeClosingTag(html: string, tagName: string, text: string): string | null {
  const closing = `</${tagName}>`;
  const idx = html.lastIndexOf(closing);
  if (idx === -1) return null;
  return `${html.slice(0, idx)}${text}${html.slice(idx)}`;
}

// Remove a boolean attribute (e.g. `autoplay`) from the opening tag without
// touching the same word when it appears inside another attribute's name or
// value (e.g. class="autoplay-banner"). The attribute is matched only when it
// begins at a whitespace boundary and ends at a tag/attribute boundary.
function removeBooleanAttribute(html: string, attrName: string): string {
  const end = findOpeningTagEnd(html);
  const limit = end === -1 ? html.length : end + 1;
  const head = html.slice(0, limit);
  const tail = html.slice(limit);
  const re = new RegExp(`\\s${attrName}(="[^"]*"|='[^']*'|=\\S+)?(?=[\\s/>])`, 'gi');
  return head.replace(re, '') + tail;
}

// Ensure a boolean attribute (e.g. `controls`) is present on the opening tag,
// adding it only when it is not already a standalone attribute.
function ensureBooleanAttribute(html: string, attrName: string): string {
  const re = new RegExp(`\\s${attrName}(?=[\\s/>=])`, 'i');
  if (re.test(html)) return html;
  return addAttributeToOpeningTag(html, attrName) ?? html;
}

// Replace the value of a specific attribute, matching the attribute name only at
// a whitespace/string-start boundary so `data-${name}` or `${name}-foo` can't be
// hit by mistake. No-op (returns html unchanged) if the attribute is absent.
function replaceAttributeValue(html: string, attrName: string, newValue: string): string {
  const re = new RegExp(`(^|\\s)${attrName}=(["'])[^"']*\\2`, 'i');
  return html.replace(re, `$1${attrName}="${newValue}"`);
}

// ---------------------------------------------------------------------------
// Color-contrast helpers
//
// When axe gives us the measured foreground/background colors, we can emit a
// concrete, copy-pasteable fix: the offending color and a suggested replacement
// that actually clears the required ratio — rendered as a diff. The math is the
// WCAG relative-luminance formula; suggestAccessibleColor walks the foreground
// toward black or white (whichever raises contrast) until it passes.
// ---------------------------------------------------------------------------

type RGB = { r: number; g: number; b: number };

function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    }
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => Number.parseFloat(p.trim()));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }
  return null;
}

function toHex({ r, g, b }: RGB): string {
  const channel = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function lerp(a: RGB, b: RGB, t: number): RGB {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

/** Contrast ratio between two CSS colors, or null if either can't be parsed. */
export function contrastRatioBetween(a: string, b: string): number | null {
  const ra = parseColor(a);
  const rb = parseColor(b);
  return ra && rb ? ratio(ra, rb) : null;
}

/**
 * Suggest a foreground color that meets `required` contrast against `bg`,
 * starting from `fg` and moving toward black or white (whichever raises
 * contrast). Returns a hex string, or null if the inputs can't be parsed.
 */
export function suggestAccessibleColor(fg: string, bg: string, required = 4.5): string | null {
  const fgRgb = parseColor(fg);
  const bgRgb = parseColor(bg);
  if (!fgRgb || !bgRgb) return null;
  if (ratio(fgRgb, bgRgb) >= required) return toHex(fgRgb);
  // Push toward white on a dark background, toward black on a light one.
  const target: RGB =
    relativeLuminance(bgRgb) < 0.5 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  for (let t = 0.05; t <= 1; t += 0.05) {
    const candidate = lerp(fgRgb, target, t);
    if (ratio(candidate, bgRgb) >= required) return toHex(candidate);
  }
  return toHex(target);
}

// Fix suggestion templates for each rule
const FIX_TEMPLATES: Record<RuleId, (element: ElementInfo) => FixSuggestion> = {
  'image-alt': (el) => ({
    description: 'Add descriptive alt text that conveys the image content',
    code:
      addAttributeToOpeningTag(el.html, 'alt="[Describe what the image shows]"') ??
      '<img src="..." alt="[Describe what the image shows]">',
    learnMoreUrl: 'https://webaim.org/techniques/alttext/',
  }),

  'button-name': (el) => ({
    description: 'Add text content or aria-label to the button',
    code: el.html.includes('aria-label')
      ? el.html
      : (addAttributeToOpeningTag(el.html, 'aria-label="[Button purpose]"') ??
        '<button aria-label="[Button purpose]"></button>'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
  }),

  'link-name': (el) => ({
    description: 'Add descriptive text content to the link',
    code: el.html.includes('aria-label')
      ? el.html
      : (addTextBeforeClosingTag(el.html, 'a', '[Link text]') ?? '<a href="...">[Link text]</a>'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/link-name',
  }),

  'color-contrast': () => ({
    description: 'Increase contrast ratio to at least 4.5:1 for normal text',
    code: `/* Current contrast is too low */
/* Suggested fixes: */
/* 1. Darken text color */
/* 2. Lighten background */
/* 3. Increase font size to 18px+ (large text needs 3:1) */`,
    learnMoreUrl: 'https://webaim.org/resources/contrastchecker/',
  }),

  label: (el) => ({
    description: 'Associate a label with the input using for/id or wrapping',
    code: `<label for="input-id">Label text</label>
${addAttributeToOpeningTag(el.html, 'id="input-id"') ?? el.html}`,
    learnMoreUrl: 'https://webaim.org/techniques/forms/controls',
  }),

  'html-has-lang': () => ({
    description: 'Add a lang attribute to the html element',
    code: '<html lang="en">',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/html-has-lang',
  }),

  'document-title': () => ({
    description: 'Add a descriptive title to the page',
    code: '<title>Page Title - Site Name</title>',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/document-title',
  }),

  'heading-order': (el) => ({
    description: 'Ensure headings follow a logical order without skipping levels',
    code: `/* Current: ${el.html} */
/* Headings should follow order: h1 → h2 → h3 → h4 */
/* Don't skip from h1 to h3 */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
  }),

  region: (el) => ({
    description: 'Wrap content in landmark regions (main, nav, header, footer, etc.)',
    code: `<main>
  ${el.html}
</main>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/region',
  }),

  'aria-valid-attr': (el) => ({
    description: 'Fix or remove invalid ARIA attributes',
    code: `/* Review and fix ARIA attributes in: */
${el.html}
/* Valid ARIA attributes: aria-label, aria-labelledby, aria-describedby, etc. */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-valid-attr',
  }),

  'aria-required-attr': (el) => ({
    description: 'Add required ARIA attributes for the element role',
    code: `/* Add missing required ARIA attributes: */
${el.html}
/* Check WAI-ARIA spec for required attributes */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-required-attr',
  }),

  'aria-roles': (el) => ({
    description: 'Use a valid ARIA role value',
    code: `/* Current: ${el.html} */
/* Use valid roles: button, link, navigation, main, etc. */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-roles',
  }),

  'meta-viewport': () => ({
    description: 'Allow users to zoom by removing maximum-scale and user-scalable=no',
    code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/meta-viewport',
  }),

  tabindex: (el) => ({
    description: 'Use tabindex="0" or "-1" instead of positive values',
    // Boundary-anchored so a `data-tabindex` (or similar) can't be hit instead of
    // the real tabindex attribute; quote group preserves the original quote style.
    code: el.html.replace(/(^|\s)tabindex=(["'])\d+\2/i, '$1tabindex="0"'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/tabindex',
  }),

  'duplicate-id': (el) => ({
    description: 'Ensure all id attributes are unique on the page',
    code: `/* Current: ${el.html} */
/* Change the id to be unique: id="unique-identifier" */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/duplicate-id',
  }),

  // Navigation & Focus
  bypass: () => ({
    description: 'Add a skip link to bypass repetitive content',
    code: `<!-- Add at the beginning of the page -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Add id to main content -->
<main id="main-content">
  <!-- Page content -->
</main>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/bypass',
  }),

  'scrollable-region-focusable': (el) => ({
    description: 'Make scrollable regions keyboard accessible with tabindex',
    code:
      addAttributeToOpeningTag(
        el.html,
        'tabindex="0" role="region" aria-label="Scrollable content"'
      ) ?? '<div tabindex="0" role="region" aria-label="Scrollable content">...</div>',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/scrollable-region-focusable',
  }),

  'frame-focusable-content': (el) => ({
    description: 'Ensure iframe content is keyboard accessible',
    code: `/* Review iframe content for keyboard accessibility: */
${el.html}
/* Ensure all interactive elements inside are focusable */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/frame-focusable-content',
  }),

  'focus-order-semantics': (el) => ({
    description: 'Ensure focus order follows a logical sequence',
    code: `/* Current: ${el.html} */
/* Remove tabindex > 0 and ensure DOM order matches visual order */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/focus-order-semantics',
  }),

  // Media & Multimedia
  'video-caption': () => ({
    description: 'Add captions to video content',
    code: `<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
</video>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/video-caption',
  }),

  'audio-caption': () => ({
    description: 'Provide a transcript for audio content',
    code: `<!-- Include a transcript link or inline transcript -->
<audio controls src="audio.mp3"></audio>
<a href="transcript.html">Read transcript</a>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/audio-caption',
  }),

  'no-autoplay-audio': (el) => ({
    description: 'Remove autoplay or provide controls to pause audio',
    // Drop the real autoplay attribute (not a substring inside class/id) and make
    // sure controls is present; the old word-replace mangled `class="autoplay-*"`.
    code: ensureBooleanAttribute(removeBooleanAttribute(el.html, 'autoplay'), 'controls'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/no-autoplay-audio',
  }),

  'object-alt': (el) => ({
    description: 'Provide alternative text for object elements',
    code:
      addTextBeforeClosingTag(el.html, 'object', 'Alternative content describing the object') ??
      '<object data="...">Alternative content describing the object</object>',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/object-alt',
  }),

  'svg-img-alt': (el) => ({
    description: 'Add accessible name to SVG with role="img"',
    code: el.html.includes('aria-label')
      ? el.html
      : (addAttributeToOpeningTag(el.html, 'role="img" aria-label="[Description of SVG]"') ??
        '<svg role="img" aria-label="[Description of SVG]"></svg>'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/svg-img-alt',
  }),

  // Tables
  'td-headers-attr': () => ({
    description: 'Use headers attribute to associate data cells with headers',
    code: `<table>
  <tr>
    <th id="name">Name</th>
    <th id="age">Age</th>
  </tr>
  <tr>
    <td headers="name">John</td>
    <td headers="age">30</td>
  </tr>
</table>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/td-headers-attr',
  }),

  'th-has-data-cells': () => ({
    description: 'Ensure table headers have associated data cells',
    code: `/* Review table structure */
/* Each <th> should have at least one <td> associated with it */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/th-has-data-cells',
  }),

  'scope-attr-valid': (el) => ({
    description: 'Use valid scope values: row, col, rowgroup, colgroup',
    // Boundary-anchored so a `data-scope` attribute isn't rewritten instead of scope.
    code: replaceAttributeValue(el.html, 'scope', 'col'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/scope-attr-valid',
  }),

  'table-fake-caption': () => ({
    description: 'Use <caption> element instead of fake caption cells',
    code: `<table>
  <caption>Table description</caption>
  <tr>
    <th>Header 1</th>
    <th>Header 2</th>
  </tr>
</table>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/table-fake-caption',
  }),

  // Structure & Semantics
  'definition-list': (el) => ({
    description: 'Ensure definition lists only contain dt and dd elements',
    code: `<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
/* Current: ${el.html} */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/definition-list',
  }),

  list: (el) => ({
    description: 'Ensure lists only contain li elements',
    code: `<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
/* Current: ${el.html} */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/list',
  }),

  listitem: (el) => ({
    description: 'Ensure list items are inside ul or ol elements',
    code: `<ul>
  ${el.html}
</ul>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/listitem',
  }),

  'nested-interactive': (el) => ({
    description: 'Remove nested interactive elements',
    code: `/* Current: ${el.html} */
/* Don't nest buttons inside links or links inside buttons */
/* Bad: <a href="#"><button>Click</button></a> */
/* Good: <a href="#">Click</a> or <button>Click</button> */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/nested-interactive',
  }),

  // Forms
  'input-image-alt': (el) => ({
    description: 'Add alt text to image input buttons',
    code:
      addAttributeToOpeningTag(el.html, 'alt="[Button purpose]"') ??
      '<input type="image" alt="[Button purpose]">',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/input-image-alt',
  }),

  'select-name': (el) => ({
    description: 'Add an accessible name to the select element',
    code: `<label for="select-id">Label text</label>
${addAttributeToOpeningTag(el.html, 'id="select-id"') ?? el.html}`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/select-name',
  }),

  'autocomplete-valid': (el) => ({
    description: 'Use valid autocomplete attribute values',
    code: `/* Valid autocomplete values: */
/* name, email, tel, address-line1, postal-code, etc. */
${replaceAttributeValue(el.html, 'autocomplete', 'email')}`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/autocomplete-valid',
  }),

  // Frames
  'frame-title': (el) => ({
    description: 'Add a title attribute to the iframe',
    code:
      addAttributeToOpeningTag(el.html, 'title="[Description of frame content]"') ??
      '<iframe title="[Description of frame content]"></iframe>',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/frame-title',
  }),

  // Language
  'valid-lang': (el) => ({
    description: 'Use a valid BCP 47 language code',
    code: `/* Current: ${el.html} */
/* Use valid language codes: en, en-US, es, fr, de, zh, ja, etc. */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/valid-lang',
  }),

  // Deprecated elements
  marquee: (el) => ({
    description: 'Replace <marquee> with CSS animations',
    code: `/* Replace: ${el.html} */
/* With CSS animation: */
<div class="scroll-text">Content</div>
<style>
.scroll-text {
  animation: scroll 10s linear infinite;
}
@keyframes scroll {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
</style>`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/marquee',
  }),

  blink: (el) => ({
    description: 'Remove <blink> element - it is deprecated and causes accessibility issues',
    code: `/* Remove: ${el.html} */
/* Blinking content can trigger seizures and is distracting */
/* If attention is needed, use static styling instead */`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/blink',
  }),
};

// Generate fix suggestion for a rule
export function generateFix(
  ruleId: string,
  element: ElementInfo,
  contrast?: { fg: string; bg: string; ratio: number; required: number }
): FixSuggestion {
  // When axe measured the actual colors, emit a concrete diff: the offending
  // color out, a computed passing color in.
  if (ruleId === 'color-contrast' && contrast) {
    const suggested = suggestAccessibleColor(contrast.fg, contrast.bg, contrast.required);
    if (suggested && suggested.toLowerCase() !== contrast.fg.toLowerCase()) {
      const newRatio = contrastRatioBetween(suggested, contrast.bg);
      return {
        description: newRatio
          ? `Raise the text contrast to at least ${contrast.required}:1. ${suggested} on ${contrast.bg} computes to ${newRatio.toFixed(1)}:1.`
          : `Raise the text contrast to at least ${contrast.required}:1.`,
        code: `- color: ${contrast.fg};\n+ color: ${suggested};`,
        learnMoreUrl: 'https://webaim.org/resources/contrastchecker/',
      };
    }
  }

  const template = FIX_TEMPLATES[ruleId as RuleId];
  if (template) {
    return template(element);
  }
  return {
    description: 'See documentation for fix guidance',
    code: '',
    learnMoreUrl: `https://dequeuniversity.com/rules/axe/4.4/${ruleId}`,
  };
}
