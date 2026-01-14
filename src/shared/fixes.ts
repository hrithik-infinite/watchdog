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
