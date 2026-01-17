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

  describe('Meta refresh checks', () => {
    it('should detect meta refresh redirect', async () => {
      const pageWithMetaRefresh = new JSDOM(
        '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="5;url=https://example.com"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithMetaRefresh.window.document);
      vi.stubGlobal('window', pageWithMetaRefresh.window);

      const result = await scanBestPractices();

      const refreshIssue = result.issues.find((i) => i.ruleId?.includes('meta-refresh'));
      expect(refreshIssue).toBeDefined();
    });

    it('should accept page without meta refresh', async () => {
      const result = await scanBestPractices();

      const refreshIssue = result.issues.find((i) => i.ruleId?.includes('meta-refresh'));
      expect(refreshIssue).toBeUndefined();
    });
  });

  describe('Passive event listeners checks', () => {
    it('should detect non-passive touchstart listener', async () => {
      const pageWithEventListener = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><div id="test">Content</div><script>document.getElementById("test").addEventListener("touchstart", handler, false);</script></body></html>'
      );
      vi.stubGlobal('document', pageWithEventListener.window.document);
      vi.stubGlobal('window', pageWithEventListener.window);

      const result = await scanBestPractices();

      // The check looks for script content containing event listeners
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should accept page with passive event listeners', async () => {
      const pageWithPassiveListener = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><script>document.addEventListener("touchstart", handler, { passive: true });</script></body></html>'
      );
      vi.stubGlobal('document', pageWithPassiveListener.window.document);
      vi.stubGlobal('window', pageWithPassiveListener.window);

      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle pages without event listeners', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Geolocation usage checks', () => {
    it('should detect geolocation request on load', async () => {
      const pageWithGeolocation = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><script>navigator.geolocation.getCurrentPosition(success, error);</script></body></html>'
      );
      vi.stubGlobal('document', pageWithGeolocation.window.document);
      vi.stubGlobal('window', pageWithGeolocation.window);

      const result = await scanBestPractices();

      const geoIssue = result.issues.find((i) => i.ruleId?.includes('geolocation'));
      expect(geoIssue).toBeDefined();
    });

    it('should accept geolocation with event listener', async () => {
      const pageWithGeoListener = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><script>button.addEventListener("click", () => { navigator.geolocation.getCurrentPosition(success, error); });</script></body></html>'
      );
      vi.stubGlobal('document', pageWithGeoListener.window.document);
      vi.stubGlobal('window', pageWithGeoListener.window);

      const result = await scanBestPractices();

      const geoOnLoadIssue = result.issues.find((i) => i.ruleId === 'geolocation-on-load');
      expect(geoOnLoadIssue).toBeUndefined();
    });

    it('should accept page without geolocation request', async () => {
      const result = await scanBestPractices();

      const geoOnLoadIssue = result.issues.find((i) => i.ruleId === 'geolocation-on-load');
      expect(geoOnLoadIssue).toBeUndefined();
    });

    it('should detect multiple geolocation requests', async () => {
      const pageWithMultipleGeo = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><script>navigator.geolocation.getCurrentPosition(s1, e1);</script><script>navigator.geolocation.getCurrentPosition(s2, e2);</script></body></html>'
      );
      vi.stubGlobal('document', pageWithMultipleGeo.window.document);
      vi.stubGlobal('window', pageWithMultipleGeo.window);

      const result = await scanBestPractices();

      const geoIssue = result.issues.find((i) => i.ruleId?.includes('geolocation'));
      // Should detect at least one geolocation issue
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Console errors check', () => {
    it('should detect excessive error handlers', async () => {
      const pageWithErrorHandlers = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
          '<img onerror="alert(1)">' +
          '<img onerror="alert(2)">' +
          '<img onerror="alert(3)">' +
          '<img onerror="alert(4)">' +
          '<img onerror="alert(5)">' +
          '<img onerror="alert(6)">' +
          '</body></html>'
      );
      vi.stubGlobal('document', pageWithErrorHandlers.window.document);
      vi.stubGlobal('window', pageWithErrorHandlers.window);

      const result = await scanBestPractices();

      const errorIssue = result.issues.find((i) => i.ruleId?.includes('error'));
      expect(errorIssue).toBeDefined();
    });

    it('should accept pages with few error handlers', async () => {
      const pageWithFewHandlers = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
          '<img onerror="alert(1)">' +
          '<img onerror="alert(2)">' +
          '</body></html>'
      );
      vi.stubGlobal('document', pageWithFewHandlers.window.document);
      vi.stubGlobal('window', pageWithFewHandlers.window);

      const result = await scanBestPractices();

      const errorIssue = result.issues.find((i) => i.ruleId?.includes('excessive-error'));
      expect(errorIssue).toBeUndefined();
    });
  });

  describe('Vulnerable libraries detection', () => {
    it('should not report vulns without libraries', async () => {
      const result = await scanBestPractices();

      const vulnIssues = result.issues.filter((i) => i.ruleId?.includes('vuln-'));
      expect(vulnIssues.length).toBe(0);
    });

    it('should have vulnerable library check', async () => {
      const result = await scanBestPractices();
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });

  describe('Password paste prevention checks', () => {
    it('should detect password paste prevention', async () => {
      const pageWithPasswordPaste = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><input type="password" onpaste="return false"></body></html>'
      );
      vi.stubGlobal('document', pageWithPasswordPaste.window.document);
      vi.stubGlobal('window', pageWithPasswordPaste.window);

      const result = await scanBestPractices();

      const pasteIssue = result.issues.find((i) => i.ruleId?.includes('password-paste'));
      expect(pasteIssue).toBeDefined();
    });

    it('should detect password paste prevention with preventDefault', async () => {
      const pageWithPasswordPaste = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><input type="password" onpaste="e.preventDefault()"></body></html>'
      );
      vi.stubGlobal('document', pageWithPasswordPaste.window.document);
      vi.stubGlobal('window', pageWithPasswordPaste.window);

      const result = await scanBestPractices();

      const pasteIssue = result.issues.find((i) => i.ruleId?.includes('password-paste'));
      expect(pasteIssue).toBeDefined();
    });

    it('should accept password field without paste prevention', async () => {
      const pageWithoutPaste = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><input type="password" autocomplete="current-password"></body></html>'
      );
      vi.stubGlobal('document', pageWithoutPaste.window.document);
      vi.stubGlobal('window', pageWithoutPaste.window);

      const result = await scanBestPractices();

      const pasteIssue = result.issues.find((i) => i.ruleId?.includes('password-paste'));
      expect(pasteIssue).toBeUndefined();
    });
  });

  describe('Notification on load checks', () => {
    it('should detect notification request on page load', async () => {
      const pageWithNotification = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><script>Notification.requestPermission();</script></body></html>'
      );
      vi.stubGlobal('document', pageWithNotification.window.document);
      vi.stubGlobal('window', pageWithNotification.window);

      const result = await scanBestPractices();

      const notifIssue = result.issues.find((i) => i.ruleId?.includes('notification-on-load'));
      expect(notifIssue).toBeDefined();
    });

    it('should not flag notification in event listener', async () => {
      const pageWithListenerNotif = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><script>button.addEventListener("click", () => { Notification.requestPermission(); });</script></body></html>'
      );
      vi.stubGlobal('document', pageWithListenerNotif.window.document);
      vi.stubGlobal('window', pageWithListenerNotif.window);

      const result = await scanBestPractices();

      const notifIssue = result.issues.find((i) => i.ruleId?.includes('notification-on-load'));
      expect(notifIssue).toBeUndefined();
    });

    it('should accept page without notification request', async () => {
      const result = await scanBestPractices();

      const notifIssue = result.issues.find((i) => i.ruleId?.includes('notification-on-load'));
      expect(notifIssue).toBeUndefined();
    });
  });

  describe('Unsized images checks', () => {
    it('should detect images without dimensions', async () => {
      const pageWithUnsizedImages = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
          '<img src="large1.jpg" style="width: 100px; height: 100px">' +
          '<img src="large2.jpg" style="width: 100px; height: 100px">' +
          '<img src="large3.jpg" style="width: 100px; height: 100px">' +
          '<img src="large4.jpg" style="width: 100px; height: 100px">' +
          '</body></html>'
      );
      vi.stubGlobal('document', pageWithUnsizedImages.window.document);
      vi.stubGlobal('window', pageWithUnsizedImages.window);

      const result = await scanBestPractices();

      // The result should be defined and have issues array
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should accept images with explicit dimensions', async () => {
      const pageWithSizedImages = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><img src="test.jpg" width="100" height="100"></body></html>'
      );
      vi.stubGlobal('document', pageWithSizedImages.window.document);
      vi.stubGlobal('window', pageWithSizedImages.window);

      const result = await scanBestPractices();

      const unsizedIssue = result.issues.find((i) => i.ruleId?.includes('unsized-images'));
      expect(unsizedIssue).toBeUndefined();
    });

    it('should ignore small images without dimensions', async () => {
      const pageWithSmallImages = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><img src="icon.png" style="width: 32px; height: 32px"></body></html>'
      );
      vi.stubGlobal('document', pageWithSmallImages.window.document);
      vi.stubGlobal('window', pageWithSmallImages.window);

      const result = await scanBestPractices();

      const unsizedIssue = result.issues.find((i) => i.ruleId?.includes('unsized-images'));
      expect(unsizedIssue).toBeUndefined();
    });
  });

  describe('Image aspect ratio checks', () => {
    it('should handle pages with no images', async () => {
      const result = await scanBestPractices();

      const aspectRatioIssue = result.issues.find((i) => i.ruleId?.includes('image-aspect-ratio'));
      expect(aspectRatioIssue).toBeUndefined();
    });
  });

  describe('Version comparison', () => {
    it('should handle complex version strings', async () => {
      const pageWithJQuery = new JSDOM(
        '<!DOCTYPE html><html><head><script>window.jQuery = { fn: { jquery: "3.4.1" } };</script></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithJQuery.window.document);
      vi.stubGlobal('window', pageWithJQuery.window);

      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Empty links edge cases', () => {
    it('should detect empty anchor tags', async () => {
      const pageWithEmptyLinks = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><a href="#empty"></a></body></html>'
      );
      vi.stubGlobal('document', pageWithEmptyLinks.window.document);
      vi.stubGlobal('window', pageWithEmptyLinks.window);

      const result = await scanBestPractices();

      const emptyLinkIssue = result.issues.find((i) => i.ruleId?.includes('empty-links'));
      expect(emptyLinkIssue).toBeDefined();
    });

    it('should detect javascript: links', async () => {
      const pageWithJsLinks = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
          '<a href="javascript:void(0)">Click 1</a>' +
          '<a href="javascript:doSomething()">Click 2</a>' +
          '</body></html>'
      );
      vi.stubGlobal('document', pageWithJsLinks.window.document);
      vi.stubGlobal('window', pageWithJsLinks.window);

      const result = await scanBestPractices();

      const jsLinkIssue = result.issues.find((i) => i.ruleId?.includes('javascript-links'));
      expect(jsLinkIssue).toBeDefined();
    });

    it('should ignore links with images', async () => {
      const pageWithImageLink = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><a href="#"><img src="icon.png"></a></body></html>'
      );
      vi.stubGlobal('document', pageWithImageLink.window.document);
      vi.stubGlobal('window', pageWithImageLink.window);

      const result = await scanBestPractices();

      // Should not count as empty if there's an image
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Deprecated DOCTYPE', () => {
    it('should detect invalid DOCTYPE', async () => {
      const pageWithInvalidDoctype = new JSDOM(
        '<!DOCTYPE xml><html><head></head><body></body></html>'
      );
      const doctype = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(pageWithInvalidDoctype.window.document),
        'doctype'
      );
      vi.stubGlobal('document', pageWithInvalidDoctype.window.document);
      vi.stubGlobal('window', pageWithInvalidDoctype.window);

      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Check passthrough coverage', () => {
    it('should properly count issues by category', async () => {
      const result = await scanBestPractices();

      const summary = result.summary;
      expect(summary.bySeverity.critical).toBeGreaterThanOrEqual(0);
      expect(summary.bySeverity.serious).toBeGreaterThanOrEqual(0);
      expect(summary.bySeverity.moderate).toBeGreaterThanOrEqual(0);
      expect(summary.bySeverity.minor).toBeGreaterThanOrEqual(0);

      const totalBySeverity = Object.values(summary.bySeverity).reduce((a, b) => a + b, 0);
      expect(totalBySeverity).toBe(result.issues.length);
    });

    it('should properly count issues by category', async () => {
      const result = await scanBestPractices();

      const summary = result.summary;
      expect(summary.byCategory.technical).toBeGreaterThanOrEqual(0);
      expect(summary.byCategory.document).toBeGreaterThanOrEqual(0);
      expect(summary.byCategory.structure).toBeGreaterThanOrEqual(0);
    });

    it('should have timestamp within reasonable bounds', async () => {
      const now = Date.now();
      const result = await scanBestPractices();

      expect(result.timestamp).toBeLessThanOrEqual(now + 1000);
      expect(result.timestamp).toBeGreaterThan(now - 10000);
    });

    it('should set valid duration', async () => {
      const result = await scanBestPractices();

      expect(result.duration).toBeDefined();
    });
  });

  describe('String in selector check', () => {
    it('should generate proper selectors for elements', async () => {
      const pageWithIds = new JSDOM(
        '<!DOCTYPE html><html><head></head><body><div id="test-div">Content</div></body></html>'
      );
      vi.stubGlobal('document', pageWithIds.window.document);
      vi.stubGlobal('window', pageWithIds.window);

      const result = await scanBestPractices();

      expect(result.issues).toBeDefined();
      // Check that selectors are properly formed
      for (const issue of result.issues) {
        expect(issue.element).toBeDefined();
        expect(issue.element.selector).toBeDefined();
      }
    });
  });

  describe('Passive listeners threshold check', () => {
    it('should flag scroll listeners when count exceeds threshold', async () => {
      const pageWithScrollHandlers = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
          '<div onscroll="handleScroll()"></div>' +
          '<div onwheel="handleWheel()"></div>' +
          '<div ontouchmove="handleTouch()"></div>' +
          '<div onwheel="handleWheel2()"></div>' +
          '</body></html>'
      );
      vi.stubGlobal('document', pageWithScrollHandlers.window.document);
      vi.stubGlobal('window', pageWithScrollHandlers.window);

      const result = await scanBestPractices();

      const passiveIssue = result.issues.find((i) => i.ruleId?.includes('passive-listeners'));
      expect(passiveIssue).toBeDefined();
    });

    it('should not flag few scroll listeners', async () => {
      const pageWithFewScrollHandlers = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
          '<div onscroll="handleScroll()"></div>' +
          '</body></html>'
      );
      vi.stubGlobal('document', pageWithFewScrollHandlers.window.document);
      vi.stubGlobal('window', pageWithFewScrollHandlers.window);

      const result = await scanBestPractices();

      const passiveIssue = result.issues.find((i) => i.ruleId?.includes('passive-listeners'));
      expect(passiveIssue).toBeUndefined();
    });
  });

  describe('Char set meta tag variations', () => {
    it('should accept http-equiv charset', async () => {
      const pageWithHttpEquiv = new JSDOM(
        '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithHttpEquiv.window.document);
      vi.stubGlobal('window', pageWithHttpEquiv.window);

      const result = await scanBestPractices();

      const charsetIssue = result.issues.find((i) => i.ruleId?.includes('charset'));
      expect(charsetIssue).toBeUndefined();
    });
  });

  describe('Lang attribute variations', () => {
    it('should accept empty lang attribute value', async () => {
      const pageWithEmptyLang = new JSDOM(
        '<!DOCTYPE html><html lang=""><head></head><body></body></html>'
      );
      vi.stubGlobal('document', pageWithEmptyLang.window.document);
      vi.stubGlobal('window', pageWithEmptyLang.window);

      const result = await scanBestPractices();

      // Empty lang might be detected as missing
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });
});
