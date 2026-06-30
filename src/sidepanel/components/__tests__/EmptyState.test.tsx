import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '@/shared/errors';
import { axe } from '@/test/a11y';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  describe('type="error"', () => {
    it('renders the matched error code, title, message, and suggestion', () => {
      render(<EmptyState type="error" error="No active tab" />);

      expect(screen.getByText(ERROR_CODES.E001.code)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: ERROR_CODES.E001.title })).toBeInTheDocument();
      expect(screen.getByText(ERROR_CODES.E001.message)).toBeInTheDocument();
      expect(screen.getByText(ERROR_CODES.E001.suggestion)).toBeInTheDocument();
    });

    it('falls back to the generic E005 error and echoes the raw message when unmatched', () => {
      render(<EmptyState type="error" error="something weird happened" />);

      expect(screen.getByText(ERROR_CODES.E005.code)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: ERROR_CODES.E005.title })).toBeInTheDocument();
      expect(screen.getByText('something weird happened')).toBeInTheDocument();
    });

    it('handles an undefined error prop without throwing', () => {
      render(<EmptyState type="error" />);

      // Empty string falls through to E005 with its default message.
      expect(screen.getByText(ERROR_CODES.E005.code)).toBeInTheDocument();
      expect(screen.getByText(ERROR_CODES.E005.message)).toBeInTheDocument();
    });

    it('renders the "Try Again" button and fires onScan when clicked', async () => {
      const user = userEvent.setup();
      const onScan = vi.fn();
      render(<EmptyState type="error" error="No active tab" onScan={onScan} />);

      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);

      expect(onScan).toHaveBeenCalledTimes(1);
    });

    it('omits the "Try Again" button when no onScan handler is provided', () => {
      render(<EmptyState type="error" error="No active tab" />);

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <EmptyState type="error" error="No active tab" onScan={vi.fn()} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('type="no-issues"', () => {
    it('renders the generic success copy when no auditLabel is given', () => {
      render(<EmptyState type="no-issues" />);

      expect(screen.getByRole('heading', { name: /no issues found/i })).toBeInTheDocument();
      expect(screen.getByText('No problems found on this page. Nice work!')).toBeInTheDocument();
    });

    it('renders an audit-specific, lowercased success message when auditLabel is given', () => {
      render(<EmptyState type="no-issues" auditLabel="Performance" />);

      expect(
        screen.getByText('No performance problems found on this page. Nice work!')
      ).toBeInTheDocument();
    });

    it('renders the "Scan Again" button and fires onScan when clicked', async () => {
      const user = userEvent.setup();
      const onScan = vi.fn();
      render(<EmptyState type="no-issues" onScan={onScan} />);

      const button = screen.getByRole('button', { name: /scan again/i });
      await user.click(button);

      expect(onScan).toHaveBeenCalledTimes(1);
    });

    it('omits the "Scan Again" button when no onScan handler is provided', () => {
      render(<EmptyState type="no-issues" />);

      expect(screen.queryByRole('button', { name: /scan again/i })).not.toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <EmptyState type="no-issues" auditLabel="Accessibility" onScan={vi.fn()} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
