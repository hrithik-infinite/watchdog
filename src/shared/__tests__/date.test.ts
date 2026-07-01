import { describe, expect, it } from 'vitest';
import { formatDate } from '../date';

describe('formatDate', () => {
  // Constructed with local Y/M/D so the assertion is timezone-independent.
  it('formats a date as "Month DD, YYYY" with a zero-padded day', () => {
    expect(formatDate(new Date(2026, 5, 2))).toBe('June 02, 2026');
  });

  it('does not pad a two-digit day', () => {
    expect(formatDate(new Date(2026, 11, 25))).toBe('December 25, 2026');
  });

  it('accepts a timestamp number as well as a Date', () => {
    expect(formatDate(new Date(2026, 5, 2).getTime())).toBe('June 02, 2026');
  });
});
