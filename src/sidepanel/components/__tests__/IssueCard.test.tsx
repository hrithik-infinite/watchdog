import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import IssueCard from '../IssueCard';
import type { Issue } from '@/shared/types';

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

describe('IssueCard', () => {
  it('activates the card when Space is pressed', () => {
    const { onSelect } = renderCard();
    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockIssue.id);
  });

  it('prevents the default scroll behavior when Space activates the card', () => {
    renderCard();
    const card = screen.getByRole('button');

    const spaceEvent = createEvent.keyDown(card, { key: ' ' });
    fireEvent(card, spaceEvent);

    expect(spaceEvent.defaultPrevented).toBe(true);
  });

  it('still activates the card when Enter is pressed', () => {
    const { onSelect } = renderCard();
    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockIssue.id);
  });

  it('does not activate the card for unrelated keys', () => {
    const { onSelect } = renderCard();
    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: 'a' });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the "Learn more" link outside the role="button" region', () => {
    renderCard();
    const card = screen.getByRole('button');
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
    const card = screen.getByRole('button');

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
});
