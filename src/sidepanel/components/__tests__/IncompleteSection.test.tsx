import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Issue } from '@/shared/types';
import IncompleteSection from '../IncompleteSection';

const issue: Issue = {
  id: 'inc-1',
  ruleId: 'color-contrast',
  severity: 'moderate',
  category: 'color',
  message: 'Element may have insufficient contrast',
  description: 'Verify the contrast manually.',
  helpUrl: 'https://example.com',
  wcag: { id: '1.4.3', level: 'AA', name: 'Contrast', description: 'x' },
  element: { selector: '.banner', html: '<div class="banner"></div>' },
  fix: { description: '', code: '', learnMoreUrl: '' },
};

describe('IncompleteSection', () => {
  it('renders nothing when there are no incomplete items', () => {
    const { container } = render(<IncompleteSection issues={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count and reveals items only when expanded', () => {
    render(<IncompleteSection issues={[issue]} />);

    const toggle = screen.getByRole('button', { name: /needs manual review/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(issue.message)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(issue.message)).toBeInTheDocument();
    expect(screen.getByText('.banner')).toBeInTheDocument();
  });
});
