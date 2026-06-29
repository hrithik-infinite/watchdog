import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportButton from '../ExportButton';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { ScanResult } from '@/shared/types';

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
