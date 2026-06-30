import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/a11y';
import { Label } from '../label';

describe('Label', () => {
  it('renders its children', () => {
    render(<Label>Email address</Label>);

    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('exposes the data-slot hook for styling', () => {
    render(<Label>Slot</Label>);

    expect(screen.getByText('Slot')).toHaveAttribute('data-slot', 'label');
  });

  it('associates with a control via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    );

    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
    // The association is real: querying by label text resolves the input.
    expect(screen.getByLabelText('Email')).toBe(screen.getByRole('textbox'));
  });

  it('merges a caller className with the base classes', () => {
    render(<Label className="custom-class">Styled</Label>);

    const label = screen.getByText('Styled');
    expect(label).toHaveClass('custom-class');
    // A base class from the component is preserved alongside the custom one.
    expect(label).toHaveClass('font-medium');
  });

  it('forwards arbitrary props to the underlying element', () => {
    render(
      <Label id="my-label" data-testid="label-el" aria-label="hidden name">
        Forwarded
      </Label>
    );

    const label = screen.getByTestId('label-el');
    expect(label).toHaveAttribute('id', 'my-label');
    expect(label).toHaveAttribute('aria-label', 'hidden name');
  });

  it('forwards click handlers and clicking moves focus to the bound control', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Label htmlFor="name" onClick={onClick}>
          Name
        </Label>
        <input id="name" />
      </>
    );

    await user.click(screen.getByText('Name'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('renders with no children without crashing', () => {
    const { container } = render(<Label data-testid="empty" />);

    expect(screen.getByTestId('empty')).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <Label htmlFor="field">Field label</Label>
        <input id="field" />
      </>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
