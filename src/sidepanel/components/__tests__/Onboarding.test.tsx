import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from '../Onboarding';

describe('Onboarding', () => {
  it('explains that scanning is local (privacy reassurance)', () => {
    render(<Onboarding onComplete={vi.fn()} />);
    expect(screen.getByText(/nothing about the pages you scan is uploaded/i)).toBeInTheDocument();
  });

  it('preselects the Site-owner persona', () => {
    render(<Onboarding onComplete={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /own or manage a website/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', { name: /developer/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('completes with the default persona when the user just starts', () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start checking/i }));

    expect(onComplete).toHaveBeenCalledWith('site-owner');
  });

  it('completes with the chosen persona after selecting Developer', () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: /developer/i }));
    fireEvent.click(screen.getByRole('button', { name: /start checking/i }));

    expect(onComplete).toHaveBeenCalledWith('developer');
  });

  it('moves selection with arrow keys (radiogroup keyboard support)', () => {
    render(<Onboarding onComplete={vi.fn()} />);
    const siteOwner = screen.getByRole('radio', { name: /own or manage a website/i });

    siteOwner.focus();
    fireEvent.keyDown(siteOwner, { key: 'ArrowDown' });

    expect(screen.getByRole('radio', { name: /developer/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});
