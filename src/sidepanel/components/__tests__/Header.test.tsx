import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { ScanResult } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { axe } from '@/test/a11y';
import Header from '../Header';

const mockScanResult: ScanResult = {
  url: 'https://example.com',
  timestamp: 1_700_000_000_000,
  duration: 1234,
  issues: [],
  incomplete: [],
  summary: {
    total: 0,
    bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    byCategory: {} as ScanResult['summary']['byCategory'],
  },
};

describe('Header', () => {
  beforeEach(() => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('renders the WatchDog title and logo by default', () => {
    render(<Header />);

    expect(screen.getByRole('heading', { name: 'WatchDog' })).toBeInTheDocument();
    // No back button and no settings button by default.
    expect(
      screen.queryByRole('button', { name: /back to audit selector/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('has no accessibility violations in its default state', async () => {
    const { container } = render(<Header />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the back button when showBackButton is true and onBackClick is provided', () => {
    render(<Header showBackButton onBackClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Back to audit selector' })).toBeInTheDocument();
  });

  it('does not show the back button when showBackButton is true but onBackClick is missing', () => {
    render(<Header showBackButton />);

    expect(
      screen.queryByRole('button', { name: /back to audit selector/i })
    ).not.toBeInTheDocument();
  });

  it('does not show the back button when onBackClick is provided but showBackButton is false', () => {
    render(<Header onBackClick={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: /back to audit selector/i })
    ).not.toBeInTheDocument();
  });

  it('fires onBackClick when the back button is clicked', () => {
    const onBackClick = vi.fn();
    render(<Header showBackButton onBackClick={onBackClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to audit selector' }));

    expect(onBackClick).toHaveBeenCalledTimes(1);
  });

  it('renders the settings button only when onSettingsClick is provided', () => {
    const { rerender } = render(<Header />);
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();

    rerender(<Header onSettingsClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('fires onSettingsClick when the settings button is clicked', () => {
    const onSettingsClick = vi.fn();
    render(<Header onSettingsClick={onSettingsClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });

  it('renders the export control when a scanResult is supplied', () => {
    render(<Header scanResult={mockScanResult} />);

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('does not render the export control when scanResult is null', () => {
    render(<Header scanResult={null} />);

    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
  });

  it('does not render the export control when scanResult is omitted', () => {
    render(<Header />);

    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
  });

  it('renders back, settings, and export controls together with no a11y violations', async () => {
    const { container } = render(
      <Header
        showBackButton
        onBackClick={vi.fn()}
        onSettingsClick={vi.fn()}
        scanResult={mockScanResult}
      />
    );

    expect(screen.getByRole('button', { name: 'Back to audit selector' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
