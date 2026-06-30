import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/a11y';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu';

/**
 * Renders a fairly complete menu so a single open covers Content, Group, Item
 * (both variants + inset), Label, Separator, Shortcut, CheckboxItem,
 * RadioGroup/RadioItem and the Sub* trigger.
 */
function FullMenu({
  onSelect,
  defaultOpen = false,
}: {
  onSelect?: () => void;
  defaultOpen?: boolean;
}) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Section</DropdownMenuLabel>
        <DropdownMenuLabel inset>Inset section</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSelect}>Default item</DropdownMenuItem>
          <DropdownMenuItem inset>Inset item</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Checkbox on</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="a">
          <DropdownMenuRadioItem value="a">Radio A</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="b">Radio B</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Sub item</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('renders the trigger and keeps content closed by default', () => {
    render(<FullMenu />);

    const trigger = screen.getByRole('button', { name: /open menu/i });
    expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the menu on trigger click and renders every item slot', async () => {
    const user = userEvent.setup();
    render(<FullMenu />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAttribute('data-slot', 'dropdown-menu-content');

    // Label (plain + inset)
    const insetLabel = screen.getByText('Inset section');
    expect(insetLabel).toHaveAttribute('data-slot', 'dropdown-menu-label');
    expect(insetLabel).toHaveAttribute('data-inset', 'true');

    // Items: default + inset + destructive variant
    const defaultItem = screen.getByText('Default item');
    expect(defaultItem).toHaveAttribute('data-slot', 'dropdown-menu-item');
    expect(defaultItem).toHaveAttribute('data-variant', 'default');

    expect(screen.getByText('Inset item')).toHaveAttribute('data-inset', 'true');

    const destructive = screen.getByText(/delete/i);
    expect(destructive).toHaveAttribute('data-variant', 'destructive');

    // Shortcut
    expect(screen.getByText('⌘⌫')).toHaveAttribute('data-slot', 'dropdown-menu-shortcut');

    // Checkbox + radio items
    expect(screen.getByRole('menuitemcheckbox', { name: /checkbox on/i })).toHaveAttribute(
      'data-slot',
      'dropdown-menu-checkbox-item'
    );
    const radioA = screen.getByRole('menuitemradio', { name: /radio a/i });
    expect(radioA).toHaveAttribute('data-slot', 'dropdown-menu-radio-item');
    expect(radioA).toHaveAttribute('aria-checked', 'true');

    // Sub trigger
    expect(screen.getByText('More')).toHaveAttribute('data-slot', 'dropdown-menu-sub-trigger');
  });

  it('respects defaultOpen and applies a custom className to content', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem>Only item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass('custom-content');
    expect(within(menu).getByText('Only item')).toBeInTheDocument();
  });

  it('fires onSelect when an item is activated', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FullMenu onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(await screen.findByText('Default item'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation to open and move through items', async () => {
    const user = userEvent.setup();
    render(<FullMenu />);

    const trigger = screen.getByRole('button', { name: /open menu/i });
    trigger.focus();
    await user.keyboard('{Enter}');

    await screen.findByRole('menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Opening with the keyboard focuses the first item; ArrowDown advances.
    expect(screen.getByText('Default item')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Inset item')).toHaveFocus();
  });

  it('renders disabled items that do not trigger selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={onSelect}>
            Disabled item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = await screen.findByText('Disabled item');
    expect(item).toHaveAttribute('data-disabled');

    await user.click(item);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the separator as a non-interactive divider', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Top</DropdownMenuItem>
          <DropdownMenuSeparator data-testid="sep" />
          <DropdownMenuItem>Bottom</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const sep = await screen.findByTestId('sep');
    expect(sep).toHaveAttribute('data-slot', 'dropdown-menu-separator');
    expect(sep).toHaveClass('bg-border');
  });

  it('forwards custom classNames to checkbox, radio and shortcut slots', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem className="cb-class" checked={false}>
            Cb
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="x">
            <DropdownMenuRadioItem className="rd-class" value="x">
              Rd
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuItem>
            Item
            <DropdownMenuShortcut className="sc-class">K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(await screen.findByRole('menuitemcheckbox')).toHaveClass('cb-class');
    expect(screen.getByRole('menuitemradio')).toHaveClass('rd-class');
    expect(screen.getByText('K')).toHaveClass('sc-class');
  });

  it('has no accessibility violations on the open menu content', async () => {
    render(<FullMenu defaultOpen />);
    // Scope axe to the menu content: with the menu open Radix marks the rest of
    // the tree aria-hidden while leaving the (intentionally) focusable trigger,
    // which axe flags as aria-hidden-focus — an artifact of the open state, not
    // of this wrapper's markup.
    const menu = await screen.findByRole('menu');
    expect(await axe(menu)).toHaveNoViolations();
  });
});
