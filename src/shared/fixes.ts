import type { ElementInfo, FixSuggestion } from './types';
import type { RuleId } from './constants';

// Fix suggestion templates for each rule
const FIX_TEMPLATES: Record<RuleId, (element: ElementInfo) => FixSuggestion> = {
  'image-alt': (el) => ({
    description: 'Add descriptive alt text that conveys the image content',
    code: el.html.replace('<img', '<img alt="[Describe what the image shows]"'),
    learnMoreUrl: 'https://webaim.org/techniques/alttext/',
  }),

  'button-name': (el) => ({
    description: 'Add text content or aria-label to the button',
    code: el.html.includes('aria-label')
      ? el.html
      : el.html.replace('>', ' aria-label="[Button purpose]">'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
  }),

  'link-name': (el) => ({
    description: 'Add descriptive text content to the link',
    code: el.html.includes('aria-label') ? el.html : el.html.replace('</a>', '[Link text]</a>'),
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
${el.html.replace('<input', '<input id="input-id"')}`,
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
    code: el.html.replace(/tabindex=["']\d+["']/, 'tabindex="0"'),
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
    code: el.html.replace('>', ' tabindex="0" role="region" aria-label="Scrollable content">'),
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
    code: el.html.replace('autoplay', '').replace('muted', 'controls'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/no-autoplay-audio',
  }),

  'object-alt': (el) => ({
    description: 'Provide alternative text for object elements',
    code: el.html.replace('</object>', 'Alternative content describing the object</object>'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/object-alt',
  }),

  'svg-img-alt': (el) => ({
    description: 'Add accessible name to SVG with role="img"',
    code: el.html.includes('aria-label')
      ? el.html
      : el.html.replace('<svg', '<svg role="img" aria-label="[Description of SVG]"'),
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
    code: el.html.replace(/scope=["'][^"']*["']/, 'scope="col"'),
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
    code: el.html.replace('<input', '<input alt="[Button purpose]"'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/input-image-alt',
  }),

  'select-name': (el) => ({
    description: 'Add an accessible name to the select element',
    code: `<label for="select-id">Label text</label>
${el.html.replace('<select', '<select id="select-id"')}`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/select-name',
  }),

  'autocomplete-valid': (el) => ({
    description: 'Use valid autocomplete attribute values',
    code: `/* Valid autocomplete values: */
/* name, email, tel, address-line1, postal-code, etc. */
${el.html.replace(/autocomplete=["'][^"']*["']/, 'autocomplete="email"')}`,
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/autocomplete-valid',
  }),

  // Frames
  'frame-title': (el) => ({
    description: 'Add a title attribute to the iframe',
    code: el.html.replace('<iframe', '<iframe title="[Description of frame content]"'),
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
export function generateFix(ruleId: string, element: ElementInfo): FixSuggestion {
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
