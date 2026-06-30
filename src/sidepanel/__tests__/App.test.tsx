import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Issue, ScanResult, Settings } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { axe } from '@/test/a11y';

// App orchestrates five hooks plus the zustand store. We mock the hook modules so
// the test drives every view branch deterministically, and keep the REAL store so
// the child components (IssueCard, Summary, AuditSelector, …) render against the
// same persona/settings the App branch was set up with.
//
// vi.hoisted holds the mutable return values: the mock factories are hoisted above
// the imports, so they cannot close over ordinary `let` bindings (TDZ). Each test
// mutates `h.<hook>.current` before calling render().
const h = vi.hoisted(() => ({
  scanner: { current: null as any },
  issues: { current: null as any },
  highlight: { current: null as any },
  ignored: { current: null as any },
  settings: { current: null as any },
}));

vi.mock('@/sidepanel/hooks/useScanner', () => ({ useScanner: () => h.scanner.current }));
vi.mock('@/sidepanel/hooks/useIssues', () => ({ useIssues: () => h.issues.current }));
vi.mock('@/sidepanel/hooks/useHighlight', () => ({ useHighlight: () => h.highlight.current }));
vi.mock('@/sidepanel/hooks/useIgnoredIssues', () => ({
  useIgnoredIssues: () => h.ignored.current,
}));
vi.mock('@/sidepanel/hooks/useSettings', () => ({ useSettings: () => h.settings.current }));

// Imported AFTER the mocks are registered (vi.mock is hoisted, but keeping App's
// import below the mock declarations documents the dependency direction).
import App from '@/sidepanel/App';

const baseSettings: Settings = { ...DEFAULT_SETTINGS, hasSeenOnboarding: true };

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    ruleId: 'button-name',
    severity: 'critical',
    category: 'interactive',
    message: 'Button has no accessible name',
    description: 'Buttons must have discernible text.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
    wcag: { id: '4.1.2', level: 'A', name: 'Name, Role, Value', description: 'Name/role/value.' },
    element: {
      selector: 'button.submit',
      html: '<button class="submit"></button>',
      failureSummary: 'Element has no accessible name',
    },
    fix: {
      description: 'Add visible button text',
      code: '<button class="submit">Submit</button>',
      learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
    },
    ...overrides,
  };
}

function makeScanResult(issues: Issue[]): ScanResult {
  const bySeverity = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const issue of issues) bySeverity[issue.severity]++;
  return {
    url: 'https://example.com',
    timestamp: Date.now(),
    duration: 1234,
    issues,
    incomplete: [],
    summary: {
      total: issues.length,
      bySeverity,
      byCategory: {
        images: 0,
        interactive: issues.length,
        forms: 0,
        color: 0,
        document: 0,
        structure: 0,
        aria: 0,
        technical: 0,
      },
    },
  };
}

// Apply a settings object to BOTH the mocked useSettings hook and the real store,
// so App's branch logic and the child components agree on persona/onboarding.
function applySettings(settings: Settings, loaded = true) {
  h.settings.current = { settings, updateSettings: vi.fn(), loaded };
  useScanStore.setState({ settings });
}

beforeEach(() => {
  vi.clearAllMocks();

  h.scanner.current = {
    scanResult: null,
    error: null,
    scan: vi.fn(),
    scanMultiple: vi.fn(),
    cancelScan: vi.fn(),
    clearResults: vi.fn(),
    currentAuditIndex: 0,
    totalAudits: 0,
    currentAuditType: null,
  };

  h.issues.current = {
    filters: { severity: 'all', category: 'all', searchQuery: '' },
    filteredIssues: [],
    selectedIssue: null,
    view: 'list',
    adjacentIds: { prev: null, next: null },
    setFilter: vi.fn(),
    selectIssue: vi.fn(),
    goToPrevIssue: vi.fn(),
    goToNextIssue: vi.fn(),
    getCurrentIndex: vi.fn(() => -1),
    totalFiltered: 0,
  };

  h.highlight.current = {
    highlightElement: vi.fn(),
    highlightAll: vi.fn(),
    clearHighlights: vi.fn(),
  };

  h.ignored.current = {
    ignoredHashes: new Set<string>(),
    ignoredCount: 0,
    refresh: vi.fn(),
  };

  // Default: settings loaded, onboarding done → the home/audit-selector view.
  applySettings({ ...baseSettings });
  useScanStore.setState({
    isScanning: false,
    error: null,
    scanResult: null,
    selectedAuditType: 'accessibility',
    selectedAuditTypes: ['accessibility'],
    hideIgnored: true,
  });
});

describe('App view branching', () => {
  it('holds first paint behind an aria-busy shell until settings load', () => {
    applySettings({ ...baseSettings }, false);

    const { container } = render(<App />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    // The shell is empty — no header, no audit selector.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows the first-run onboarding tour when the user has not seen it', async () => {
    applySettings({ ...baseSettings, hasSeenOnboarding: false });

    render(<App />);

    expect(screen.getByText('Audit any site, right where you work.')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    // Completing the tour persists the chosen persona and dismisses onboarding.
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(h.settings.current.updateSettings).toHaveBeenCalledWith({
      persona: 'site-owner',
      hasSeenOnboarding: true,
    });
  });

  it('renders the audit selector home view with the import control', async () => {
    const { container } = render(<App />);

    expect(screen.getByRole('heading', { name: 'Choose Audit Types' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open a saved report/i })).toBeInTheDocument();
    // WatchDog itself must pass an a11y audit — assert it on the entry view.
    expect(await axe(container)).toHaveNoViolations();
  });

  it('opens and closes the settings view from the header toggle', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replay welcome tour/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('heading', { name: 'Choose Audit Types' })).toBeInTheDocument();
  });

  it('shows the scan progress view while a scan is running and can cancel it', async () => {
    useScanStore.setState({ isScanning: true });
    h.scanner.current.currentAuditType = 'accessibility';
    h.scanner.current.totalAudits = 1;

    render(<App />);

    expect(screen.getByText('Scanning Accessibility')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel scan/i }));
    expect(h.scanner.current.cancelScan).toHaveBeenCalledTimes(1);
  });

  it('renders the results list with a summary, scan announcement and rescan control', () => {
    const result = makeScanResult([makeIssue()]);
    h.scanner.current.scanResult = result;
    h.issues.current.filteredIssues = result.issues;
    h.issues.current.totalFiltered = 1;

    render(<App />);

    expect(screen.getByRole('button', { name: /^rescan$/i })).toBeInTheDocument();
    expect(screen.getByText('Button has no accessible name')).toBeInTheDocument();
    // The live region announces completion (derived during render, not via effect).
    expect(screen.getByRole('status')).toHaveTextContent('Scan complete, 1 issue found');
  });

  it('toggles the whole-page overlay for accessibility scans', async () => {
    const user = userEvent.setup();
    const result = makeScanResult([makeIssue()]);
    h.scanner.current.scanResult = result;
    h.issues.current.filteredIssues = result.issues;
    h.issues.current.totalFiltered = 1;

    render(<App />);

    const toggle = screen.getByRole('switch', { name: /show all issues on the page/i });
    await user.click(toggle);
    expect(h.highlight.current.highlightAll).toHaveBeenCalledWith([
      { selector: 'button.submit', severity: 'critical' },
    ]);

    // Toggling the same switch off clears the on-page highlights.
    await user.click(screen.getByRole('switch', { name: /show all issues on the page/i }));
    expect(h.highlight.current.clearHighlights).toHaveBeenCalled();
  });

  it('shows the no-issues empty state and rescans the prior single audit', async () => {
    const result = makeScanResult([]);
    h.scanner.current.scanResult = result;
    h.issues.current.filteredIssues = [];

    render(<App />);

    expect(screen.getByText('No Issues Found!')).toBeInTheDocument();
    expect(screen.getByText(/no accessibility problems found/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /scan again/i }));
    // selectedAuditTypes is ['accessibility'] (length 1) → single rescan.
    expect(h.scanner.current.scan).toHaveBeenCalledWith('accessibility');
  });

  it('shows a full-screen error state when a scan fails with no results', async () => {
    h.scanner.current.error = 'Cannot scan browser internal pages';
    h.scanner.current.scanResult = null;

    render(<App />);

    const retry = screen.getByRole('button', { name: /try again/i });
    expect(retry).toBeInTheDocument();
    // No partial-failure banner when there are no results.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await userEvent.click(retry);
    expect(h.scanner.current.scan).toHaveBeenCalled();
  });

  it('shows a non-blocking partial-failure banner when some audits fail but results exist', () => {
    const result = makeScanResult([makeIssue()]);
    h.scanner.current.scanResult = result;
    h.scanner.current.error = 'Some audits failed: seo: timeout';
    h.issues.current.filteredIssues = result.issues;
    h.issues.current.totalFiltered = 1;

    render(<App />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('Some audits failed: seo: timeout');
    // Results are still shown alongside the banner.
    expect(screen.getByText('Button has no accessible name')).toBeInTheDocument();
  });
});

describe('App scan launching', () => {
  it('starts a single scan when one audit is selected (developer default)', async () => {
    // Developer persona seeds the audit selector with accessibility only (1 audit).
    applySettings({ ...baseSettings, persona: 'developer' });

    render(<App />);

    const start = screen.getByRole('button', { name: /start accessibility scan/i });
    await userEvent.click(start);
    expect(h.scanner.current.scan).toHaveBeenCalledWith('accessibility');
    expect(h.scanner.current.scanMultiple).not.toHaveBeenCalled();
  });

  it('starts a multi-scan when several audits are selected (site-owner default)', async () => {
    // Site-owner persona seeds all six audits → the multi-scan path.
    render(<App />);

    const start = screen.getByRole('button', { name: /start full audit/i });
    await userEvent.click(start);
    expect(h.scanner.current.scanMultiple).toHaveBeenCalledTimes(1);
    expect(h.scanner.current.scanMultiple.mock.calls[0][0]).toHaveLength(6);
  });
});

describe('App detail view', () => {
  it('renders the issue detail view when an issue is selected', () => {
    const result = makeScanResult([makeIssue()]);
    h.scanner.current.scanResult = result;
    h.issues.current.view = 'detail';
    h.issues.current.selectedIssue = result.issues[0];
    h.issues.current.totalFiltered = 1;
    h.issues.current.getCurrentIndex = vi.fn(() => 0);

    render(<App />);

    // The detail view exposes a back control and the issue's message. The app
    // logo/banner is intentionally NOT stacked above IssueDetail's own header
    // bar (which already carries the back control + "Issue X of N").
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByText('Button has no accessible name')).toBeInTheDocument();
  });
});
