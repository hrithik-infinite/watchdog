import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock window and performance
const mockPerformanceNow = vi.fn();

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

import { scanSEO } from '../seo-scanner';

describe('SEO Scanner', () => {
  let dom: JSDOM;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);

    // Create a new JSDOM instance for each test
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

    // Stub window and document globally
    vi.stubGlobal('window', {
      location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
      document: dom.window.document,
      matchMedia: vi.fn(),
    });
    vi.stubGlobal('document', dom.window.document);
  });

  describe('Scan execution', () => {
    it('should return a ScanResult object', async () => {
      const result = await scanSEO();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct URL from window.location', async () => {
      const result = await scanSEO();

      expect(result.url).toBe('https://example.com');
    });

    it('should set current timestamp', async () => {
      const beforeScan = Date.now();
      const result = await scanSEO();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should calculate scan duration', async () => {
      const result = await scanSEO();

      expect(typeof result.duration).toBe('number');
      expect(Number.isNaN(result.duration)).toBe(false);
    });

    it('should have issues array', async () => {
      const result = await scanSEO();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await scanSEO();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });

    it('should have valid summary structure', async () => {
      const result = await scanSEO();
      const { summary } = result;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('bySeverity');
      expect(summary).toHaveProperty('byCategory');
      expect(typeof summary.total).toBe('number');
    });
  });

  describe('Issue structure', () => {
    it('should have valid issue objects if issues found', async () => {
      const result = await scanSEO();

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('ruleId');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('message');
      }
    });

    it('should have valid severity values', async () => {
      const result = await scanSEO();
      const validSeverities = ['critical', 'serious', 'moderate', 'minor'];

      for (const issue of result.issues) {
        expect(validSeverities).toContain(issue.severity);
      }
    });

    it('should have valid category values', async () => {
      const result = await scanSEO();
      const validCategories = [
        'images',
        'interactive',
        'forms',
        'color',
        'document',
        'structure',
        'aria',
        'technical',
      ];

      for (const issue of result.issues) {
        expect(validCategories).toContain(issue.category);
      }
    });

    it('should have unique issue IDs', async () => {
      const result = await scanSEO();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Summary generation', () => {
    it('should have correct total count', async () => {
      const result = await scanSEO();

      expect(result.summary.total).toBe(result.issues.length);
    });

    it('should have severity breakdown', async () => {
      const result = await scanSEO();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have category breakdown', async () => {
      const result = await scanSEO();
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

    it('should have valid severity counts', async () => {
      const result = await scanSEO();

      const severityCounts = Object.values(result.summary.bySeverity);
      const totalFromSeverity = severityCounts.reduce((a, b) => a + b, 0);

      expect(totalFromSeverity).toBe(result.summary.total);
    });

    it('should have valid category counts', async () => {
      const result = await scanSEO();

      const categoryCounts = Object.values(result.summary.byCategory);
      const totalFromCategories = categoryCounts.reduce((a, b) => a + b, 0);

      expect(totalFromCategories).toBe(result.summary.total);
    });
  });

  describe('Title checks', () => {
    it('should detect missing title', async () => {
      const result = await scanSEO();

      const titleIssue = result.issues.find((i) => i.ruleId === 'title-missing');
      expect(titleIssue).toBeDefined();
      expect(titleIssue?.severity).toBe('critical');
    });

    it('should detect title with optimal length', async () => {
      const pageWithTitle = new JSDOM(
        '<!DOCTYPE html><html><head><title>This is a good title that is between 50 and 60 chars</title></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithTitle.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithTitle.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const titleIssue = result.issues.find((i) => i.ruleId === 'title-missing');
      expect(titleIssue).toBeUndefined();
    });

    it('should detect title that is too short', async () => {
      const pageWithShortTitle = new JSDOM(
        '<!DOCTYPE html><html><head><title>Short</title></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithShortTitle.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithShortTitle.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const titleLengthIssue = result.issues.find((i) => i.ruleId === 'title-length');
      expect(titleLengthIssue).toBeDefined();
      expect(titleLengthIssue?.severity).toBe('moderate');
    });

    it('should detect title that is too long', async () => {
      const longTitle = 'A'.repeat(100);
      const pageWithLongTitle = new JSDOM(
        `<!DOCTYPE html><html><head><title>${longTitle}</title></head><body></body></html>`
      );
      vi.stubGlobal('document', pageWithLongTitle.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithLongTitle.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const titleLengthIssue = result.issues.find((i) => i.ruleId === 'title-length');
      expect(titleLengthIssue).toBeDefined();
    });
  });

  describe('Meta description checks', () => {
    it('should detect missing meta description', async () => {
      const result = await scanSEO();

      const metaIssue = result.issues.find((i) => i.ruleId === 'meta-description-missing');
      expect(metaIssue).toBeDefined();
      expect(metaIssue?.severity).toBe('serious');
    });

    it('should detect meta description with optimal length', async () => {
      const description = 'A'.repeat(155);
      const pageWithMeta = new JSDOM(
        `<!DOCTYPE html><html><head><meta name="description" content="${description}"></head><body></body></html>`
      );
      vi.stubGlobal('document', pageWithMeta.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithMeta.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const metaIssue = result.issues.find((i) => i.ruleId === 'meta-description-missing');
      expect(metaIssue).toBeUndefined();
    });

    it('should detect meta description that is too short', async () => {
      const pageWithShortMeta = new JSDOM(
        '<!DOCTYPE html><html><head><meta name="description" content="Short"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithShortMeta.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithShortMeta.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const metaLengthIssue = result.issues.find((i) => i.ruleId === 'meta-description-length');
      expect(metaLengthIssue).toBeDefined();
    });
  });

  describe('Heading checks', () => {
    it('should detect missing H1', async () => {
      const result = await scanSEO();

      const h1Issue = result.issues.find((i) => i.ruleId === 'h1-missing');
      expect(h1Issue).toBeDefined();
      expect(h1Issue?.severity).toBe('serious');
    });

    it('should accept single H1', async () => {
      const pageWithH1 = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><h1>Main Heading</h1></body></html>'
      );
      vi.stubGlobal('document', pageWithH1.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithH1.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const h1Issue = result.issues.find((i) => i.ruleId === 'h1-missing');
      expect(h1Issue).toBeUndefined();
    });

    it('should detect multiple H1 tags', async () => {
      const pageWithMultipleH1 = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><h1>First</h1><h1>Second</h1></body></html>'
      );
      vi.stubGlobal('document', pageWithMultipleH1.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithMultipleH1.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const h1MultipleIssue = result.issues.find((i) => i.ruleId === 'h1-multiple');
      expect(h1MultipleIssue).toBeDefined();
      expect(h1MultipleIssue?.severity).toBe('moderate');
    });
  });

  describe('Open Graph checks', () => {
    it('should detect missing og:title', async () => {
      const result = await scanSEO();

      const ogIssue = result.issues.find((i) => i.ruleId === 'og-title-missing');
      expect(ogIssue).toBeDefined();
    });

    it('should detect missing og:image', async () => {
      const result = await scanSEO();

      const ogImageIssue = result.issues.find((i) => i.ruleId === 'og-image-missing');
      expect(ogImageIssue).toBeDefined();
    });

    it('should accept page with og:title and og:image', async () => {
      const pageWithOG = new JSDOM(
        '<!DOCTYPE html><html><head><meta property="og:title" content="Title"><meta property="og:image" content="image.jpg"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithOG.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithOG.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const ogIssue = result.issues.find((i) => i.ruleId === 'og-title-missing');
      const ogImageIssue = result.issues.find((i) => i.ruleId === 'og-image-missing');
      expect(ogIssue).toBeUndefined();
      expect(ogImageIssue).toBeUndefined();
    });
  });

  describe('Canonical checks', () => {
    it('should detect missing canonical', async () => {
      const result = await scanSEO();

      const canonicalIssue = result.issues.find((i) => i.ruleId === 'canonical-missing');
      expect(canonicalIssue).toBeDefined();
      expect(canonicalIssue?.severity).toBe('moderate');
    });

    it('should accept page with canonical', async () => {
      const pageWithCanonical = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="canonical" href="https://example.com"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithCanonical.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithCanonical.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const canonicalIssue = result.issues.find((i) => i.ruleId === 'canonical-missing');
      expect(canonicalIssue).toBeUndefined();
    });
  });

  describe('Viewport checks', () => {
    it('should detect missing viewport meta tag', async () => {
      const result = await scanSEO();

      const viewportIssue = result.issues.find((i) => i.ruleId === 'viewport-missing');
      expect(viewportIssue).toBeDefined();
      expect(viewportIssue?.severity).toBe('serious');
    });

    it('should accept page with viewport', async () => {
      const pageWithViewport = new JSDOM(
        '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithViewport.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithViewport.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const viewportIssue = result.issues.find((i) => i.ruleId === 'viewport-missing');
      expect(viewportIssue).toBeUndefined();
    });
  });

  describe('HTTPS checks', () => {
    it('should accept HTTPS', async () => {
      const result = await scanSEO();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'https-missing');
      expect(httpsIssue).toBeUndefined();
    });

    it('should detect HTTP', async () => {
      vi.stubGlobal('window', {
        location: { href: 'http://example.com', protocol: 'http:', hostname: 'example.com' },
        document: dom.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSEO();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'https-missing');
      expect(httpsIssue).toBeDefined();
      expect(httpsIssue?.severity).toBe('critical');
    });
  });

  describe('SEO specific checks', () => {
    it('should complete SEO scan', async () => {
      const result = await scanSEO();

      expect(result).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should be callable multiple times', async () => {
      const result1 = await scanSEO();
      const result2 = await scanSEO();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
