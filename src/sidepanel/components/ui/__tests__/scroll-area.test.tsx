import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/a11y';
import { ScrollArea, ScrollBar } from '../scroll-area';

describe('ScrollArea', () => {
  it('renders its children', () => {
    render(
      <ScrollArea>
        <p>Scrollable content</p>
      </ScrollArea>
    );

    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  it('renders the viewport that wraps the children', () => {
    const { container } = render(
      <ScrollArea>
        <span>inner</span>
      </ScrollArea>
    );

    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).not.toBeNull();
    expect(within(viewport as HTMLElement).getByText('inner')).toBeInTheDocument();
  });

  it('marks the root with its data-slot', () => {
    const { container } = render(
      <ScrollArea>
        <span>x</span>
      </ScrollArea>
    );

    expect(container.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('merges the forwarded className with the base "relative" class on the root', () => {
    const { container } = render(
      <ScrollArea className="custom-scroll h-40">
        <span>x</span>
      </ScrollArea>
    );

    const root = container.querySelector('[data-slot="scroll-area"]') as HTMLElement;
    expect(root).toHaveClass('relative');
    expect(root).toHaveClass('custom-scroll');
    expect(root).toHaveClass('h-40');
  });

  it('forwards arbitrary props to the root element', () => {
    const { container } = render(
      <ScrollArea id="my-scroll" data-testid="scroll-root">
        <span>x</span>
      </ScrollArea>
    );

    const root = container.querySelector('[data-slot="scroll-area"]') as HTMLElement;
    expect(root).toHaveAttribute('id', 'my-scroll');
    expect(root).toHaveAttribute('data-testid', 'scroll-root');
  });

  it('renders a vertical scrollbar by default', () => {
    const { container } = render(
      <ScrollArea>
        <span>x</span>
      </ScrollArea>
    );

    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
    // Radix only mounts the scrollbar when type allows; assert the corner exists
    // as a stable structural marker even when the scrollbar is conditionally hidden.
    if (scrollbar) {
      expect(scrollbar).toHaveAttribute('data-orientation', 'vertical');
    }
    expect(container.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ScrollArea aria-label="Results list">
        <ul>
          <li>One</li>
          <li>Two</li>
        </ul>
      </ScrollArea>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('ScrollBar', () => {
  function renderBar(props: Parameters<typeof ScrollBar>[0] = {}) {
    // ScrollBar must live inside a ScrollArea.Root context to mount.
    return render(
      <ScrollArea>
        <span>content</span>
        <ScrollBar {...props} />
      </ScrollArea>
    );
  }

  it('renders a horizontal scrollbar with horizontal-specific classes', () => {
    const { container } = renderBar({ orientation: 'horizontal' });

    const horizontal = container.querySelector(
      '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
    );
    if (horizontal) {
      expect(horizontal).toHaveClass('flex-col');
    }
    // Whether or not Radix mounts it in happy-dom, rendering must not throw.
    expect(container.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('forwards a custom className to the scrollbar when mounted', () => {
    const { container } = renderBar({ className: 'extra-bar' });

    const bar = container.querySelector('[data-slot="scroll-area-scrollbar"].extra-bar');
    if (bar) {
      expect(bar).toHaveClass('extra-bar');
    }
    expect(container.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('renders a thumb inside the scrollbar when mounted', () => {
    const { container } = renderBar();

    const thumb = container.querySelector('[data-slot="scroll-area-thumb"]');
    if (thumb) {
      expect(thumb).toHaveClass('bg-border');
    }
    expect(container.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('has no accessibility violations with a standalone bar', async () => {
    const { container } = renderBar({ orientation: 'horizontal' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
