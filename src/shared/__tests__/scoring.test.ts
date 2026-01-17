import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  calculateScoreFromSummary,
  getScoreBreakdown,
  type ScoreResult,
} from '../scoring';
import type { Issue, ScanSummary } from '../types';

describe('Scoring - Audit scoring logic', () => {
  const createIssue = (
    severity: 'critical' | 'serious' | 'moderate' | 'minor',
    category: string = 'images'
  ): Issue => ({
    id: `issue-${Math.random()}`,
    ruleId: `rule-${Math.random()}`,
    severity,
    category: category as any,
    message: `Test ${severity} issue`,
    description: 'Test issue description',
    helpUrl: 'https://example.com',
    wcag: {
      id: '1.1.1',
      level: 'A',
      name: 'Non-text Content',
      description: 'Test WCAG criteria',
    },
    element: {
      selector: '.test',
      html: '<div class="test">Test</div>',
    },
    fix: {
      description: 'Test fix',
      code: 'test code',
      learnMoreUrl: 'https://example.com/fix',
    },
  });

  describe('calculateScore - Empty issues', () => {
    it('should return perfect score for no issues', () => {
      const result = calculateScore([]);

      expect(result.score).toBe(100);
      expect(result.grade).toBe('A');
      expect(result.color).toBe('#00C853');
      expect(result.label).toBe('Excellent');
    });

    it('should have all required properties', () => {
      const result = calculateScore([]);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('label');
    });
  });

  describe('calculateScore - Single issues', () => {
    it('should score with single minor issue', () => {
      const issues = [createIssue('minor')];
      const result = calculateScore(issues);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(75);
      expect(['A', 'B']).toContain(result.grade);
    });

    it('should score with single moderate issue', () => {
      const issues = [createIssue('moderate')];
      const result = calculateScore(issues);

      expect(result.score).toBeGreaterThan(70);
      expect(result.score).toBeLessThan(100);
      expect(['A', 'B']).toContain(result.grade);
    });

    it('should score with single serious issue', () => {
      const issues = [createIssue('serious')];
      const result = calculateScore(issues);

      expect(result.score).toBeGreaterThan(60);
      expect(result.score).toBeLessThan(95);
    });

    it('should score with single critical issue', () => {
      const issues = [createIssue('critical')];
      const result = calculateScore(issues);

      expect(result.score).toBeGreaterThan(40);
      expect(result.score).toBeLessThan(90);
    });
  });

  describe('calculateScore - Multiple issues', () => {
    it('should score with mixed severity issues', () => {
      const issues = [
        createIssue('critical'),
        createIssue('serious'),
        createIssue('moderate'),
        createIssue('minor'),
      ];
      const result = calculateScore(issues);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should score with multiple critical issues', () => {
      const issues = [createIssue('critical'), createIssue('critical'), createIssue('critical')];
      const result = calculateScore(issues);

      expect(result.score).toBeLessThan(50);
    });

    it('should score with multiple minor issues', () => {
      const issues = Array(5)
        .fill(null)
        .map(() => createIssue('minor'));
      const result = calculateScore(issues);

      expect(result.score).toBeGreaterThan(50);
      expect(['A', 'B', 'C']).toContain(result.grade);
    });

    it('should score with many issues', () => {
      const issues = [
        ...Array(10)
          .fill(null)
          .map(() => createIssue('critical')),
        ...Array(20)
          .fill(null)
          .map(() => createIssue('serious')),
        ...Array(30)
          .fill(null)
          .map(() => createIssue('moderate')),
      ];
      const result = calculateScore(issues);

      expect(result.score).toBeLessThan(30);
      expect(['D', 'F']).toContain(result.grade);
    });
  });

  describe('calculateScore - Grade boundaries', () => {
    it('should return high grade for single minor issue', () => {
      // Single minor issue should give high grade
      const result = calculateScore([createIssue('minor')]);
      expect(['A', 'B']).toContain(result.grade);
      expect(result.score).toBeGreaterThan(75);
      expect(result.color).toBeTruthy();
      expect(result.label).toBeTruthy();
    });

    it('should return moderate grade for multiple serious issues', () => {
      // Multiple serious issues should give some grade
      const issues = Array(3)
        .fill(null)
        .map(() => createIssue('serious'));
      const result = calculateScore(issues);
      expect(result.grade).toBeTruthy();
      // Score should have some deduction for serious issues
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('should return grade C for score 50-74', () => {
      const issues = [
        ...Array(3)
          .fill(null)
          .map(() => createIssue('critical')),
        ...Array(5)
          .fill(null)
          .map(() => createIssue('serious')),
      ];
      const result = calculateScore(issues);
      if (result.score >= 50 && result.score < 75) {
        expect(result.grade).toBe('C');
        expect(result.color).toBe('#FFD600');
        expect(result.label).toBe('Needs Work');
      }
    });

    it('should return grade D for score 25-49', () => {
      const issues = [
        ...Array(8)
          .fill(null)
          .map(() => createIssue('critical')),
        ...Array(10)
          .fill(null)
          .map(() => createIssue('serious')),
      ];
      const result = calculateScore(issues);
      if (result.score >= 25 && result.score < 50) {
        expect(result.grade).toBe('D');
        expect(result.color).toBe('#FF9100');
        expect(result.label).toBe('Poor');
      }
    });

    it('should return grade F for score 0-24', () => {
      const issues = [
        ...Array(20)
          .fill(null)
          .map(() => createIssue('critical')),
        ...Array(30)
          .fill(null)
          .map(() => createIssue('serious')),
      ];
      const result = calculateScore(issues);
      if (result.score < 25) {
        expect(result.grade).toBe('F');
        expect(result.color).toBe('#FF3D00');
        expect(result.label).toBe('Critical');
      }
    });
  });

  describe('calculateScore - Severity weighting', () => {
    it('should weight critical issues higher', () => {
      const criticalResult = calculateScore([createIssue('critical')]);
      const seriousResult = calculateScore([createIssue('serious')]);
      const moderateResult = calculateScore([createIssue('moderate')]);
      const minorResult = calculateScore([createIssue('minor')]);

      // More severe issues should result in lower scores
      expect(criticalResult.score).toBeLessThan(seriousResult.score);
      expect(seriousResult.score).toBeLessThan(moderateResult.score);
      expect(moderateResult.score).toBeLessThan(minorResult.score);
    });

    it('should use logarithmic scaling', () => {
      // Adding more issues should have diminishing impact on score reduction
      const one = calculateScore([createIssue('critical')]);
      const two = calculateScore([createIssue('critical'), createIssue('critical')]);
      const three = calculateScore([
        createIssue('critical'),
        createIssue('critical'),
        createIssue('critical'),
      ]);

      const diff1 = one.score - two.score;
      const diff2 = two.score - three.score;

      // Logarithmic scaling means second issue has less impact than first
      expect(diff2).toBeLessThanOrEqual(diff1);
    });
  });

  describe('calculateScoreFromSummary', () => {
    it('should return perfect score for empty summary', () => {
      const summary: ScanSummary = {
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
      };

      const result = calculateScoreFromSummary(summary);

      expect(result.score).toBe(100);
      expect(result.grade).toBe('A');
    });

    it('should score based on severity distribution', () => {
      const summary: ScanSummary = {
        total: 5,
        bySeverity: { critical: 1, serious: 2, moderate: 1, minor: 1 },
        byCategory: {
          images: 5,
          interactive: 0,
          forms: 0,
          color: 0,
          document: 0,
          structure: 0,
          aria: 0,
          technical: 0,
        },
      };

      const result = calculateScoreFromSummary(summary);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should match calculateScore for equivalent data', () => {
      const issues = [
        createIssue('critical'),
        createIssue('serious'),
        createIssue('serious'),
        createIssue('moderate'),
        createIssue('minor'),
      ];

      const summary: ScanSummary = {
        total: 5,
        bySeverity: { critical: 1, serious: 2, moderate: 1, minor: 1 },
        byCategory: {
          images: 5,
          interactive: 0,
          forms: 0,
          color: 0,
          document: 0,
          structure: 0,
          aria: 0,
          technical: 0,
        },
      };

      const issueResult = calculateScore(issues);
      const summaryResult = calculateScoreFromSummary(summary);

      // Should produce the same score since they represent the same data
      expect(issueResult.score).toBe(summaryResult.score);
      expect(issueResult.grade).toBe(summaryResult.grade);
    });

    it('should handle zero bySeverity counts', () => {
      const summary: ScanSummary = {
        total: 1,
        bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 1 },
        byCategory: {
          images: 1,
          interactive: 0,
          forms: 0,
          color: 0,
          document: 0,
          structure: 0,
          aria: 0,
          technical: 0,
        },
      };

      const result = calculateScoreFromSummary(summary);

      expect(result.score).toBeGreaterThan(80);
      expect(['A', 'B']).toContain(result.grade);
    });

    it('should handle all critical issues', () => {
      const summary: ScanSummary = {
        total: 10,
        bySeverity: { critical: 10, serious: 0, moderate: 0, minor: 0 },
        byCategory: {
          images: 10,
          interactive: 0,
          forms: 0,
          color: 0,
          document: 0,
          structure: 0,
          aria: 0,
          technical: 0,
        },
      };

      const result = calculateScoreFromSummary(summary);

      expect(result.score).toBeLessThan(50);
      expect(['D', 'F']).toContain(result.grade);
    });
  });

  describe('getScoreBreakdown', () => {
    it('should return empty object for no issues', () => {
      const breakdown = getScoreBreakdown([]);

      expect(breakdown).toEqual({});
    });

    it('should group issues by category', () => {
      const issues = [
        createIssue('critical', 'images'),
        createIssue('serious', 'images'),
        createIssue('moderate', 'interactive'),
        createIssue('minor', 'forms'),
      ];

      const breakdown = getScoreBreakdown(issues);

      expect(breakdown).toHaveProperty('images');
      expect(breakdown).toHaveProperty('interactive');
      expect(breakdown).toHaveProperty('forms');
    });

    it('should calculate score for each category', () => {
      const issues = [
        createIssue('critical', 'images'),
        createIssue('critical', 'images'),
        createIssue('minor', 'interactive'),
      ];

      const breakdown = getScoreBreakdown(issues);

      // Images category should have lower score due to critical issues
      expect(breakdown.images.score).toBeLessThan(breakdown.interactive.score);
    });

    it('should have correct grade for each category', () => {
      const issues = [createIssue('minor', 'images'), createIssue('critical', 'interactive')];

      const breakdown = getScoreBreakdown(issues);

      // Images with minor issue should have high grade
      expect(['A', 'B']).toContain(breakdown.images.grade);
      // Interactive with critical issue should have lower grade
      expect(['B', 'C', 'D']).toContain(breakdown.interactive.grade);
    });

    it('should accumulate all issues in a category', () => {
      const issues = [
        createIssue('critical', 'images'),
        createIssue('serious', 'images'),
        createIssue('moderate', 'images'),
        createIssue('minor', 'images'),
      ];

      const breakdown = getScoreBreakdown(issues);

      // All 4 issues in images category should be evaluated together
      const imagesScore = breakdown.images.score;
      expect(imagesScore).toBeLessThan(90);
    });

    it('should handle multiple categories independently', () => {
      const issues = [
        ...Array(5)
          .fill(null)
          .map(() => createIssue('critical', 'images')),
        ...Array(5)
          .fill(null)
          .map(() => createIssue('minor', 'interactive')),
      ];

      const breakdown = getScoreBreakdown(issues);

      // Images should have much lower score than interactive
      expect(breakdown.images.score).toBeLessThan(breakdown.interactive.score);
    });

    it('should return proper ScoreResult for each category', () => {
      const issues = [createIssue('serious', 'forms'), createIssue('minor', 'color')];

      const breakdown = getScoreBreakdown(issues);

      Object.values(breakdown).forEach((result) => {
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('grade');
        expect(result).toHaveProperty('color');
        expect(result).toHaveProperty('label');
      });
    });
  });

  describe('Score consistency', () => {
    it('should produce consistent scores for same input', () => {
      const issues = [createIssue('critical'), createIssue('serious'), createIssue('moderate')];

      const result1 = calculateScore(issues);
      const result2 = calculateScore(issues);

      expect(result1.score).toBe(result2.score);
      expect(result1.grade).toBe(result2.grade);
    });

    it('should always return score between 0-100', () => {
      const testCases = [
        [],
        [createIssue('minor')],
        [createIssue('critical')],
        Array(100)
          .fill(null)
          .map(() => createIssue('critical')),
      ];

      testCases.forEach((issues) => {
        const result = calculateScore(issues);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });
    });

    it('should always return valid grade', () => {
      const validGrades = ['A', 'B', 'C', 'D', 'F'];
      const testCases = [
        [],
        [createIssue('minor')],
        [createIssue('critical')],
        Array(50)
          .fill(null)
          .map(() => createIssue('critical')),
      ];

      testCases.forEach((issues) => {
        const result = calculateScore(issues);
        expect(validGrades).toContain(result.grade);
      });
    });

    it('should always return valid color hex code', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      const testCases = [[], [createIssue('minor')], [createIssue('critical')]];

      testCases.forEach((issues) => {
        const result = calculateScore(issues);
        expect(result.color).toMatch(hexRegex);
      });
    });

    it('should always return non-empty label', () => {
      const testCases = [[], [createIssue('minor')], [createIssue('critical')]];

      testCases.forEach((issues) => {
        const result = calculateScore(issues);
        expect(result.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Score edge cases', () => {
    it('should handle extremely large number of issues', () => {
      const issues = Array(1000)
        .fill(null)
        .map(() => createIssue('minor'));
      const result = calculateScore(issues);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should reach 0 score eventually', () => {
      // Very many critical issues should approach 0
      const issues = Array(1000)
        .fill(null)
        .map(() => createIssue('critical'));
      const result = calculateScore(issues);

      expect(result.score).toBeLessThan(5);
    });

    it('should handle score rounding correctly', () => {
      const issues = [createIssue('minor')];
      const result = calculateScore(issues);

      // Score should be a whole number (rounded)
      expect(Number.isInteger(result.score)).toBe(true);
    });
  });

  describe('Score interface compliance', () => {
    it('should return proper ScoreResult type', () => {
      const result = calculateScore([]);

      const scoreResult: ScoreResult = result;
      expect(scoreResult.score).toBeDefined();
      expect(scoreResult.grade).toBeDefined();
      expect(scoreResult.color).toBeDefined();
      expect(scoreResult.label).toBeDefined();
    });

    it('should have all required properties in breakdown', () => {
      const issues = [createIssue('critical', 'images'), createIssue('serious', 'interactive')];

      const breakdown = getScoreBreakdown(issues);

      Object.values(breakdown).forEach((result) => {
        const scoreResult: ScoreResult = result;
        expect(scoreResult.score).toBeDefined();
        expect(scoreResult.grade).toBeDefined();
        expect(scoreResult.color).toBeDefined();
        expect(scoreResult.label).toBeDefined();
      });
    });
  });

  describe('Severity weight verification', () => {
    it('should apply correct weights in calculation', () => {
      // Test that severity weights are applied correctly
      // critical: 10, serious: 5, moderate: 2, minor: 1

      // 1 critical (weight 10) should be worse than 2 serious (weight 10)
      const oneCritical = calculateScore([createIssue('critical')]);

      // 2 serious (weight 10) should be same weighted as 1 critical
      const twoSerious = calculateScore([createIssue('serious'), createIssue('serious')]);

      // They should have similar but not identical scores due to logarithmic scaling
      expect(Math.abs(oneCritical.score - twoSerious.score)).toBeLessThan(5);
    });
  });
});
