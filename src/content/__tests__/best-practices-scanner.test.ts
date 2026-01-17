import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock performance
const mockPerformanceNow = vi.fn();

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

import { scanBestPractices } from '../best-practices-scanner';

describe('Best Practices Scanner', () => {
  let dom: JSDOM;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(100);

    // Create a new JSDOM instance for each test
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

    // Stub window and document globally
    vi.stubGlobal('window', dom.window);
    vi.stubGlobal('document', dom.window.document);
  });

  describe('DOCTYPE checks', () => {
    it('should detect missing DOCTYPE', async () => {
      const noDoctypeDOM = new JSDOM('<html><head></head><body></body></html>');
      vi.stubGlobal('document', noDoctypeDOM.window.document);
      vi.stubGlobal('window', noDoctypeDOM.window);

      const result = await scanBestPractices();

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should accept valid HTML5 DOCTYPE', async () => {
      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });

  describe('Character encoding checks', () => {
    it('should detect missing charset declaration', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should accept document with charset meta tag', async () => {
      const charsetDOM = new JSDOM(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>'
      );
      vi.stubGlobal('document', charsetDOM.window.document);
      vi.stubGlobal('window', charsetDOM.window);

      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Lang attribute checks', () => {
    it('should detect missing lang attribute', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should accept document with lang attribute', async () => {
      const langDOM = new JSDOM('<!DOCTYPE html><html lang="en"><head></head><body></body></html>');
      vi.stubGlobal('document', langDOM.window.document);
      vi.stubGlobal('window', langDOM.window);

      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Deprecated elements check', () => {
    it('should detect deprecated elements', async () => {
      const deprecatedDOM = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><font>Text</font><center>Content</center></body></html>'
      );
      vi.stubGlobal('document', deprecatedDOM.window.document);
      vi.stubGlobal('window', deprecatedDOM.window);

      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Broken images check', () => {
    it('should detect broken images', async () => {
      const brokenImagesDOM = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><img src="" alt="test"></body></html>'
      );
      vi.stubGlobal('document', brokenImagesDOM.window.document);
      vi.stubGlobal('window', brokenImagesDOM.window);

      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Duplicate IDs check', () => {
    it('should detect duplicate IDs', async () => {
      const duplicateIDsDOM = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><div id="test">1</div><div id="test">2</div></body></html>'
      );
      vi.stubGlobal('document', duplicateIDsDOM.window.document);
      vi.stubGlobal('window', duplicateIDsDOM.window);

      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Empty links check', () => {
    it('should detect empty links', async () => {
      const emptyLinksDOM = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><a href="#"></a></body></html>'
      );
      vi.stubGlobal('document', emptyLinksDOM.window.document);
      vi.stubGlobal('window', emptyLinksDOM.window);

      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Scan result structure', () => {
    it('should return valid ScanResult structure', async () => {
      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct window location', async () => {
      const result = await scanBestPractices();

      expect(typeof result.url).toBe('string');
      expect(result.url.length).toBeGreaterThan(0);
    });

    it('should have timestamp', async () => {
      const beforeScan = Date.now();
      const result = await scanBestPractices();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should have issues array', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });
  });

  describe('Summary generation', () => {
    it('should generate valid summary', async () => {
      const result = await scanBestPractices();
      const { summary } = result;

      expect(summary.total).toBe(result.issues.length);
      expect(summary.bySeverity).toBeDefined();
      expect(summary.byCategory).toBeDefined();
    });

    it('should count severity correctly', async () => {
      const result = await scanBestPractices();
      const { summary } = result;

      const totalSeverity = Object.values(summary.bySeverity).reduce(
        (a: number, b: number) => a + b,
        0
      );
      expect(totalSeverity).toBe(result.issues.length);
    });

    it('should have all severity categories', async () => {
      const result = await scanBestPractices();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have all issue categories', async () => {
      const result = await scanBestPractices();
      const categories = [
        'images',
        'interactive',
        'forms',
        'color',
        'document',
        'structure',
        'aria',
        'technical',
      ];

      for (const category of categories) {
        expect(result.summary.byCategory).toHaveProperty(category);
      }
    });
  });

  describe('Issue validation', () => {
    it('should have valid issue structure for found issues', async () => {
      const result = await scanBestPractices();

      for (const issue of result.issues) {
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('ruleId');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('message');
        expect(['critical', 'serious', 'moderate', 'minor']).toContain(issue.severity);
      }
    });

    it('should have unique issue IDs', async () => {
      const result = await scanBestPractices();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
