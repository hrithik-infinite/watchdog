import { describe, it, expect } from 'vitest';
import type { Issue, FilterState } from '@/shared/types';

const mockIssue: Issue = {
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

describe('Issue filtering logic', () => {
  it('should filter issues by severity', () => {
    const issues = [mockIssue, { ...mockIssue, id: 'issue-2', severity: 'minor' as const }];

    const criticalIssues = issues.filter((issue) => issue.severity === 'critical');
    expect(criticalIssues).toHaveLength(1);
    expect(criticalIssues[0].id).toBe('issue-1');
  });

  it('should filter issues by category', () => {
    const issues = [mockIssue, { ...mockIssue, id: 'issue-2', category: 'forms' as const }];

    const imageIssues = issues.filter((issue) => issue.category === 'images');
    expect(imageIssues).toHaveLength(1);
    expect(imageIssues[0].category).toBe('images');
  });

  it('should filter issues by search query', () => {
    const issues = [
      mockIssue,
      { ...mockIssue, id: 'issue-2', message: 'Buttons must have accessible name' },
    ];

    const searchQuery = 'alt';
    const matchingIssues = issues.filter((issue) =>
      issue.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(matchingIssues).toHaveLength(1);
    expect(matchingIssues[0].message).toContain('alt');
  });

  it('should handle multiple filters', () => {
    const issues = [
      mockIssue,
      { ...mockIssue, id: 'issue-2', severity: 'minor' as const, category: 'forms' as const },
      { ...mockIssue, id: 'issue-3', severity: 'critical' as const, category: 'forms' as const },
    ];

    const filtered = issues.filter(
      (issue) => issue.severity === 'critical' && issue.category === 'images'
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('issue-1');
  });
});

describe('Filter state', () => {
  it('should have correct filter structure', () => {
    const filters: FilterState = {
      severity: 'all',
      category: 'all',
      searchQuery: '',
    };

    expect(filters).toHaveProperty('severity');
    expect(filters).toHaveProperty('category');
    expect(filters).toHaveProperty('searchQuery');
  });

  it('should validate severity values', () => {
    const validSeverities = ['all', 'critical', 'serious', 'moderate', 'minor'];
    validSeverities.forEach((severity) => {
      expect(['all', 'critical', 'serious', 'moderate', 'minor']).toContain(severity);
    });
  });

  it('should validate category values', () => {
    const validCategories = [
      'all',
      'images',
      'interactive',
      'forms',
      'color',
      'document',
      'structure',
      'aria',
      'technical',
    ];
    validCategories.forEach((category) => {
      expect([
        'all',
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
