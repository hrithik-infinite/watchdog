import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/a11y';
import { Separator } from '../separator';

describe('Separator', () => {
  it('renders a horizontal, decorative separator by default', () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');

    expect(separator).not.toBeNull();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    // Decorative separators expose role="none" (no semantic role).
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('renders a vertical separator when orientation is "vertical"', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');

    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('exposes a separator role when not decorative', () => {
    const { getByRole } = render(<Separator decorative={false} />);
    const separator = getByRole('separator');

    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('sets aria-orientation on a non-decorative vertical separator', () => {
    const { getByRole } = render(<Separator decorative={false} orientation="vertical" />);
    const separator = getByRole('separator');

    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('forwards a custom className while keeping the base classes', () => {
    const { container } = render(<Separator className="my-custom-class" />);
    const separator = container.querySelector('[data-slot="separator"]');

    expect(separator).toHaveClass('my-custom-class');
    expect(separator).toHaveClass('bg-border');
    expect(separator).toHaveClass('shrink-0');
  });

  it('forwards arbitrary props such as id and data attributes', () => {
    const { container } = render(<Separator id="sep-1" data-testid="sep" />);
    const separator = container.querySelector('[data-slot="separator"]');

    expect(separator).toHaveAttribute('id', 'sep-1');
    expect(separator).toHaveAttribute('data-testid', 'sep');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Separator decorative={false} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when decorative', async () => {
    const { container } = render(<Separator />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
