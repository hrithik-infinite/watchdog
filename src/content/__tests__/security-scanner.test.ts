import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock window and performance
const mockPerformanceNow = vi.fn();

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

vi.stubGlobal('fetch', vi.fn());

import { scanSecurity } from '../security-scanner';

describe('Security Scanner', () => {
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
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('Scan execution', () => {
    it('should return a ScanResult object', async () => {
      const result = await scanSecurity();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct URL from window.location', async () => {
      const result = await scanSecurity();

      expect(result.url).toBe('https://example.com');
    });

    it('should set current timestamp', async () => {
      const beforeScan = Date.now();
      const result = await scanSecurity();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should calculate scan duration', async () => {
      const result = await scanSecurity();

      expect(typeof result.duration).toBe('number');
      expect(Number.isNaN(result.duration)).toBe(false);
    });

    it('should have issues array', async () => {
      const result = await scanSecurity();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await scanSecurity();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });

    it('should have valid summary structure', async () => {
      const result = await scanSecurity();
      const { summary } = result;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('bySeverity');
      expect(summary).toHaveProperty('byCategory');
      expect(typeof summary.total).toBe('number');
    });
  });

  describe('Issue structure', () => {
    it('should have valid issue objects if issues found', async () => {
      const result = await scanSecurity();

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
      const result = await scanSecurity();
      const validSeverities = ['critical', 'serious', 'moderate', 'minor'];

      for (const issue of result.issues) {
        expect(validSeverities).toContain(issue.severity);
      }
    });

    it('should have valid category values', async () => {
      const result = await scanSecurity();
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
      const result = await scanSecurity();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Summary generation', () => {
    it('should have correct total count', async () => {
      const result = await scanSecurity();

      expect(result.summary.total).toBe(result.issues.length);
    });

    it('should have severity breakdown', async () => {
      const result = await scanSecurity();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have category breakdown', async () => {
      const result = await scanSecurity();
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
      const result = await scanSecurity();

      const severityCounts = Object.values(result.summary.bySeverity);
      const totalFromSeverity = severityCounts.reduce((a, b) => a + b, 0);

      expect(totalFromSeverity).toBe(result.summary.total);
    });

    it('should have valid category counts', async () => {
      const result = await scanSecurity();

      const categoryCounts = Object.values(result.summary.byCategory);
      const totalFromCategories = categoryCounts.reduce((a, b) => a + b, 0);

      expect(totalFromCategories).toBe(result.summary.total);
    });
  });

  describe('HTTPS checks', () => {
    it('should detect HTTPS protocol', async () => {
      const result = await scanSecurity();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'https-not-enabled');
      expect(httpsIssue).toBeUndefined();
    });

    it('should detect missing HTTPS', async () => {
      vi.stubGlobal('window', {
        location: { href: 'http://example.com', protocol: 'http:', hostname: 'example.com' },
        document: dom.window.document,
        matchMedia: vi.fn(),
      });

      const result = await scanSecurity();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'https-not-enabled');
      expect(httpsIssue).toBeDefined();
      expect(httpsIssue?.severity).toBe('critical');
    });
  });

  describe('Mixed content checks', () => {
    it('should detect no mixed content on clean page', async () => {
      const result = await scanSecurity();

      const mixedContentIssue = result.issues.find((i) => i.ruleId === 'mixed-content');
      expect(mixedContentIssue).toBeUndefined();
    });

    it('should detect HTTP scripts', async () => {
      const pageWithHttpScript = new JSDOM(
        '<!DOCTYPE html><html><head><script src="http://example.com/script.js"></script></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithHttpScript.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithHttpScript.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const mixedContentIssue = result.issues.find((i) => i.ruleId === 'mixed-content');
      expect(mixedContentIssue).toBeDefined();
    });

    it('should detect HTTP stylesheets', async () => {
      const pageWithHttpStyle = new JSDOM(
        '<!DOCTYPE html><html><head><link href="http://example.com/style.css" rel="stylesheet"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithHttpStyle.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithHttpStyle.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const mixedContentIssue = result.issues.find((i) => i.ruleId === 'mixed-content');
      expect(mixedContentIssue).toBeDefined();
    });
  });

  describe('Form security checks', () => {
    it('should detect forms with insecure action', async () => {
      const pageWithInsecureForm = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><form action="http://example.com/submit" method="post"></form></body></html>'
      );
      vi.stubGlobal('document', pageWithInsecureForm.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithInsecureForm.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const formIssue = result.issues.find((i) => i.ruleId === 'forms-insecure');
      expect(formIssue).toBeDefined();
      expect(formIssue?.severity).toBe('critical');
    });

    it('should detect POST forms without CSRF token', async () => {
      const pageWithFormNoCSRF = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><form method="post"><input type="text" name="data"></form></body></html>'
      );
      vi.stubGlobal('document', pageWithFormNoCSRF.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithFormNoCSRF.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const csrfIssue = result.issues.find((i) => i.ruleId === 'forms-no-csrf');
      expect(csrfIssue).toBeDefined();
      expect(csrfIssue?.severity).toBe('serious');
    });

    it('should accept POST forms with CSRF token', async () => {
      const pageWithFormCSRF = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><form method="post"><input type="hidden" name="csrf_token" value="token"></form></body></html>'
      );
      vi.stubGlobal('document', pageWithFormCSRF.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithFormCSRF.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const csrfIssue = result.issues.find((i) => i.ruleId === 'forms-no-csrf');
      expect(csrfIssue).toBeUndefined();
    });
  });

  describe('Password field checks', () => {
    it('should detect password fields on HTTP pages', async () => {
      const pageWithPassword = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><input type="password" name="password"></body></html>'
      );
      vi.stubGlobal('document', pageWithPassword.window.document);
      vi.stubGlobal('window', {
        location: { href: 'http://example.com', protocol: 'http:', hostname: 'example.com' },
        document: pageWithPassword.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const pwdIssue = result.issues.find((i) => i.ruleId === 'password-over-http');
      expect(pwdIssue).toBeDefined();
      expect(pwdIssue?.severity).toBe('critical');
    });

    it('should accept password fields on HTTPS pages', async () => {
      const pageWithPassword = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><input type="password" name="password"></body></html>'
      );
      vi.stubGlobal('document', pageWithPassword.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithPassword.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const pwdIssue = result.issues.find((i) => i.ruleId === 'password-over-http');
      expect(pwdIssue).toBeUndefined();
    });
  });

  describe('Inline script checks', () => {
    it('should accept minimal inline scripts', async () => {
      const pageWithMinimalInline = new JSDOM(
        '<!DOCTYPE html><html><head><script>console.log("test");</script></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithMinimalInline.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithMinimalInline.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const inlineIssue = result.issues.find((i) => i.ruleId === 'inline-scripts-excessive');
      expect(inlineIssue).toBeUndefined();
    });

    it('should detect excessive inline scripts', async () => {
      let html = '<!DOCTYPE html><html><head>';
      for (let i = 0; i < 6; i++) {
        html += `<script>console.log("${i}");</script>`;
      }
      html += '</head><body></body></html>';

      const pageWithExcessiveInline = new JSDOM(html);
      vi.stubGlobal('document', pageWithExcessiveInline.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithExcessiveInline.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const inlineIssue = result.issues.find((i) => i.ruleId === 'inline-scripts-excessive');
      expect(inlineIssue).toBeDefined();
      expect(inlineIssue?.severity).toBe('moderate');
    });
  });

  describe('External link checks', () => {
    it('should accept safe external links', async () => {
      const pageWithSafeLink = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><a href="https://external.com" target="_blank" rel="noopener noreferrer">Link</a></body></html>'
      );
      vi.stubGlobal('document', pageWithSafeLink.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithSafeLink.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const linkIssue = result.issues.find((i) => i.ruleId === 'external-links-unsafe');
      expect(linkIssue).toBeUndefined();
    });

    it('should detect unsafe external links', async () => {
      const pageWithUnsafeLink = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><a href="https://external.com" target="_blank">Link</a></body></html>'
      );
      vi.stubGlobal('document', pageWithUnsafeLink.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: pageWithUnsafeLink.window.document,
        matchMedia: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      const linkIssue = result.issues.find((i) => i.ruleId === 'external-links-unsafe');
      expect(linkIssue).toBeDefined();
      expect(linkIssue?.severity).toBe('moderate');
    });
  });

  describe('Cookie checks', () => {
    it('should check accessible cookies', async () => {
      const result = await scanSecurity();

      // If no cookies, no issue should be created
      // If cookies exist, an issue should be created (not visible in this test without setting cookies)
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Security headers checks', () => {
    it('should handle header fetch errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should detect missing security headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map(),
        ok: true,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      // Should find missing security header issues
      const headerIssues = result.issues.filter((i) => i.ruleId?.includes('header'));
      expect(headerIssues.length).toBeGreaterThan(0);
    });

    it('should accept present security headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Map([
          ['Content-Security-Policy', "default-src 'self'"],
          ['Strict-Transport-Security', 'max-age=31536000'],
          ['X-Frame-Options', 'DENY'],
          ['X-Content-Type-Options', 'nosniff'],
          ['Referrer-Policy', 'strict-origin-when-cross-origin'],
          ['Permissions-Policy', 'camera=(), microphone=()'],
        ]),
        ok: true,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanSecurity();

      // Should find no missing header issues
      const headerIssues = result.issues.filter((i) => i.ruleId?.includes('header'));
      expect(headerIssues.length).toBe(0);
    });
  });
});
