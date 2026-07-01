import axeCore, { type AxeResults, type RunOptions } from 'axe-core';
import { expect } from 'vitest';

/**
 * Component-level a11y assertions, reusing the same axe-core the extension ships
 * (no extra dependency, and the same engine version users get). Mirrors the
 * jest-axe ergonomics: `expect(await axe(container)).toHaveNoViolations()`.
 *
 * happy-dom has no real layout / CSS box model, so rules that need painted
 * geometry (contrast ratios, hit-target sizes, scrollable focus) can't be
 * decided here — axe reports them as "incomplete", never "violation". We disable
 * them so assertions are deterministic and only cover what a DOM-only env can
 * actually judge: roles, accessible names, labels, alt text, ARIA, structure.
 * The visual rules are exercised instead by the real-browser Playwright E2E and
 * by the live axe scan the extension performs on the page under audit.
 */
const LAYOUT_DEPENDENT_RULES = [
  'color-contrast',
  'target-size',
  'scrollable-region-focusable',
] as const;

const BASE_OPTIONS: RunOptions = {
  rules: Object.fromEntries(LAYOUT_DEPENDENT_RULES.map((id) => [id, { enabled: false }])),
  resultTypes: ['violations'],
};

/** Run axe over a rendered container and return the raw results. */
export async function axe(
  container: Element | Document,
  options: RunOptions = {}
): Promise<AxeResults> {
  return axeCore.run(container, {
    ...BASE_OPTIONS,
    ...options,
    rules: { ...BASE_OPTIONS.rules, ...options.rules },
  });
}

function formatViolations(results: AxeResults): string {
  return results.violations
    .map((v) => {
      const targets = v.nodes.map((n) => `      - ${n.target.join(' ')}`).join('\n');
      return `  [${v.impact ?? 'n/a'}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${targets}`;
    })
    .join('\n\n');
}

interface CustomMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

declare module 'vitest' {
  // `T = any` must match Vitest's and jest-dom's own `Assertion<T = any>`
  // declarations exactly, or TS errors that the type parameters differ.
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toHaveNoViolations(received: AxeResults) {
    const pass = received.violations.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? 'Expected accessibility violations, but found none.'
          : `Expected no accessibility violations, but found ${received.violations.length}:\n\n${formatViolations(
              received
            )}`,
    };
  },
});
