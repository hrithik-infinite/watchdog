import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { ScanResult } from '@/shared/types';
import { exportHTML } from '@/sidepanel/lib/export';
import { useScanStore } from '@/sidepanel/store';
import ExportButton from '../ExportButton';

// Stub the export module so a failure can be simulated without touching the real
// pdf-lib/Blob machinery. Each export becomes a no-op the error test overrides.
vi.mock('@/sidepanel/lib/export', () => ({
  exportJSON: vi.fn(),
  exportCSV: vi.fn(),
  exportHTML: vi.fn(),
  exportPDF: vi.fn(),
}));

const scanResult: ScanResult = {
  url: 'https://example.com',
  timestamp: 0,
  duration: 0,
  issues: [],
  incomplete: [],
  summary: {
    total: 0,
    bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
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
  },
};

async function openMenu() {
  const user = userEvent.setup();
  render(<ExportButton scanResult={scanResult} />);
  await user.click(screen.getByRole('button', { name: /export/i }));
}

beforeEach(() => {
  // Default install is site-owner; tests opt into developer mode explicitly.
  useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

afterEach(() => {
  // Drop any one-shot throwing implementation so it can't leak between tests.
  vi.resetAllMocks();
});

describe('ExportButton — site-owner mode', () => {
  it('leads with the shareable formats and tucks JSON/CSV under Advanced', async () => {
    await openMenu();

    const labels = screen.getAllByRole('menuitem').map((el) => el.textContent ?? '');
    expect(labels[0]).toContain('Share report');
    expect(labels[1]).toContain('Printable report');

    // Developer formats are demoted under an Advanced section but still reachable.
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(labels.some((l) => l.includes('JSON'))).toBe(true);
    expect(labels.some((l) => l.includes('CSV'))).toBe(true);

    // The raw "HTML"/"PDF" jargon titles are replaced with plain labels.
    expect(screen.queryByText('HTML')).not.toBeInTheDocument();
  });
});

describe('ExportButton — developer mode', () => {
  beforeEach(() => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
  });

  it('keeps the original technical menu without an Advanced section', async () => {
    await openMenu();

    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();

    expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
    expect(screen.queryByText('Share report')).not.toBeInTheDocument();
  });
});

describe('ExportButton — export failure surfacing (err-10)', () => {
  // Regression: a thrown export (e.g. pdf-lib rejecting a non-WinAnsi character)
  // was only console.error'd, so the user clicked Export and saw nothing. The
  // failure must now show up in the UI.
  it('shows an inline alert with the failure detail when an export throws', async () => {
    vi.mocked(exportHTML).mockImplementationOnce(() => {
      throw new Error('Pretend pdf-lib failure');
    });

    const user = userEvent.setup();
    render(<ExportButton scanResult={scanResult} />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    // Selecting an item closes the (modal) menu, which removes the aria-hidden it
    // puts on the rest of the app, so the alert below is queryable by role.
    await user.click(screen.getByRole('menuitem', { name: /share report/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn't export as html/i);
    expect(alert).toHaveTextContent('Pretend pdf-lib failure');
  });

  it('lets the user dismiss the error', async () => {
    vi.mocked(exportHTML).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const user = userEvent.setup();
    render(<ExportButton scanResult={scanResult} />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: /share report/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /dismiss export error/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
