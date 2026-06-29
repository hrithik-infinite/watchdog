import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScanProgress from '../ScanProgress';

describe('ScanProgress', () => {
  it('exposes progressbar semantics for a multi-audit scan', () => {
    render(<ScanProgress currentAuditType="accessibility" currentAuditIndex={1} totalAudits={4} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    // ((currentAuditIndex + 1) / totalAudits) * 100 = ((1 + 1) / 4) * 100 = 50
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    // aria-label provides an accessible name for the bar
    expect(progressbar).toHaveAccessibleName();
  });

  it('rounds aria-valuenow to the nearest integer', () => {
    render(<ScanProgress currentAuditType="seo" currentAuditIndex={0} totalAudits={3} />);

    // ((0 + 1) / 3) * 100 = 33.33... -> 33
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '33');
  });
});
