import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Summary from '../Summary';
import FilterBar from '../FilterBar';
import type { ScanSummary } from '@/shared/types';

const summary: ScanSummary = {
  total: 10,
  bySeverity: { critical: 1, serious: 2, moderate: 3, minor: 4 },
  byCategory: {
    images: 0,
    interactive: 0,
    forms: 0,
    color: 0,
    document: 0,
    structure: 0,
    aria: 0,
    technical: 0,
  },
};

function renderFilterBar(overrides: Partial<ComponentProps<typeof FilterBar>> = {}) {
  const props: ComponentProps<typeof FilterBar> = {
    severityFilter: 'all',
    categoryFilter: 'all',
    searchQuery: '',
    hideIgnored: false,
    ignoredCount: 3,
    onSeverityChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onSearchChange: vi.fn(),
    onHideIgnoredChange: vi.fn(),
    ...overrides,
  };
  return render(<FilterBar {...props} />);
}

describe('Summary severity filter accessibility (cws-19)', () => {
  it('reflects the active severity via aria-pressed', () => {
    render(
      <Summary summary={summary} activeSeverity="critical" onFilterBySeverity={vi.fn()} />
    );

    // Only the active severity button is pressed.
    const pressed = screen.getByRole('button', { pressed: true });
    expect(pressed).toHaveAccessibleName(/Critical/);

    // The remaining three severity buttons are unpressed.
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3);
  });

  it('marks no severity button as pressed when filter is "all"', () => {
    render(<Summary summary={summary} activeSeverity="all" onFilterBySeverity={vi.fn()} />);

    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4);
  });
});

describe('FilterBar accessibility (cws-19, cws-20)', () => {
  it('gives the search input an accessible name', () => {
    renderFilterBar();

    expect(screen.getByRole('textbox', { name: 'Search issues' })).toBeInTheDocument();
  });

  it('reflects the hide-ignored toggle state via aria-pressed', () => {
    const { rerender } = renderFilterBar({ hideIgnored: false });

    const toggle = screen.getByRole('button', { name: /known issue/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <FilterBar
        severityFilter="all"
        categoryFilter="all"
        searchQuery=""
        hideIgnored
        ignoredCount={3}
        onSeverityChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onSearchChange={vi.fn()}
        onHideIgnoredChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /known issue/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
