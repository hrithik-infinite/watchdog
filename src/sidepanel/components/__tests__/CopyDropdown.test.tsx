import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopyDropdown from '../CopyDropdown';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Issue, ScanResult } from '@/shared/types';

const mockIssue: Issue = {
  id: 'issue-1',
  ruleId: 'button-name',
  severity: 'critical',
  category: 'interactive',
  message: 'Button has no accessible name',
  description: 'Buttons must have discernible text.',
  helpUrl: 'https://example.com/button-name',
  wcag: { id: '4.1.2', level: 'A', name: 'Name, Role, Value', description: 'Name and role.' },
  element: { selector: 'button.submit', html: '<button></button>', failureSummary: 'No name' },
  fix: {
    description: 'Add text',
    code: '<button>Go</button>',
    learnMoreUrl: 'https://example.com',
  },
};

const scanResult: ScanResult = {
  url: 'https://example.com',
  timestamp: 0,
  duration: 0,
  issues: [mockIssue],
  incomplete: [],
  summary: {
    total: 1,
    bySeverity: { critical: 1, serious: 0, moderate: 0, minor: 0 },
    byCategory: {
      images: 0,
      interactive: 1,
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
  render(<CopyDropdown issues={[mockIssue]} scanResult={scanResult} auditType="accessibility" />);
  await user.click(screen.getByRole('button', { name: /copy all/i }));
}

beforeEach(() => {
  useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('CopyDropdown — site-owner mode', () => {
  it('leads with the plain summary and tucks dev formats under Advanced', async () => {
    await openMenu();

    const labels = screen.getAllByRole('menuitem').map((el) => el.textContent ?? '');
    expect(labels[0]).toContain('Copy summary');

    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Copy as Markdown')).toBeInTheDocument();
    expect(screen.getByText('Copy for GitHub')).toBeInTheDocument();

    // The plain-text format is relabelled, so the developer wording is gone.
    expect(screen.queryByText('Copy as Plain Text')).not.toBeInTheDocument();
  });
});

describe('CopyDropdown — developer mode', () => {
  beforeEach(() => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
  });

  it('keeps the original technical menu without an Advanced section', async () => {
    await openMenu();

    expect(screen.getByText('Copy as Markdown')).toBeInTheDocument();
    expect(screen.getByText('Copy as Plain Text')).toBeInTheDocument();
    expect(screen.getByText('Copy for GitHub')).toBeInTheDocument();

    expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
    expect(screen.queryByText('Copy summary')).not.toBeInTheDocument();
  });
});
