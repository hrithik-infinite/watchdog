import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Issue } from '@/shared/types';

// Mock axe-core before importing scanner
const mockAxeRun = vi.fn();

vi.mock('axe-core', () => ({
  default: {
    run: mockAxeRun,
  },
}));

// Mock the messaging module
vi.mock('@/shared/messaging', () => ({
  onMessage: vi.fn(),
}));

// Mock fixes module
vi.mock('@/shared/fixes', () => ({
  generateFix: vi.fn(() => ({
    description: 'Fix description',
    code: '<fixed code>',
    learnMoreUrl: 'https://example.com/learn',
  })),
}));

// Mock scanner modules
vi.mock('../performance-scanner', () => ({
  scanPerformance: vi.fn(),
}));

vi.mock('../seo-scanner', () => ({
  scanSEO: vi.fn(),
}));

vi.mock('../security-scanner', () => ({
  scanSecurity: vi.fn(),
}));

vi.mock('../best-practices-scanner', () => ({
  scanBestPractices: vi.fn(),
}));

vi.mock('../pwa-scanner', () => ({
  scanPWA: vi.fn(),
}));

// Mock window and performance
const mockPerformanceNow = vi.fn();
const mockWindowLocation = { href: 'https://example.com' };

vi.stubGlobal('window', {
  location: mockWindowLocation,
  matchMedia: vi.fn(),
});

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

import { scanPage } from '../scanner';
import { scanPerformance } from '../performance-scanner';
import { scanSEO } from '../seo-scanner';
import { scanSecurity } from '../security-scanner';
import { scanBestPractices } from '../best-practices-scanner';
import { scanPWA } from '../pwa-scanner';

describe('Scanner - scanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(100);
  });

  describe('Basic scanning', () => {
    it('should scan page and return scan result', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBe(100);
      expect(result.issues).toEqual([]);
      expect(result.incomplete).toEqual([]);
    });

    it('should set correct URL from window.location', async () => {
      mockWindowLocation.href = 'https://mywebsite.com/page';
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.url).toBe('https://mywebsite.com/page');
    });

    it('should measure scan duration correctly', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      // Duration should be end time (100) - start time (0) = 100
      expect(result.duration).toBe(100);
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should set current timestamp', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      const beforeScan = Date.now();
      const result = await scanPage('accessibility');
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });
  });

  describe('Violation transformation', () => {
    it('should transform axe violations to issues', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Images must have alt text',
            description: 'All images must have alternative text',
            helpUrl: 'https://example.com/help',
            nodes: [
              {
                target: ['img.hero'],
                html: '<img class="hero">',
                failureSummary: 'Element has no alt attribute',
              },
            ],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.issues).toHaveLength(1);
      const issue = result.issues[0];
      expect(issue.id).toBeDefined();
      expect(issue.ruleId).toBe('image-alt');
      expect(issue.severity).toBe('critical');
      expect(issue.message).toBe('Images must have alt text');
    });

    it('should handle multiple nodes per violation', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'button-name',
            impact: 'serious',
            help: 'Button must have accessible name',
            description: 'Buttons must have accessible names',
            helpUrl: 'https://example.com/help',
            nodes: [
              {
                target: ['button.btn1'],
                html: '<button class="btn1"></button>',
                failureSummary: 'Button has no accessible name',
              },
              {
                target: ['button.btn2'],
                html: '<button class="btn2"></button>',
                failureSummary: 'Button has no accessible name',
              },
            ],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].element.selector).toBe('button.btn1');
      expect(result.issues[1].element.selector).toBe('button.btn2');
    });

    it('should handle complex CSS selectors', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'label',
            impact: 'moderate',
            help: 'Form field must have label',
            description: 'Form fields must have labels',
            helpUrl: 'https://example.com/help',
            nodes: [
              {
                target: [['body', 'main', 'form', 'input.email']],
                html: '<input class="email">',
                failureSummary: 'Form field has no label',
              },
            ],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].element.selector).toBe('body main form input.email');
    });

    it('should extract element information', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Images must have alt text',
            description: 'All images must have alternative text',
            helpUrl: 'https://example.com/help',
            nodes: [
              {
                target: ['img.hero'],
                html: '<img class="hero" src="test.jpg">',
                failureSummary: 'Element has no alt attribute',
              },
            ],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');
      const issue = result.issues[0];

      expect(issue.element.selector).toBe('img.hero');
      expect(issue.element.html).toBe('<img class="hero" src="test.jpg">');
      expect(issue.element.failureSummary).toBe('Element has no alt attribute');
    });

    it('should map violation severity correctly', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'rule1',
            impact: 'critical',
            help: 'Critical issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'rule2',
            impact: 'serious',
            help: 'Serious issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'rule3',
            impact: 'moderate',
            help: 'Moderate issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'rule4',
            impact: 'minor',
            help: 'Minor issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.issues).toHaveLength(4);
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[1].severity).toBe('serious');
      expect(result.issues[2].severity).toBe('moderate');
      expect(result.issues[3].severity).toBe('minor');
    });

    it('should map violation categories correctly', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Image issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'button-name',
            impact: 'critical',
            help: 'Button issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'label',
            impact: 'critical',
            help: 'Form issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.issues[0].category).toBe('images');
      expect(result.issues[1].category).toBe('interactive');
      expect(result.issues[2].category).toBe('forms');
    });

    it('should extract WCAG criteria', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Images must have alt text',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');
      const issue = result.issues[0];

      expect(issue.wcag).toBeDefined();
      expect(issue.wcag.id).toBe('1.1.1');
      expect(issue.wcag.level).toBe('A');
      expect(issue.wcag.name).toBeDefined();
    });

    it('should use fallback WCAG criteria for unknown rules', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'unknown-rule-xyz',
            impact: 'critical',
            help: 'Unknown issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');
      const issue = result.issues[0];

      expect(issue.wcag.id).toBe('N/A');
      expect(issue.wcag.name).toBe('Unknown');
    });

    it('should generate unique issue IDs', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Issue 1',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [
              { target: ['selector1'], html: '<div>', failureSummary: 'test' },
              { target: ['selector2'], html: '<div>', failureSummary: 'test' },
            ],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.issues[0].id).not.toBe(result.issues[1].id);
      expect(result.issues[0].id).toMatch(/^issue-/);
      expect(result.issues[1].id).toMatch(/^issue-/);
    });
  });

  describe('Incomplete violations', () => {
    it('should handle incomplete violations', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [
          {
            id: 'color-contrast',
            impact: 'serious',
            help: 'Color contrast may be insufficient',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [
              {
                target: ['p.text'],
                html: '<p class="text">Text</p>',
                failureSummary: 'Color contrast may be insufficient',
              },
            ],
          },
        ],
      });

      const result = await scanPage('accessibility');

      expect(result.incomplete).toHaveLength(1);
      expect(result.incomplete[0].ruleId).toBe('color-contrast');
    });

    it('should include both violations and incomplete', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Image issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [
          {
            id: 'color-contrast',
            impact: 'serious',
            help: 'Contrast issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
      });

      const result = await scanPage('accessibility');

      expect(result.issues).toHaveLength(1);
      expect(result.incomplete).toHaveLength(1);
    });
  });

  describe('Summary generation', () => {
    it('should generate correct summary', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Issue 1',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'button-name',
            impact: 'serious',
            help: 'Issue 2',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.summary.total).toBe(2);
      expect(result.summary.bySeverity.critical).toBe(1);
      expect(result.summary.bySeverity.serious).toBe(1);
      expect(result.summary.bySeverity.moderate).toBe(0);
      expect(result.summary.bySeverity.minor).toBe(0);
    });

    it('should count issues by category in summary', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Image issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'button-name',
            impact: 'critical',
            help: 'Button issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
          {
            id: 'label',
            impact: 'critical',
            help: 'Form issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.summary.byCategory.images).toBe(1);
      expect(result.summary.byCategory.interactive).toBe(1);
      expect(result.summary.byCategory.forms).toBe(1);
      expect(result.summary.byCategory.color).toBe(0);
    });

    it('should have zero counts when no issues found', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.summary.total).toBe(0);
      expect(result.summary.bySeverity.critical).toBe(0);
      expect(result.summary.bySeverity.serious).toBe(0);
      expect(result.summary.bySeverity.moderate).toBe(0);
      expect(result.summary.bySeverity.minor).toBe(0);
      expect(result.summary.byCategory.images).toBe(0);
      expect(result.summary.byCategory.interactive).toBe(0);
      expect(result.summary.byCategory.forms).toBe(0);
    });

    it('should sum multiple issues in same severity/category', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Issue 1',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [
              { target: ['selector1'], html: '<div>', failureSummary: 'test' },
              { target: ['selector2'], html: '<div>', failureSummary: 'test' },
            ],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(result.summary.total).toBe(2);
      expect(result.summary.bySeverity.critical).toBe(2);
      expect(result.summary.byCategory.images).toBe(2);
    });
  });

  describe('Axe configuration', () => {
    it('should call axe.run with document and configuration', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      await scanPage('accessibility');

      expect(mockAxeRun).toHaveBeenCalled();
      const [doc, config] = mockAxeRun.mock.calls[0];
      expect(doc).toBe(document);
      expect(config).toBeDefined();
      expect(config.runOnly).toBeDefined();
      expect(config.runOnly.type).toBe('rule');
      expect(Array.isArray(config.runOnly.values)).toBe(true);
    });

    it('should request violations and incomplete results', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      await scanPage('accessibility');

      const config = mockAxeRun.mock.calls[0][1];
      expect(config.resultTypes).toContain('violations');
      expect(config.resultTypes).toContain('incomplete');
    });
  });

  describe('Error handling', () => {
    it('should handle axe.run errors', async () => {
      mockAxeRun.mockRejectedValue(new Error('Axe error'));

      await expect(scanPage('accessibility')).rejects.toThrow('Axe error');
    });

    it('should handle response with violations and incomplete', async () => {
      mockAxeRun.mockResolvedValue({
        violations: [],
        incomplete: [],
      });

      // Should work fine with empty arrays
      const result = await scanPage('accessibility');
      expect(result.issues).toHaveLength(0);
      expect(result.incomplete).toHaveLength(0);
    });
  });

  describe('Fix generation', () => {
    it('should generate fix suggestions for issues', async () => {
      const { generateFix } = await import('@/shared/fixes');

      mockAxeRun.mockResolvedValue({
        violations: [
          {
            id: 'image-alt',
            impact: 'critical',
            help: 'Issue',
            description: 'Description',
            helpUrl: 'https://example.com/help',
            nodes: [{ target: ['selector'], html: '<div>', failureSummary: 'test' }],
          },
        ],
        incomplete: [],
      });

      const result = await scanPage('accessibility');

      expect(generateFix).toHaveBeenCalled();
      expect(result.issues[0].fix).toBeDefined();
      expect(result.issues[0].fix.description).toBe('Fix description');
      expect(result.issues[0].fix.code).toBe('<fixed code>');
    });
  });

  describe('Other audit types', () => {
    it('should delegate performance audit to scanPerformance', async () => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
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

      (scanPerformance as any).mockResolvedValue(mockResult);

      const result = await scanPage('performance');

      expect(scanPerformance).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should delegate seo audit to scanSEO', async () => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
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

      (scanSEO as any).mockResolvedValue(mockResult);

      const result = await scanPage('seo');

      expect(scanSEO).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should delegate security audit to scanSecurity', async () => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
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

      (scanSecurity as any).mockResolvedValue(mockResult);

      const result = await scanPage('security');

      expect(scanSecurity).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should delegate best-practices audit to scanBestPractices', async () => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
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

      (scanBestPractices as any).mockResolvedValue(mockResult);

      const result = await scanPage('best-practices');

      expect(scanBestPractices).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should delegate pwa audit to scanPWA', async () => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
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

      (scanPWA as any).mockResolvedValue(mockResult);

      const result = await scanPage('pwa');

      expect(scanPWA).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should throw error for mobile audit type', async () => {
      await expect(scanPage('mobile')).rejects.toThrow('mobile audit is not yet implemented');
    });

    it('should throw error for links audit type', async () => {
      await expect(scanPage('links')).rejects.toThrow('links audit is not yet implemented');
    });

    it('should throw error for i18n audit type', async () => {
      await expect(scanPage('i18n')).rejects.toThrow('i18n audit is not yet implemented');
    });

    it('should throw error for privacy audit type', async () => {
      await expect(scanPage('privacy')).rejects.toThrow('privacy audit is not yet implemented');
    });

    it('should throw error for unknown audit type', async () => {
      // Type assertion needed since 'unknown' is not in AuditType
      await expect(scanPage('unknown' as any)).rejects.toThrow('Unknown audit type: unknown');
    });

    it('should throw error when audit type is invalid', async () => {
      await expect(scanPage('invalid-type' as any)).rejects.toThrow(
        'Unknown audit type: invalid-type'
      );
    });
  });
});
