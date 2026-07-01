import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/a11y';
import { Switch } from '../switch';

describe('Switch', () => {
  it('renders a switch role with default unchecked state', async () => {
    const { container } = render(<Switch aria-label="Toggle setting" />);
    const sw = screen.getByRole('switch');

    expect(sw).toBeInTheDocument();
    expect(sw).toHaveAttribute('data-slot', 'switch');
    expect(sw).toHaveAttribute('data-state', 'unchecked');
    expect(sw).not.toBeChecked();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the thumb element', () => {
    render(<Switch aria-label="Toggle setting" />);
    const sw = screen.getByRole('switch');
    const thumb = sw.querySelector('[data-slot="switch-thumb"]');

    expect(thumb).not.toBeNull();
  });

  it('reflects a controlled checked state', () => {
    render(<Switch aria-label="Toggle setting" checked onCheckedChange={vi.fn()} />);
    const sw = screen.getByRole('switch');

    expect(sw).toBeChecked();
    expect(sw).toHaveAttribute('data-state', 'checked');
  });

  it('fires onCheckedChange with the new value when clicked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle setting" onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('switch'));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles back to false from a controlled checked state', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle setting" checked onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('switch'));

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('toggles via keyboard (Space)', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle setting" onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole('switch');
    sw.focus();
    expect(sw).toHaveFocus();
    await user.keyboard(' ');

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not fire onCheckedChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle setting" disabled onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    await user.click(sw);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('merges a custom className onto the root', () => {
    render(<Switch aria-label="Toggle setting" className="custom-switch" />);
    const sw = screen.getByRole('switch');

    expect(sw).toHaveClass('custom-switch');
    // Base classes are still applied.
    expect(sw).toHaveClass('peer');
  });

  it('forwards arbitrary props to the underlying root', () => {
    render(<Switch aria-label="Toggle setting" id="notify-toggle" name="notify" />);
    const sw = screen.getByRole('switch');

    expect(sw).toHaveAttribute('id', 'notify-toggle');
  });

  it('supports an uncontrolled defaultChecked state', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle setting" defaultChecked onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole('switch');
    expect(sw).toBeChecked();
    await user.click(sw);

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('has no accessibility violations when checked', async () => {
    const { container } = render(
      <Switch aria-label="Toggle setting" checked onCheckedChange={vi.fn()} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
