import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopFixesCard from '../TopFixesCard';
import type { Issue, Severity } from '@/shared/types';

let counter = 0;
function makeIssue(ruleId: string, severity: Severity, message: string): Issue {
  counter += 1;
  return {
    id: `${ruleId}-${counter}`,
    ruleId,
    severity,
    category: 'images',
    message,
    description: 'desc',
    helpUrl: 'https://example.com',
    wcag: { id: '1.1.1', level: 'A', name: 'Non-text Content', description: 'x' },
    element: { selector: `.el-${counter}`, html: '<div></div>' },
    fix: { description: '', code: '', learnMoreUrl: '' },
  };
}

describe('TopFixesCard', () => {
  it('renders nothing when fewer than two fix groups exist', () => {
    const { container } = render(
      <TopFixesCard
        issues={[makeIssue('image-alt', 'serious', 'Images missing alt text')]}
        onSelectIssue={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('ranks groups by severity × count and shows the representative message', () => {
    const issues = [
      makeIssue('image-alt', 'serious', 'Images missing alt text'),
      makeIssue('image-alt', 'serious', 'Images missing alt text'),
      makeIssue('image-alt', 'serious', 'Images missing alt text'),
      makeIssue('color-contrast', 'critical', 'Low contrast text'),
      makeIssue('color-contrast', 'critical', 'Low contrast text'),
    ];

    render(<TopFixesCard issues={issues} onSelectIssue={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /top fixes/i })).toBeInTheDocument();

    const rows = screen.getAllByRole('button');
    // color-contrast (10×2 = 20) outranks image-alt (5×3 = 15) despite fewer items.
    expect(rows[0]).toHaveTextContent('Low contrast text');
    expect(rows[1]).toHaveTextContent('Images missing alt text');
  });

  it('opens the most-severe issue of a group when its row is clicked', () => {
    const onSelectIssue = vi.fn();
    const minor = makeIssue('color-contrast', 'minor', 'Low contrast text');
    const critical = makeIssue('color-contrast', 'critical', 'Low contrast text');
    const issues = [
      minor,
      critical,
      makeIssue('image-alt', 'serious', 'Images missing alt text'),
    ];

    render(<TopFixesCard issues={issues} onSelectIssue={onSelectIssue} />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    // The representative is the worst-severity instance, not the first seen.
    expect(onSelectIssue).toHaveBeenCalledWith(critical.id);
  });
});
