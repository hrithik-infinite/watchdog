import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/a11y';
import ScanButton from '../ScanButton';

describe('ScanButton', () => {
  it('renders "Start Scan" when idle with no prior results', () => {
    render(<ScanButton isScanning={false} onScan={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Start Scan' });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('renders "Rescan Page" when idle and results already exist', () => {
    render(<ScanButton isScanning={false} onScan={vi.fn()} hasResults={true} />);

    const button = screen.getByRole('button', { name: 'Rescan Page' });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Start Scan' })).not.toBeInTheDocument();
  });

  it('explicit hasResults={false} keeps the "Start Scan" label', () => {
    render(<ScanButton isScanning={false} onScan={vi.fn()} hasResults={false} />);

    expect(screen.getByRole('button', { name: 'Start Scan' })).toBeInTheDocument();
  });

  it('shows "Scanning..." and disables the button while scanning', () => {
    render(<ScanButton isScanning={true} onScan={vi.fn()} hasResults={true} />);

    const button = screen.getByRole('button', { name: /scanning/i });
    expect(button).toBeDisabled();
    // The scan-state label wins over the hasResults label.
    expect(screen.queryByRole('button', { name: 'Rescan Page' })).not.toBeInTheDocument();
  });

  it('fires onScan when clicked in the idle state', async () => {
    const user = userEvent.setup();
    const onScan = vi.fn();
    render(<ScanButton isScanning={false} onScan={onScan} />);

    await user.click(screen.getByRole('button', { name: 'Start Scan' }));

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith();
  });

  it('fires onScan when clicked in the rescan state', async () => {
    const user = userEvent.setup();
    const onScan = vi.fn();
    render(<ScanButton isScanning={false} onScan={onScan} hasResults={true} />);

    await user.click(screen.getByRole('button', { name: 'Rescan Page' }));

    expect(onScan).toHaveBeenCalledTimes(1);
  });

  it('does not fire onScan while scanning (button is disabled)', async () => {
    const user = userEvent.setup();
    const onScan = vi.fn();
    render(<ScanButton isScanning={true} onScan={onScan} />);

    await user.click(screen.getByRole('button', { name: /scanning/i }));

    expect(onScan).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ScanButton isScanning={false} onScan={vi.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations in the scanning state', async () => {
    const { container } = render(<ScanButton isScanning={true} onScan={vi.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
