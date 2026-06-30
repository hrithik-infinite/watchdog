import { describe, it, expect } from 'vitest';
import { parseReport } from '../import-report';
import type { ScanResult } from '@/shared/types';

const validReport: ScanResult = {
  url: 'https://example.com',
  timestamp: 1700000000000,
  duration: 1234,
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

describe('parseReport', () => {
  it('round-trips a valid exported report', () => {
    const parsed = parseReport(JSON.stringify(validReport));
    expect(parsed).toEqual(validReport);
  });

  it('defaults optional fields (incomplete/timestamp/duration) when missing', () => {
    const parsed = parseReport(
      JSON.stringify({ url: 'https://x.com', issues: [], summary: validReport.summary })
    );
    expect(parsed.incomplete).toEqual([]);
    expect(parsed.timestamp).toBe(0);
    expect(parsed.duration).toBe(0);
  });

  it('throws a readable error for non-JSON input', () => {
    expect(() => parseReport('not json {')).toThrow(/couldn't be read as JSON/i);
  });

  it('rejects JSON that is not a WatchDog report', () => {
    expect(() => parseReport(JSON.stringify({ hello: 'world' }))).toThrow(
      /isn't a WatchDog report/i
    );
    expect(() => parseReport(JSON.stringify({ url: 'x', issues: 'nope', summary: {} }))).toThrow(
      /isn't a WatchDog report/i
    );
    expect(() => parseReport('null')).toThrow(/isn't a WatchDog report/i);
  });
});
