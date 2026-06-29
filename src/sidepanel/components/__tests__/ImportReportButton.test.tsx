import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportReportButton from '../ImportReportButton';
import type { ScanResult } from '@/shared/types';

const report: ScanResult = {
  url: 'https://example.com',
  timestamp: 1,
  duration: 1,
  issues: [],
  incomplete: [],
  summary: {
    total: 0,
    bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    byCategory: {
      images: 0,
      interactive: 0,
      forms: 0,
      color: 0,
      document: 0,
      structure: 0,
      aria: 0,
      technical: 0,
    },
  },
};

function fileFrom(content: string): File {
  const file = new File([content], 'report.json', { type: 'application/json' });
  // happy-dom's File.text() may be absent; provide it deterministically.
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(content) });
  return file;
}

describe('ImportReportButton', () => {
  it('parses a valid report file and calls onImport', async () => {
    const onImport = vi.fn();
    const { container } = render(<ImportReportButton onImport={onImport} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [fileFrom(JSON.stringify(report))] } });

    await waitFor(() => expect(onImport).toHaveBeenCalledWith(report));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an inline error and does not import an invalid file', async () => {
    const onImport = vi.fn();
    const { container } = render(<ImportReportButton onImport={onImport} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [fileFrom('{ not valid')] } });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onImport).not.toHaveBeenCalled();
  });
});
