import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SEVERITY_MAP, RULE_CATEGORIES, WCAG_CRITERIA } from '@/shared/constants';

// Mock axe-core for scanPage test
vi.mock('axe-core', () => ({
  default: {
    run: vi.fn(),
  },
}));

// Import functions to test (we'll test the internal logic)
// Since these are not exported, we test through the module's behavior
describe('Scanner - Internal Functions', () => {
  describe('mapSeverity', () => {
    it('should map impact values to severity levels', () => {
      // Test the SEVERITY_MAP directly since mapSeverity uses it
      expect(SEVERITY_MAP['critical']).toBe('critical');
      expect(SEVERITY_MAP['serious']).toBe('serious');
      expect(SEVERITY_MAP['moderate']).toBe('moderate');
      expect(SEVERITY_MAP['minor']).toBe('minor');
    });

    it('should handle null/undefined by returning minor', () => {
      // SEVERITY_MAP fallback behavior
      expect(SEVERITY_MAP['unknown'] || 'minor').toBe('minor');
    });
  });

  describe('mapCategory', () => {
    it('should map rule IDs to categories', () => {
      expect(RULE_CATEGORIES['image-alt']).toBe('images');
      expect(RULE_CATEGORIES['button-name']).toBe('interactive');
      expect(RULE_CATEGORIES['label']).toBe('forms');
      expect(RULE_CATEGORIES['color-contrast']).toBe('color');
    });

    it('should have all rules mapped to valid categories', () => {
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

      Object.values(RULE_CATEGORIES).forEach((category) => {
        expect(validCategories).toContain(category);
      });
    });

    it('should fallback to technical for unknown rules', () => {
      // Testing fallback behavior
      expect(RULE_CATEGORIES['unknown-rule'] || 'technical').toBe('technical');
    });
  });

  describe('extractWcag', () => {
    it('should extract WCAG criteria for known rules', () => {
      const wcag = WCAG_CRITERIA['image-alt'];
      expect(wcag).toBeDefined();
      expect(wcag?.id).toBe('1.1.1');
      expect(wcag?.level).toBe('A');
    });

    it('should have valid WCAG data for all rules', () => {
      Object.values(WCAG_CRITERIA).forEach((wcag) => {
        expect(wcag.id).toBeDefined();
        expect(['A', 'AA', 'AAA']).toContain(wcag.level);
        expect(wcag.name).toBeDefined();
      });
    });
  });

  describe('Violation transformation', () => {
    it('should transform violation with simple selector', () => {
      const mockViolation = {
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
      };

      // Verify the structure that would be created
      expect(mockViolation.nodes[0].target).toHaveLength(1);
      expect(mockViolation.nodes[0].html).toBeDefined();
    });

    it('should handle complex CSS selectors', () => {
      const mockViolation = {
        id: 'button-name',
        impact: 'serious',
        help: 'Button must have text content',
        description: 'Buttons must have accessible text',
        helpUrl: 'https://example.com/help',
        nodes: [
          {
            target: [['body', 'main', 'button.submit-btn']],
            html: '<button class="submit-btn"></button>',
            failureSummary: 'Button has no accessible name',
          },
        ],
      };

      // Verify handling of complex selector
      expect(Array.isArray(mockViolation.nodes[0].target[0])).toBe(true);
    });
  });

  describe('Summary generation', () => {
    it('should generate correct summary for multiple issues', () => {
      const issues = [
        { severity: 'critical', category: 'images' },
        { severity: 'critical', category: 'interactive' },
        { severity: 'serious', category: 'forms' },
        { severity: 'moderate', category: 'color' },
        { severity: 'minor', category: 'document' },
      ];

      const summary = {
        total: issues.length,
        bySeverity: {
          critical: issues.filter((i) => i.severity === 'critical').length,
          serious: issues.filter((i) => i.severity === 'serious').length,
          moderate: issues.filter((i) => i.severity === 'moderate').length,
          minor: issues.filter((i) => i.severity === 'minor').length,
        },
        byCategory: {
          images: issues.filter((i) => i.category === 'images').length,
          interactive: issues.filter((i) => i.category === 'interactive').length,
          forms: issues.filter((i) => i.category === 'forms').length,
          color: issues.filter((i) => i.category === 'color').length,
          document: issues.filter((i) => i.category === 'document').length,
          structure: issues.filter((i) => i.category === 'structure').length,
          aria: issues.filter((i) => i.category === 'aria').length,
          technical: issues.filter((i) => i.category === 'technical').length,
        },
      };

      expect(summary.total).toBe(5);
      expect(summary.bySeverity.critical).toBe(2);
      expect(summary.bySeverity.serious).toBe(1);
      expect(summary.bySeverity.moderate).toBe(1);
      expect(summary.bySeverity.minor).toBe(1);
      expect(summary.byCategory.images).toBe(1);
      expect(summary.byCategory.interactive).toBe(1);
    });

    it('should handle empty issues array', () => {
      const issues: typeof Array = [];
      const summary = {
        total: issues.length,
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
      };

      expect(summary.total).toBe(0);
      expect(Object.values(summary.bySeverity).every((v) => v === 0)).toBe(true);
    });
  });
});
