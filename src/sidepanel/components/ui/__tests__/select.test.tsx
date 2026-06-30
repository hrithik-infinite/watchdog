import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/a11y';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select';

// A reusable closed Select with a placeholder. Radix Select content is portal
// and pointer driven, so the listbox cannot be opened reliably in happy-dom.
// These tests assert the always-rendered trigger/value surface instead.
function renderSelect(
  props: {
    triggerProps?: React.ComponentProps<typeof SelectTrigger>;
    rootProps?: React.ComponentProps<typeof Select>;
    placeholder?: string;
  } = {}
) {
  const { triggerProps, rootProps, placeholder = 'Pick a severity' } = props;
  return render(
    <Select {...rootProps}>
      <SelectTrigger aria-label="Severity" {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Severity</SelectLabel>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="serious">Serious</SelectItem>
          <SelectSeparator />
          <SelectItem value="minor" disabled>
            Minor
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

describe('Select (Radix wrapper)', () => {
  it('renders the trigger as a combobox with its accessible name', () => {
    renderSelect();

    const trigger = screen.getByRole('combobox', { name: 'Severity' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
  });

  it('shows the placeholder text while no value is selected', () => {
    renderSelect({ placeholder: 'Choose one' });

    expect(screen.getByText('Choose one')).toBeInTheDocument();
    // Trigger is in the placeholder (empty value) state.
    expect(screen.getByRole('combobox')).toHaveAttribute('data-placeholder');
  });

  it('defaults the trigger to the "default" size', () => {
    renderSelect();

    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'default');
  });

  it('applies the "sm" size when requested', () => {
    renderSelect({ triggerProps: { 'aria-label': 'Severity', size: 'sm' } });

    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm');
  });

  it('merges a custom className onto the trigger', () => {
    renderSelect({ triggerProps: { 'aria-label': 'Severity', className: 'my-trigger' } });

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('my-trigger');
    // The wrapper's own base classes are preserved alongside the override.
    expect(trigger.className).toContain('rounded-md');
  });

  it('disables the trigger when the disabled prop is set', () => {
    renderSelect({ triggerProps: { 'aria-label': 'Severity', disabled: true } });

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('reflects the selected value on the closed trigger', () => {
    renderSelect({ rootProps: { defaultValue: 'critical' } });

    const trigger = screen.getByRole('combobox', { name: 'Severity' });
    // A concrete value clears the placeholder state.
    expect(trigger).not.toHaveAttribute('data-placeholder');
    expect(within(trigger).getByText('Critical')).toBeInTheDocument();
  });

  it('renders a chevron icon inside the trigger', () => {
    const { container } = renderSelect();

    // The ChevronDownIcon is rendered as an inline svg within the trigger.
    expect(container.querySelector('[data-slot="select-trigger"] svg')).not.toBeNull();
  });

  it('has no accessibility violations on the rendered trigger', async () => {
    const { container } = renderSelect();

    expect(await axe(container)).toHaveNoViolations();
  });
});
