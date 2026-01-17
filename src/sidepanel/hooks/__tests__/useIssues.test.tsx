import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIssues } from '../useIssues';
import { useScanStore } from '@/sidepanel/store';
import type { Issue, ScanResult } from '@/shared/types';

const mockIssues: Issue[] = [
  {
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
  },
  {
    id: 'issue-2',
    ruleId: 'button-name',
    severity: 'serious',
    category: 'interactive',
    message: 'Button must have accessible name',
    description: 'Buttons must have accessible names',
    helpUrl: 'https://example.com/help',
    wcag: {
      id: '4.1.2',
      level: 'A',
      name: 'Name, Role, Value',
      description: 'Test',
    },
    element: {
      selector: 'button.submit',
      html: '<button class="submit"></button>',
    },
    fix: {
      description: 'Add text or aria-label',
      code: '<button class="submit" aria-label="Submit">',
      learnMoreUrl: 'https://example.com/learn',
    },
  },
  {
    id: 'issue-3',
    ruleId: 'label',
    severity: 'moderate',
    category: 'forms',
    message: 'Form input missing label',
    description: 'Inputs must have labels',
    helpUrl: 'https://example.com/help',
    wcag: {
      id: '1.3.1',
      level: 'A',
      name: 'Info and Relationships',
      description: 'Test',
    },
    element: {
      selector: 'input.email',
      html: '<input class="email" type="email">',
    },
    fix: {
      description: 'Add label element',
      code: '<label>Email: <input class="email" type="email"></label>',
      learnMoreUrl: 'https://example.com/learn',
    },
  },
];

describe('useIssues Hook', () => {
  beforeEach(() => {
    const mockResult: ScanResult = {
      url: 'https://example.com',
      timestamp: Date.now(),
      duration: 100,
      issues: mockIssues,
      incomplete: [],
      summary: {
        total: 3,
        bySeverity: { critical: 1, serious: 1, moderate: 1, minor: 0 },
        byCategory: {
          images: 1,
          interactive: 1,
          forms: 1,
          color: 0,
          document: 0,
          structure: 0,
          aria: 0,
          technical: 0,
        },
      },
    };

    useScanStore.setState({ scanResult: mockResult });
  });

  describe('Hook initialization', () => {
    it('should return hook object with all properties', () => {
      const { result } = renderHook(() => useIssues());

      expect(result.current).toHaveProperty('filters');
      expect(result.current).toHaveProperty('filteredIssues');
      expect(result.current).toHaveProperty('selectedIssue');
      expect(result.current).toHaveProperty('selectedIssueId');
      expect(result.current).toHaveProperty('view');
      expect(result.current).toHaveProperty('setFilter');
      expect(result.current).toHaveProperty('resetFilters');
      expect(result.current).toHaveProperty('selectIssue');
      expect(result.current).toHaveProperty('goToIssue');
      expect(result.current).toHaveProperty('goToPrevIssue');
      expect(result.current).toHaveProperty('goToNextIssue');
      expect(result.current).toHaveProperty('getCurrentIndex');
    });

    it('should return all issues when no filters applied', () => {
      const { result } = renderHook(() => useIssues());

      expect(result.current.filteredIssues).toHaveLength(3);
    });

    it('should have total filtered count', () => {
      const { result } = renderHook(() => useIssues());

      expect(result.current.totalFiltered).toBe(3);
    });
  });

  describe('Filtering', () => {
    it('should filter issues by severity', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setFilter('severity', 'critical');
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].severity).toBe('critical');
    });

    it('should filter issues by category', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setFilter('category', 'images');
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].category).toBe('images');
    });

    it('should filter issues by search query', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setFilter('searchQuery', 'button');
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].ruleId).toBe('button-name');
    });

    it('should apply multiple filters', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setFilter('severity', 'critical');
        result.current.setFilter('category', 'images');
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].id).toBe('issue-1');
    });

    it('should reset filters', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setFilter('severity', 'critical');
      });

      expect(result.current.filteredIssues).toHaveLength(1);

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filteredIssues).toHaveLength(3);
    });
  });

  describe('Issue selection', () => {
    it('should select an issue', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      expect(result.current.selectedIssueId).toBe('issue-1');
      expect(result.current.selectedIssue?.id).toBe('issue-1');
    });

    it('should set view to detail when selecting issue', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      expect(result.current.view).toBe('detail');
    });

    it('should deselect issue', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      expect(result.current.selectedIssueId).toBe('issue-1');

      act(() => {
        result.current.selectIssue(null);
      });

      expect(result.current.selectedIssueId).toBeNull();
      expect(result.current.selectedIssue).toBeNull();
    });

    it('should set view to list when deselecting', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      expect(result.current.view).toBe('detail');

      act(() => {
        result.current.selectIssue(null);
      });

      expect(result.current.view).toBe('list');
    });
  });

  describe('Navigation', () => {
    it('should get current index', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      expect(result.current.getCurrentIndex()).toBe(0);

      act(() => {
        result.current.selectIssue('issue-2');
      });

      expect(result.current.getCurrentIndex()).toBe(1);
    });

    it('should return -1 when no issue selected', () => {
      const { result } = renderHook(() => useIssues());

      expect(result.current.getCurrentIndex()).toBe(-1);
    });

    it('should navigate to next issue', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      expect(result.current.selectedIssueId).toBe('issue-1');

      act(() => {
        result.current.goToNextIssue();
      });

      expect(result.current.selectedIssueId).toBe('issue-2');
    });

    it('should navigate to previous issue', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-2');
      });

      expect(result.current.selectedIssueId).toBe('issue-2');

      act(() => {
        result.current.goToPrevIssue();
      });

      expect(result.current.selectedIssueId).toBe('issue-1');
    });

    it('should not navigate beyond boundaries', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-1');
      });

      act(() => {
        result.current.goToPrevIssue();
      });

      // Should still be at first issue
      expect(result.current.selectedIssueId).toBe('issue-1');
    });

    it('should get adjacent issue IDs', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.selectIssue('issue-2');
      });

      expect(result.current.adjacentIds.prev).toBe('issue-1');
      expect(result.current.adjacentIds.next).toBe('issue-3');
    });
  });

  describe('View management', () => {
    it('should switch to detail view', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setView('detail');
      });

      expect(result.current.view).toBe('detail');
    });

    it('should switch to list view', () => {
      const { result } = renderHook(() => useIssues());

      act(() => {
        result.current.setView('list');
      });

      expect(result.current.view).toBe('list');
    });
  });
});
