import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Issue } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { axe } from '@/test/a11y';
import IssueList from '../IssueList';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
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
    ...overrides,
  };
}

const issueA = makeIssue({
  id: 'issue-a',
  message: 'First issue',
  severity: 'critical',
  element: { selector: 'a.first', html: '<a class="first"></a>' },
});
const issueB = makeIssue({
  id: 'issue-b',
  message: 'Second issue',
  severity: 'serious',
  element: { selector: 'img.second', html: '<img class="second" />' },
});

function renderList(overrides: Partial<ComponentProps<typeof IssueList>> = {}) {
  const onSelectIssue = vi.fn();
  const onHighlightIssue = vi.fn();
  const { container } = render(
    <IssueList
      issues={[issueA, issueB]}
      selectedIssueId={null}
      onSelectIssue={onSelectIssue}
      onHighlightIssue={onHighlightIssue}
      {...overrides}
    />
  );
  return { onSelectIssue, onHighlightIssue, container };
}

// The activatable card body is a role="button" with tabindex=0. Site-owner mode
// also renders a real "Show code" <button> per card, so filter by tabindex to
// get the activatable regions, one per issue.
function getCardRegions(): HTMLElement[] {
  return screen.getAllByRole('button').filter((el) => el.getAttribute('tabindex') === '0');
}

describe('IssueList', () => {
  beforeEach(() => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('renders one card per issue', () => {
    renderList();

    expect(screen.getByText('First issue')).toBeInTheDocument();
    expect(screen.getByText('Second issue')).toBeInTheDocument();
    expect(getCardRegions()).toHaveLength(2);
  });

  it('renders an empty state with no cards when there are no issues', () => {
    renderList({ issues: [] });

    expect(screen.getByText('No issues match your filters')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filter criteria')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onSelectIssue with the clicked issue id', () => {
    const { onSelectIssue } = renderList();
    const [firstCard, secondCard] = getCardRegions();

    fireEvent.click(firstCard);
    expect(onSelectIssue).toHaveBeenCalledWith('issue-a');

    fireEvent.click(secondCard);
    expect(onSelectIssue).toHaveBeenCalledWith('issue-b');
  });

  it('selects an issue via keyboard activation', () => {
    const { onSelectIssue } = renderList();
    const [firstCard] = getCardRegions();

    fireEvent.keyDown(firstCard, { key: 'Enter' });

    expect(onSelectIssue).toHaveBeenCalledWith('issue-a');
  });

  it('highlights the matching card when an issue is selected', () => {
    renderList({ selectedIssueId: 'issue-b' });
    const [firstCard, secondCard] = getCardRegions();

    // The selection ring lives on the outer Card element of the selected issue.
    expect(firstCard.closest('.ring-2')).toBeNull();
    expect(secondCard.closest('.ring-2')).not.toBeNull();
  });

  it('auto-highlights an element on hover when canHighlight and autoHighlight are both true', () => {
    const { onHighlightIssue, container } = renderList({
      canHighlight: true,
      autoHighlight: true,
    });
    const firstCard = container.querySelector('.animate-fade-in');
    if (!firstCard) throw new Error('card not found');

    fireEvent.mouseEnter(firstCard);

    // The list wires onHighlight to pass the issue's selector and severity.
    expect(onHighlightIssue).toHaveBeenCalledWith('a.first', 'critical');
  });

  it('does not auto-highlight on hover when canHighlight is false', () => {
    const { onHighlightIssue, container } = renderList({
      canHighlight: false,
      autoHighlight: true,
    });
    const firstCard = container.querySelector('.animate-fade-in');
    if (!firstCard) throw new Error('card not found');

    fireEvent.mouseEnter(firstCard);

    expect(onHighlightIssue).not.toHaveBeenCalled();
  });

  it('does not auto-highlight on hover when autoHighlight is false', () => {
    const { onHighlightIssue, container } = renderList({
      canHighlight: true,
      autoHighlight: false,
    });
    const firstCard = container.querySelector('.animate-fade-in');
    if (!firstCard) throw new Error('card not found');

    fireEvent.mouseEnter(firstCard);

    expect(onHighlightIssue).not.toHaveBeenCalled();
  });

  it('passes each card its own selector and severity for highlighting', () => {
    const { onHighlightIssue, container } = renderList({
      canHighlight: true,
      autoHighlight: true,
    });
    const cards = container.querySelectorAll('.animate-fade-in');

    fireEvent.mouseEnter(cards[1]);

    expect(onHighlightIssue).toHaveBeenCalledWith('img.second', 'serious');
  });

  it('renders the issue messages within their cards', () => {
    const { container } = renderList();
    const cards = container.querySelectorAll('.animate-fade-in');

    expect(within(cards[0] as HTMLElement).getByText('First issue')).toBeInTheDocument();
    expect(within(cards[1] as HTMLElement).getByText('Second issue')).toBeInTheDocument();
  });

  it('has no accessibility violations when rendering issues', async () => {
    const { container } = renderList();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations in the empty state', async () => {
    const { container } = renderList({ issues: [] });
    expect(await axe(container)).toHaveNoViolations();
  });
});
