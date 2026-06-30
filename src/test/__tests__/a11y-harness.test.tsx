import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../a11y';

// Locks the a11y harness itself: the globally-registered matcher must flag a
// real violation and pass clean markup. If this breaks, every component a11y
// assertion in the suite is suspect.
describe('a11y harness', () => {
  it('flags markup with a missing accessible name', async () => {
    const { container } = render(
      <div>
        {/* biome-ignore lint/a11y/useAltText: intentional violation under test */}
        <img src="logo.png" />
      </div>
    );

    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations.some((v) => v.id === 'image-alt')).toBe(true);
  });

  it('passes clean, accessible markup via the matcher', async () => {
    const { container } = render(
      <main>
        <h1>Title</h1>
        <img src="logo.png" alt="Company logo" />
        <button type="button">Save</button>
      </main>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not flag layout-dependent rules that happy-dom cannot decide', async () => {
    // Low-contrast text would be a color-contrast violation in a real browser,
    // but that rule is disabled in the harness (no layout in happy-dom), so the
    // structural-only check must still pass.
    const { container } = render(
      <p style={{ color: '#eee', background: '#fff' }}>Hard to read but structurally fine</p>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
