import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/a11y';
import CodeBlock from '../CodeBlock';

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the supplied code content', () => {
    render(<CodeBlock code="const a = 1;" />);

    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
  });

  it('renders empty code without crashing and shows no copy button', () => {
    const { container } = render(<CodeBlock code="" />);

    expect(container.querySelector('code')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides the copy button by default (showCopy defaults to false)', () => {
    render(<CodeBlock code="x" />);

    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('renders the copy button when showCopy is true', () => {
    render(<CodeBlock code="x" showCopy />);

    expect(screen.getByRole('button', { name: /copy fix/i })).toBeInTheDocument();
  });

  it('copies the code to the clipboard and shows confirmation feedback on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    render(<CodeBlock code="copy-me" showCopy />);
    fireEvent.click(screen.getByRole('button', { name: /copy fix/i }));

    expect(writeText).toHaveBeenCalledWith('copy-me');
    expect(await screen.findByRole('button', { name: /copied!/i })).toBeInTheDocument();
  });

  it('reverts the confirmation label back to "Copy Fix" after the timeout', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    render(<CodeBlock code="revert-me" showCopy />);
    fireEvent.click(screen.getByRole('button', { name: /copy fix/i }));

    expect(await screen.findByRole('button', { name: /copied!/i })).toBeInTheDocument();

    // The label resets on a 2s timer; wait it out and confirm it reverts.
    expect(
      await screen.findByRole('button', { name: /copy fix/i }, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copied!/i })).not.toBeInTheDocument();
  });

  it('logs an error and keeps the original label when copying fails', async () => {
    const error = new Error('denied');
    const writeText = vi.fn().mockRejectedValue(error);
    mockClipboard(writeText);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CodeBlock code="fail-me" showCopy />);
    fireEvent.click(screen.getByRole('button', { name: /copy fix/i }));

    // Let the rejected promise settle.
    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', error));
    expect(screen.getByRole('button', { name: /copy fix/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copied!/i })).not.toBeInTheDocument();
  });

  it('preserves whitespace and multi-line code content', () => {
    const multiline = 'line one\n  indented two';
    render(<CodeBlock code={multiline} />);

    expect(screen.getByText(/line one/)).toHaveTextContent('line one indented two');
  });

  it('renders a -/+ diff with both the removed and added lines', () => {
    render(<CodeBlock code={'- color: #8a8a8a;\n+ color: #c8cdd4;'} />);

    expect(screen.getByText('- color: #8a8a8a;')).toBeInTheDocument();
    expect(screen.getByText('+ color: #c8cdd4;')).toBeInTheDocument();
  });

  it('copies only the proposed (+) line from a diff, without the marker', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    render(<CodeBlock code={'- color: #8a8a8a;\n+ color: #c8cdd4;'} showCopy />);
    fireEvent.click(screen.getByRole('button', { name: /copy fix/i }));

    expect(writeText).toHaveBeenCalledWith('color: #c8cdd4;');
  });

  it('has no accessibility violations without the copy button', async () => {
    const { container } = render(<CodeBlock code="const a = 1;" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations with the copy button shown', async () => {
    const { container } = render(<CodeBlock code="const a = 1;" showCopy />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
