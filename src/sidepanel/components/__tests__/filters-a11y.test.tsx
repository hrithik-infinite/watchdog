import type { ComponentProps } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Summary from '../Summary';
import FilterBar from '../FilterBar';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import { SEVERITY_PLAIN } from '@/sidepanel/lib/persona';
import type { Category, ScanResult, ScanSummary } from '@/shared/types';

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

// Build a scan result whose summary marks only the given categories as present.
function makeScanResult(present: Category[]): ScanResult {
  const byCategory = {
    images: 0,
    interactive: 0,
    forms: 0,
    color: 0,
    document: 0,
    structure: 0,
    aria: 0,
    technical: 0,
  } as Record<Category, number>;
  for (const category of present) byCategory[category] = 1;
  return {
    url: 'https://example.com',
    timestamp: 0,
    duration: 0,
    issues: [],
    incomplete: [],
    summary: {
      total: present.length,
      bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      byCategory,
    },
  };
}

beforeEach(() => {
  // Reset persona (defaults to site-owner) and clear any scan from prior tests.
  useScanStore.setState({ settings: { ...DEFAULT_SETTINGS }, scanResult: null });
});

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
    render(<Summary summary={summary} activeSeverity="critical" onFilterBySeverity={vi.fn()} />);

    // Only the active severity button is pressed.
    const pressed = screen.getByRole('button', { pressed: true });
    expect(pressed).toHaveAccessibleName(/Critical/);

    // The remaining three severity buttons are unpressed.
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3);
  });

  it('marks no severity button as pressed when filter is "all"', () => {
    render(<Summary summary={summary} activeSeverity="all" onFilterBySeverity={vi.fn()} />);

    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
    // Only the four severity toggles expose aria-pressed; the score explainer
    // control is a plain button and is excluded from this count.
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4);
  });

  it('exposes a focusable, labelled score explainer control (ux-public-7)', () => {
    render(<Summary summary={summary} activeSeverity="all" onFilterBySeverity={vi.fn()} />);

    const explainer = screen.getByRole('button', { name: /how the score is calculated/i });
    expect(explainer).toBeInTheDocument();
    // It must not become a toggle (no aria-pressed) so it stays out of the
    // severity-filter semantics.
    expect(explainer).not.toHaveAttribute('aria-pressed');
  });

  it('shows plain-language severity subtitles in Site-owner mode (ux-public-5)', () => {
    render(<Summary summary={summary} activeSeverity="all" onFilterBySeverity={vi.fn()} />);

    expect(screen.getByText(SEVERITY_PLAIN.critical)).toBeInTheDocument();
    expect(screen.getByText(SEVERITY_PLAIN.minor)).toBeInTheDocument();
  });

  it('omits the plain subtitles in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    render(<Summary summary={summary} activeSeverity="all" onFilterBySeverity={vi.fn()} />);

    expect(screen.queryByText(SEVERITY_PLAIN.critical)).toBeNull();
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

  it('hides the category filter when 0 or 1 category is present (ux-public-14)', () => {
    useScanStore.setState({ scanResult: makeScanResult(['images']) });
    renderFilterBar();

    // The "Category" control label should not render when there is nothing to
    // filter by; the "Severity" control remains.
    expect(screen.queryByText('Category')).toBeNull();
    expect(screen.getByText('Severity')).toBeInTheDocument();
  });

  it('shows the category filter when multiple categories are present', () => {
    useScanStore.setState({ scanResult: makeScanResult(['images', 'forms']) });
    renderFilterBar();

    expect(screen.getByText('Category')).toBeInTheDocument();
  });
});
