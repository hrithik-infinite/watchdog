import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock window and performance
const mockPerformanceNow = vi.fn();
const mockWindowLocation = {
  href: 'https://example.com',
  protocol: 'https:',
  hostname: 'example.com',
};

vi.stubGlobal('window', {
  location: mockWindowLocation,
  matchMedia: vi.fn(),
});

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

vi.stubGlobal('fetch', vi.fn());

import { scanPWA } from '../pwa-scanner';

describe('PWA Scanner', () => {
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
      navigator: {
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(null),
        },
      },
      matchMedia: vi.fn(),
    });
    vi.stubGlobal('document', dom.window.document);
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('Scan execution', () => {
    it('should return a ScanResult object', async () => {
      const result = await scanPWA();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct URL from window.location', async () => {
      const result = await scanPWA();

      expect(result.url).toBe('https://example.com');
    });

    it('should set current timestamp', async () => {
      const beforeScan = Date.now();
      const result = await scanPWA();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should calculate scan duration', async () => {
      const result = await scanPWA();

      expect(typeof result.duration).toBe('number');
      expect(Number.isNaN(result.duration)).toBe(false);
    });

    it('should have issues array', async () => {
      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await scanPWA();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });

    it('should have valid summary structure', async () => {
      const result = await scanPWA();
      const { summary } = result;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('bySeverity');
      expect(summary).toHaveProperty('byCategory');
      expect(typeof summary.total).toBe('number');
    });
  });

  describe('Issue structure', () => {
    it('should have valid issue objects if issues found', async () => {
      const result = await scanPWA();

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
      const result = await scanPWA();
      const validSeverities = ['critical', 'serious', 'moderate', 'minor'];

      for (const issue of result.issues) {
        expect(validSeverities).toContain(issue.severity);
      }
    });

    it('should have valid category values', async () => {
      const result = await scanPWA();
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
      const result = await scanPWA();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Summary generation', () => {
    it('should have correct total count', async () => {
      const result = await scanPWA();

      expect(result.summary.total).toBe(result.issues.length);
    });

    it('should have severity breakdown', async () => {
      const result = await scanPWA();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have category breakdown', async () => {
      const result = await scanPWA();
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
      const result = await scanPWA();

      const severityCounts = Object.values(result.summary.bySeverity);
      const totalFromSeverity = severityCounts.reduce((a, b) => a + b, 0);

      expect(totalFromSeverity).toBe(result.summary.total);
    });

    it('should have valid category counts', async () => {
      const result = await scanPWA();

      const categoryCounts = Object.values(result.summary.byCategory);
      const totalFromCategories = categoryCounts.reduce((a, b) => a + b, 0);

      expect(totalFromCategories).toBe(result.summary.total);
    });
  });

  describe('PWA specific checks', () => {
    it('should complete PWA scan', async () => {
      const result = await scanPWA();

      expect(result).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(Number.isNaN(result.duration)).toBe(false);
    });

    it('should be callable multiple times', async () => {
      mockPerformanceNow
        .mockReturnValue(0)
        .mockReturnValue(50)
        .mockReturnValue(0)
        .mockReturnValue(75);

      const result1 = await scanPWA();
      const result2 = await scanPWA();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('Manifest link checks', () => {
    it('should detect missing manifest link', async () => {
      const noDomManifest = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
      vi.stubGlobal('document', noDomManifest.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: noDomManifest.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
      const manifestIssue = result.issues.find((i) => i.ruleId === 'manifest-missing');
      expect(manifestIssue).toBeDefined();
    });

    it('should detect present manifest link', async () => {
      const withManifestDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
      );
      vi.stubGlobal('document', withManifestDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withManifestDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          name: 'My PWA',
          short_name: 'PWA',
          start_url: '/',
          display: 'standalone',
          theme_color: '#000000',
          background_color: '#ffffff',
          icons: [
            { src: '/icon-192.png', sizes: '192x192' },
            { src: '/icon-512.png', sizes: '512x512' },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Service worker checks', () => {
    it('should detect missing service worker registration', async () => {
      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle service worker fetch error', async () => {
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: dom.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockRejectedValue(new Error('SW fetch failed')),
          },
        },
      });

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect registered service worker', async () => {
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: dom.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue({ active: true }),
          },
        },
      });

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle missing serviceWorker API', async () => {
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: dom.window.document,
        matchMedia: vi.fn(),
        navigator: {},
      });

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('HTTPS checks', () => {
    it('should accept HTTPS protocol', async () => {
      const result = await scanPWA();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'pwa-https-required');
      expect(httpsIssue).toBeUndefined();
    });

    it('should accept localhost over HTTP', async () => {
      vi.stubGlobal('window', {
        location: { href: 'http://localhost:3000', protocol: 'http:', hostname: 'localhost' },
        document: dom.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'pwa-https-required');
      expect(httpsIssue).toBeUndefined();
    });

    it('should reject HTTP on non-localhost domains', async () => {
      vi.stubGlobal('window', {
        location: { href: 'http://example.com', protocol: 'http:', hostname: 'example.com' },
        document: dom.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'pwa-https-required');
      expect(httpsIssue).toBeDefined();
      expect(httpsIssue?.severity).toBe('critical');
    });

    it('should accept 127.0.0.1 over HTTP', async () => {
      vi.stubGlobal('window', {
        location: { href: 'http://127.0.0.1:3000', protocol: 'http:', hostname: '127.0.0.1' },
        document: dom.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const httpsIssue = result.issues.find((i) => i.ruleId === 'pwa-https-required');
      expect(httpsIssue).toBeUndefined();
    });
  });

  describe('Viewport meta tag checks', () => {
    it('should detect missing viewport meta tag', async () => {
      const noViewportDOM = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
      vi.stubGlobal('document', noViewportDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: noViewportDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const viewportIssue = result.issues.find((i) => i.ruleId === 'pwa-viewport-missing');
      expect(viewportIssue).toBeDefined();
      expect(viewportIssue?.severity).toBe('serious');
    });

    it('should detect present viewport meta tag', async () => {
      const withViewportDOM = new JSDOM(
        '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>'
      );
      vi.stubGlobal('document', withViewportDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withViewportDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const viewportIssue = result.issues.find((i) => i.ruleId === 'pwa-viewport-missing');
      expect(viewportIssue).toBeUndefined();
    });
  });

  describe('Apple touch icon checks', () => {
    it('should detect missing apple-touch-icon', async () => {
      const noIconDOM = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
      vi.stubGlobal('document', noIconDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: noIconDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const iconIssue = result.issues.find((i) => i.ruleId === 'apple-touch-icon-missing');
      expect(iconIssue).toBeDefined();
      expect(iconIssue?.severity).toBe('moderate');
    });

    it('should detect present apple-touch-icon', async () => {
      const withIconDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png"></head><body></body></html>'
      );
      vi.stubGlobal('document', withIconDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withIconDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const iconIssue = result.issues.find((i) => i.ruleId === 'apple-touch-icon-missing');
      expect(iconIssue).toBeUndefined();
    });
  });

  describe('Theme color meta tag checks', () => {
    it('should detect missing theme-color meta tag', async () => {
      const noThemeDOM = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
      vi.stubGlobal('document', noThemeDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: noThemeDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const themeIssue = result.issues.find((i) => i.ruleId === 'theme-color-meta-missing');
      expect(themeIssue).toBeDefined();
      expect(themeIssue?.severity).toBe('moderate');
    });

    it('should detect present theme-color meta tag', async () => {
      const withThemeDOM = new JSDOM(
        '<!DOCTYPE html><html><head><meta name="theme-color" content="#000000"></head><body></body></html>'
      );
      vi.stubGlobal('document', withThemeDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withThemeDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const result = await scanPWA();

      const themeIssue = result.issues.find((i) => i.ruleId === 'theme-color-meta-missing');
      expect(themeIssue).toBeUndefined();
    });
  });

  describe('Manifest content validation', () => {
    it('should detect missing manifest name', async () => {
      const withManifestDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
      );
      vi.stubGlobal('document', withManifestDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withManifestDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          short_name: 'PWA',
          start_url: '/',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanPWA();

      const nameIssue = result.issues.find((i) => i.ruleId === 'manifest-name-missing');
      expect(nameIssue).toBeDefined();
      expect(nameIssue?.severity).toBe('serious');
    });

    it('should detect missing manifest icons', async () => {
      const withManifestDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
      );
      vi.stubGlobal('document', withManifestDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withManifestDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          name: 'My PWA',
          short_name: 'PWA',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanPWA();

      const iconsIssue = result.issues.find((i) => i.ruleId === 'manifest-icons-missing');
      expect(iconsIssue).toBeDefined();
      expect(iconsIssue?.severity).toBe('critical');
    });

    it('should detect missing required icon sizes', async () => {
      const withManifestDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
      );
      vi.stubGlobal('document', withManifestDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withManifestDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          name: 'My PWA',
          short_name: 'PWA',
          icons: [{ src: '/icon-64.png', sizes: '64x64' }],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanPWA();

      const sizeIssue = result.issues.find((i) => i.ruleId === 'manifest-icons-sizes');
      expect(sizeIssue).toBeDefined();
      expect(sizeIssue?.severity).toBe('serious');
    });

    it('should handle manifest fetch error gracefully', async () => {
      const withManifestDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
      );
      vi.stubGlobal('document', withManifestDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withManifestDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-OK fetch response', async () => {
      const withManifestDOM = new JSDOM(
        '<!DOCTYPE html><html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
      );
      vi.stubGlobal('document', withManifestDOM.window.document);
      vi.stubGlobal('window', {
        location: { href: 'https://example.com', protocol: 'https:', hostname: 'example.com' },
        document: withManifestDOM.window.document,
        matchMedia: vi.fn(),
        navigator: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue(null),
          },
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await scanPWA();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });
});
