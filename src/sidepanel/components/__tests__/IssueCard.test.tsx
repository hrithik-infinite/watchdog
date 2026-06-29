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
  render(
    <IssueCard
      issue={mockIssue}
      isSelected={false}
      onSelect={onSelect}
      onHighlight={onHighlight}
      {...overrides}
    />
  );
  return { onSelect, onHighlight };
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
});
