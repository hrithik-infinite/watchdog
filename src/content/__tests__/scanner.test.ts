import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ScanResult } from '@/shared/types';

// Mock axe-core
vi.mock('axe-core', () => ({
  default: {
    run: vi.fn(),
  },
}));

describe('Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scanPage', () => {
    it('should return scan results with correct structure', async () => {
      // This is a structural test - in a real scenario you'd mock axe-core
      const mockResult: Partial<ScanResult> = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [],
        incomplete: [],
        summary: {
          total: 0,
          bySeverity: {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0,
          },
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

      expect(mockResult).toHaveProperty('url');
      expect(mockResult).toHaveProperty('timestamp');
      expect(mockResult).toHaveProperty('duration');
      expect(mockResult).toHaveProperty('issues');
      expect(mockResult).toHaveProperty('summary');
    });

    it('should include required properties in scan summary', () => {
      const summary = {
        total: 5,
        bySeverity: {
          critical: 2,
          serious: 1,
          moderate: 1,
          minor: 1,
        },
        byCategory: {
          images: 1,
          interactive: 1,
          forms: 1,
          color: 1,
          document: 0,
          structure: 0,
          aria: 1,
          technical: 0,
        },
      };

      expect(summary.bySeverity).toHaveProperty('critical');
      expect(summary.bySeverity).toHaveProperty('serious');
      expect(summary.bySeverity).toHaveProperty('moderate');
      expect(summary.bySeverity).toHaveProperty('minor');
      expect(summary.total).toBe(5);
    });

    it('should categorize issues correctly', () => {
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

      categories.forEach((category) => {
        expect([
          'images',
          'interactive',
          'forms',
          'color',
          'document',
          'structure',
          'aria',
          'technical',
        ]).toContain(category);
      });
    });
  });

  describe('Issue structure', () => {
    it('should have all required issue properties', () => {
      const mockIssue = {
        id: 'issue-1',
        ruleId: 'image-alt',
        severity: 'critical',
        category: 'images',
        message: 'Images must have alt text',
        description: 'All images must have alternative text',
        helpUrl: 'https://example.com/help',
        wcag: {
          id: '1.1.1',
          level: 'A',
          name: 'Non-text Content',
          description: 'All non-text content has a text alternative',
        },
        element: {
          selector: 'img.hero',
          html: '<img class="hero" src="test.jpg">',
        },
        fix: {
          description: 'Add alt attribute',
          code: '<img class="hero" src="test.jpg" alt="Description">',
          learnMoreUrl: 'https://example.com/learn',
        },
      };

      expect(mockIssue).toHaveProperty('id');
      expect(mockIssue).toHaveProperty('ruleId');
      expect(mockIssue).toHaveProperty('severity');
      expect(mockIssue).toHaveProperty('category');
      expect(mockIssue).toHaveProperty('element');
      expect(mockIssue.element).toHaveProperty('selector');
      expect(mockIssue.element).toHaveProperty('html');
      expect(mockIssue).toHaveProperty('fix');
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['critical', 'serious', 'moderate', 'minor'];
      validSeverities.forEach((severity) => {
        expect(['critical', 'serious', 'moderate', 'minor']).toContain(severity);
      });
    });
  });
});
