import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Issue, Severity } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { axe } from '@/test/a11y';
import IssueDetail from '../IssueDetail';

const mockIssue: Issue = {
  id: 'issue-1',
  ruleId: 'button-name',
  severity: 'critical',
  category: 'interactive',
  message: 'Button has no accessible name',
  description: 'Buttons must have discernible text that screen readers can announce.',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
  wcag: {
    id: '4.1.2',
    level: 'A',
    name: 'Name, Role, Value',
    description: 'For all UI components the name and role can be programmatically determined.',
  },
  element: {
    selector: 'button.submit',
    html: '<button class="submit">Submit</button>',
    failureSummary: 'Fix any of the following: Element has no accessible name',
  },
  fix: {
    description: 'Add visible button text',
    code: '<button class="submit" aria-label="Submit">Submit</button>',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
  },
};

function renderDetail(overrides: Partial<ComponentProps<typeof IssueDetail>> = {}) {
  const onBack = vi.fn();
  const onPrev = vi.fn();
  const onNext = vi.fn();
  const onHighlight = vi.fn();
  const onIgnored = vi.fn();
  const result = render(
    <IssueDetail
      issue={mockIssue}
      url="https://example.com"
      currentIndex={0}
      totalCount={5}
      onBack={onBack}
      onPrev={onPrev}
      onNext={onNext}
      onHighlight={onHighlight}
      onIgnored={onIgnored}
      hasPrev={false}
      hasNext={true}
      {...overrides}
    />
  );
  return { ...result, onBack, onPrev, onNext, onHighlight, onIgnored };
}

describe('IssueDetail', () => {
  beforeEach(() => {
    // The store defaults to Site-owner; reset before each test so a developer-mode
    // case can't leak into the others.
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('renders the message, description and How-to-Fix copy', () => {
    renderDetail();

    expect(screen.getByRole('heading', { name: mockIssue.message })).toBeInTheDocument();
    expect(screen.getByText(mockIssue.description)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How to fix' })).toBeInTheDocument();
    expect(screen.getByText(mockIssue.fix.description)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderDetail();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the issue position in both header and footer', () => {
    renderDetail({ currentIndex: 2, totalCount: 7 });

    expect(screen.getByText('Issue 3 of 7')).toBeInTheDocument();
    expect(screen.getByText('3 of 7')).toBeInTheDocument();
  });

  it.each<[Severity, string]>([
    ['critical', 'Critical'],
    ['serious', 'Serious'],
    ['moderate', 'Moderate'],
    ['minor', 'Minor'],
  ])('renders the %s severity badge label', (severity, label) => {
    renderDetail({ issue: { ...mockIssue, severity } });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // --- Why this matters ----------------------------------------------------

  it('shows the "Why this matters" block when the scanner supplied copy', () => {
    const whyItMatters = 'Visitors using a screen reader cannot tell what this button does.';
    renderDetail({ issue: { ...mockIssue, whyItMatters } });

    expect(screen.getByText('WHY THIS MATTERS')).toBeInTheDocument();
    expect(screen.getByText(whyItMatters)).toBeInTheDocument();
  });

  it('omits the "Why this matters" block when absent', () => {
    renderDetail();
    expect(screen.queryByText('WHY THIS MATTERS')).not.toBeInTheDocument();
  });

  // --- Standard / WCAG display ---------------------------------------------

  it('labels an accessibility issue with its WCAG criterion and level', () => {
    renderDetail({ issue: { ...mockIssue, standard: 'wcag' } });

    expect(screen.getByText('STANDARD')).toBeInTheDocument();
    expect(screen.getByText(/WCAG 4\.1\.2/)).toBeInTheDocument();
    expect(screen.getByText('Level A')).toBeInTheDocument();
  });

  it('treats a legacy issue without a standard as accessibility (WCAG)', () => {
    renderDetail(); // mockIssue has no `standard`

    expect(screen.getByText('STANDARD')).toBeInTheDocument();
    expect(screen.getByText(/WCAG 4\.1\.2/)).toBeInTheDocument();
    expect(screen.getByText('Level A')).toBeInTheDocument();
  });

  it('labels a non-accessibility issue with a neutral standard, not WCAG', () => {
    renderDetail({ issue: { ...mockIssue, standard: 'performance' } });

    expect(screen.getByText('Performance metric')).toBeInTheDocument();
    expect(screen.queryByText(/WCAG/)).not.toBeInTheDocument();
  });

  // --- Suggested Fix code block --------------------------------------------

  it('renders the Suggested Fix code block when fix.code is present', () => {
    renderDetail({ issue: { ...mockIssue, standard: 'performance' } });

    expect(screen.getByRole('heading', { name: 'Suggested Fix' })).toBeInTheDocument();
    // The copy affordance is offered for the suggested fix (showCopy).
    expect(screen.getByRole('button', { name: /copy fix/i })).toBeInTheDocument();
  });

  it('omits the Suggested Fix section when fix.code is empty', () => {
    renderDetail({ issue: { ...mockIssue, fix: { ...mockIssue.fix, code: '' } } });

    expect(screen.queryByRole('heading', { name: 'Suggested Fix' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy fix/i })).not.toBeInTheDocument();
  });

  // --- Navigation ----------------------------------------------------------

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const { onBack } = renderDetail();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('disables Previous when there is no previous issue', () => {
    renderDetail({ hasPrev: false });
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('enables Previous and calls onPrev when there is a previous issue', async () => {
    const user = userEvent.setup();
    const { onPrev } = renderDetail({ hasPrev: true });

    const prev = screen.getByRole('button', { name: /previous/i });
    expect(prev).toBeEnabled();
    await user.click(prev);

    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('disables Next when there is no next issue and calls onNext otherwise', async () => {
    const user = userEvent.setup();
    const { onNext } = renderDetail({ hasNext: true });

    const next = screen.getByRole('button', { name: /next/i });
    expect(next).toBeEnabled();
    await user.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);

    renderDetail({ hasNext: false });
    expect(screen.getAllByRole('button', { name: /next/i }).at(-1)).toBeDisabled();
  });

  // --- Highlight & color-blindness preview ---------------------------------

  it('hides the Highlight controls when highlighting is not possible', () => {
    renderDetail({ canHighlight: false, issue: { ...mockIssue, category: 'color' } });

    expect(screen.queryByRole('button', { name: /^highlight$/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /preview color blindness/i })
    ).not.toBeInTheDocument();
  });

  it('calls onHighlight when the Highlight button is clicked', async () => {
    const user = userEvent.setup();
    const { onHighlight } = renderDetail({ canHighlight: true });

    await user.click(screen.getByRole('button', { name: /highlight/i }));

    expect(onHighlight).toHaveBeenCalledTimes(1);
  });

  it('offers the color-blindness preview only for color issues that can be highlighted', () => {
    renderDetail({ canHighlight: true, issue: { ...mockIssue, ruleId: 'color-contrast' } });

    const preview = screen.getByRole('button', { name: /preview color blindness/i });
    expect(preview).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not offer the preview for a non-color issue', () => {
    renderDetail({ canHighlight: true });

    expect(
      screen.queryByRole('button', { name: /preview color blindness/i })
    ).not.toBeInTheDocument();
  });

  it('toggles the color-blindness preview, flipping its pressed state and label', async () => {
    const user = userEvent.setup();
    renderDetail({ canHighlight: true, issue: { ...mockIssue, category: 'color' } });

    const preview = screen.getByRole('button', { name: /preview color blindness/i });
    await user.click(preview);

    const stop = await screen.findByRole('button', { name: /stop preview/i });
    expect(stop).toHaveAttribute('aria-pressed', 'true');
    // The store now carries a colour-vision-deficiency mode.
    expect(useScanStore.getState().settings.visionMode).toBe('deuteranopia');

    await user.click(stop);
    expect(screen.getByRole('button', { name: /preview color blindness/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  // --- Site-owner vs developer presentation --------------------------------

  it('leads with the plain descriptor and hides raw markup behind a toggle in site-owner mode', async () => {
    const user = userEvent.setup();
    renderDetail();

    // Plain descriptor, not raw HTML, up front.
    expect(screen.getByText('the "Submit" button')).toBeInTheDocument();
    expect(screen.queryByText(mockIssue.element.html)).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /show code/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    expect(screen.getByText(mockIssue.element.html)).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName(/hide code/i);
  });

  it('labels the ignore action "Mark as known" in site-owner mode', () => {
    renderDetail();
    expect(screen.getByRole('button', { name: /mark as known/i })).toBeInTheDocument();
  });

  it('shows raw markup directly and offers no code toggle in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderDetail();

    expect(screen.getByText(mockIssue.element.html)).toBeInTheDocument();
    expect(screen.queryByText('the "Submit" button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show code/i })).not.toBeInTheDocument();
  });

  it('labels the ignore action "Hide" in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderDetail();

    expect(screen.getByRole('button', { name: /^hide$/i })).toBeInTheDocument();
  });

  // --- Developer axe metadata ----------------------------------------------

  it('shows axe provenance (impact + tags) in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderDetail({ issue: { ...mockIssue, impact: 'serious', tags: ['wcag2aa', 'wcag143'] } });

    expect(screen.getByText(/impact: serious/i)).toBeInTheDocument();
    expect(screen.getByText(/wcag143/)).toBeInTheDocument();
  });

  it('shows the measured contrast for a contrast issue in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderDetail({
      issue: {
        ...mockIssue,
        contrast: { fg: '#8a8a8a', bg: '#16161a', ratio: 2.8, required: 4.5 },
      },
    });

    expect(screen.getByText(/ratio 2\.8:1/)).toBeInTheDocument();
  });

  it('hides the developer axe metadata in site-owner mode', () => {
    renderDetail({
      issue: {
        ...mockIssue,
        impact: 'serious',
        contrast: { fg: '#8a8a8a', bg: '#16161a', ratio: 2.8, required: 4.5 },
      },
    });

    expect(screen.queryByText(/impact: serious/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ratio 2\.8:1/)).not.toBeInTheDocument();
  });

  // --- Ignore modal --------------------------------------------------------

  it('opens the ignore modal when the ignore action is clicked', async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /mark as known/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Hide this issue')).toBeInTheDocument();
  });

  it('closes the ignore modal via its Cancel control', async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(screen.getByRole('button', { name: /mark as known/i }));
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
