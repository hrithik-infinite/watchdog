import type { ComponentProps } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import IssueCard from '../IssueCard';
import type { Issue } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';

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
    html: '<button class="submit"></button>',
    failureSummary: 'Fix any of the following: Element has no accessible name',
  },
  fix: {
    description: 'Add visible button text',
    code: '<button class="submit">Submit</button>',
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.7/button-name',
  },
};

function renderCard(overrides: Partial<ComponentProps<typeof IssueCard>> = {}) {
  const onSelect = vi.fn();
  const onHighlight = vi.fn();
  const { container } = render(
    <IssueCard
      issue={mockIssue}
      isSelected={false}
      onSelect={onSelect}
      onHighlight={onHighlight}
      {...overrides}
    />
  );
  return { onSelect, onHighlight, container };
}

// The activatable card is a role="button" with tabindex=0. In Site-owner mode a
// real <button> "Show code" toggle is rendered as a sibling, so there can be two
// elements with the button role — pick the activatable region by its tabindex.
function getCardRegion(): HTMLElement {
  const region = screen
    .getAllByRole('button')
    .find((el) => el.getAttribute('tabindex') === '0');
  if (!region) throw new Error('activatable card region not found');
  return region;
}

describe('IssueCard', () => {
  beforeEach(() => {
    // The store defaults to Site-owner; reset before each test so a developer-mode
    // case can't leak into the others.
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('activates the card when Space is pressed', () => {
    const { onSelect } = renderCard();
    const card = getCardRegion();

    fireEvent.keyDown(card, { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockIssue.id);
  });

  it('prevents the default scroll behavior when Space activates the card', () => {
    renderCard();
    const card = getCardRegion();

    const spaceEvent = createEvent.keyDown(card, { key: ' ' });
    fireEvent(card, spaceEvent);

    expect(spaceEvent.defaultPrevented).toBe(true);
  });

  it('still activates the card when Enter is pressed', () => {
    const { onSelect } = renderCard();
    const card = getCardRegion();

    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockIssue.id);
  });

  it('does not activate the card for unrelated keys', () => {
    const { onSelect } = renderCard();
    const card = getCardRegion();

    fireEvent.keyDown(card, { key: 'a' });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the "Learn more" link outside the role="button" region', () => {
    renderCard();
    const card = getCardRegion();
    const link = screen.getByRole('link', { name: /learn more/i });

    // The activatable element must NOT contain a nested interactive control
    // (axe nested-interactive).
    expect(card).not.toContainElement(link);
    expect(card.contains(link)).toBe(false);
  });

  it('keeps the "Learn more" link accessible without altering its labeling', () => {
    renderCard();
    const link = screen.getByRole('link', { name: 'Learn more →' });

    expect(link).toHaveAttribute('href', mockIssue.helpUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('selects the issue when the card region is clicked', () => {
    const { onSelect } = renderCard();
    const card = getCardRegion();

    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith(mockIssue.id);
  });

  it('does not select the issue when the "Learn more" link is clicked', () => {
    const { onSelect } = renderCard();
    const link = screen.getByRole('link', { name: /learn more/i });

    fireEvent.click(link);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('labels accessibility issues with their WCAG criterion', () => {
    renderCard({ issue: { ...mockIssue, standard: 'wcag' } });

    expect(screen.getByText(/WCAG 4\.1\.2/)).toBeInTheDocument();
    expect(screen.getByText(/Level A/)).toBeInTheDocument();
  });

  it('labels a non-accessibility issue with a neutral standard, not "WCAG"', () => {
    renderCard({ issue: { ...mockIssue, standard: 'performance' } });

    expect(screen.getByText('Performance metric')).toBeInTheDocument();
    expect(screen.queryByText(/WCAG/)).not.toBeInTheDocument();
  });

  it('treats a legacy issue without a standard as accessibility (WCAG)', () => {
    renderCard(); // mockIssue has no `standard`

    expect(screen.getByText(/WCAG 4\.1\.2/)).toBeInTheDocument();
  });

  it('auto-highlights on hover when enabled and highlighting is possible', () => {
    const { onHighlight, container } = renderCard({ canHighlight: true, autoHighlight: true });

    fireEvent.mouseEnter(container.firstChild as Element);

    expect(onHighlight).toHaveBeenCalled();
  });

  it('does not auto-highlight on hover when the setting is off', () => {
    const { onHighlight, container } = renderCard({ canHighlight: true, autoHighlight: false });

    fireEvent.mouseEnter(container.firstChild as Element);

    expect(onHighlight).not.toHaveBeenCalled();
  });

  // --- Site-owner presentation (the store default) -------------------------

  it('leads with the plain element descriptor and hides raw markup in site-owner mode', () => {
    renderCard();

    // Plain descriptor instead of raw HTML up front.
    expect(screen.getByText('a button')).toBeInTheDocument();
    // Raw markup stays collapsed until requested.
    expect(screen.queryByText('<button class="submit"></button>')).not.toBeInTheDocument();
  });

  it('reveals the raw markup when "Show code" is clicked, without selecting the issue', () => {
    const { onSelect } = renderCard();
    const toggle = screen.getByRole('button', { name: /show code/i });

    fireEvent.click(toggle);

    expect(screen.getByText('<button class="submit"></button>')).toBeInTheDocument();
    expect(toggle).toHaveAccessibleName(/hide code/i);
    // The toggle is a sibling of the activatable region, so it never selects.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows the plain "why this matters" subtitle when the scanner supplied one', () => {
    const whyItMatters = 'Visitors using a screen reader cannot tell what this button does.';
    renderCard({ issue: { ...mockIssue, whyItMatters } });

    expect(screen.getByText(whyItMatters)).toBeInTheDocument();
  });

  it('omits the "why this matters" subtitle when absent', () => {
    renderCard(); // mockIssue has no whyItMatters

    expect(screen.queryByText(/screen reader cannot tell/i)).not.toBeInTheDocument();
  });

  // --- Developer presentation ---------------------------------------------

  it('leads with raw markup and offers no "Show code" toggle in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderCard();

    // Raw HTML is shown directly, with no plain descriptor or toggle.
    expect(screen.getByText('<button class="submit"></button>')).toBeInTheDocument();
    expect(screen.queryByText('a button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show code/i })).not.toBeInTheDocument();
  });
});
