import { describe, it, expect, beforeEach } from 'vitest';
import { useScanStore } from '../index';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { ScanResult, Issue } from '@/shared/types';

describe('Scan Store (Zustand)', () => {
  beforeEach(() => {
    // Reset store to initial state
    useScanStore.setState({
      isScanning: false,
      scanResult: null,
      error: null,
      filters: { severity: 'all', category: 'all', searchQuery: '' },
      selectedIssueId: null,
      view: 'list',
      settings: DEFAULT_SETTINGS,
    });
  });

  describe('Initial state', () => {
    it('should have initial state', () => {
      const state = useScanStore.getState();

      expect(state.isScanning).toBe(false);
      expect(state.scanResult).toBe(null);
      expect(state.error).toBe(null);
      expect(state.selectedIssueId).toBe(null);
      expect(state.view).toBe('list');
    });

    it('should have initial filters', () => {
      const state = useScanStore.getState();

      expect(state.filters.severity).toBe('all');
      expect(state.filters.category).toBe('all');
      expect(state.filters.searchQuery).toBe('');
    });

    it('should have default settings', () => {
      const state = useScanStore.getState();

      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('setScanning', () => {
    it('should set scanning state to true', () => {
      const { setScanning } = useScanStore.getState();

      setScanning(true);
      expect(useScanStore.getState().isScanning).toBe(true);
    });

    it('should set scanning state to false', () => {
      const { setScanning } = useScanStore.getState();

      setScanning(true);
      setScanning(false);
      expect(useScanStore.getState().isScanning).toBe(false);
    });
  });

  describe('setScanResult', () => {
    it('should set scan result', () => {
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

      const { setScanResult } = useScanStore.getState();
      setScanResult(mockResult);

      expect(useScanStore.getState().scanResult).toEqual(mockResult);
    });

    it('should clear error when setting result', () => {
      const { setError, setScanResult } = useScanStore.getState();

      setError('Previous error');
      expect(useScanStore.getState().error).toBe('Previous error');

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

      setScanResult(mockResult);
      expect(useScanStore.getState().error).toBe(null);
    });

    it('should reset selected issue when setting new result', () => {
      const { selectIssue, setScanResult } = useScanStore.getState();

      selectIssue('issue-123');
      expect(useScanStore.getState().selectedIssueId).toBe('issue-123');

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

      setScanResult(mockResult);
      expect(useScanStore.getState().selectedIssueId).toBe(null);
    });

    it('should reset view to list when setting new result', () => {
      const { setView, setScanResult } = useScanStore.getState();

      setView('detail');
      expect(useScanStore.getState().view).toBe('detail');

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

      setScanResult(mockResult);
      expect(useScanStore.getState().view).toBe('list');
    });

    it('should accept null as scan result', () => {
      const { setScanResult } = useScanStore.getState();

      setScanResult(null);
      expect(useScanStore.getState().scanResult).toBe(null);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useScanStore.getState();

      setError('Error occurred');
      expect(useScanStore.getState().error).toBe('Error occurred');
    });

    it('should clear error when set to null', () => {
      const { setError } = useScanStore.getState();

      setError('Error');
      setError(null);
      expect(useScanStore.getState().error).toBe(null);
    });

    it('should not change isScanning when error is set', () => {
      const { setScanning, setError } = useScanStore.getState();

      setScanning(true);
      setError('Error occurred');
      // setError should not change isScanning - that's handled by the caller
      expect(useScanStore.getState().isScanning).toBe(true);
      expect(useScanStore.getState().error).toBe('Error occurred');
    });
  });

  describe('setFilter', () => {
    it('should set severity filter', () => {
      const { setFilter } = useScanStore.getState();

      setFilter('severity', 'critical');
      expect(useScanStore.getState().filters.severity).toBe('critical');
    });

    it('should set category filter', () => {
      const { setFilter } = useScanStore.getState();

      setFilter('category', 'images');
      expect(useScanStore.getState().filters.category).toBe('images');
    });

    it('should set search query', () => {
      const { setFilter } = useScanStore.getState();

      setFilter('searchQuery', 'alt text');
      expect(useScanStore.getState().filters.searchQuery).toBe('alt text');
    });

    it('should preserve other filters when setting one', () => {
      const { setFilter } = useScanStore.getState();

      setFilter('severity', 'serious');
      setFilter('category', 'forms');

      const filters = useScanStore.getState().filters;
      expect(filters.severity).toBe('serious');
      expect(filters.category).toBe('forms');
    });

    it('should handle all severity values', () => {
      const { setFilter } = useScanStore.getState();
      const severities = ['all', 'critical', 'serious', 'moderate', 'minor'] as const;

      severities.forEach((severity) => {
        setFilter('severity', severity);
        expect(useScanStore.getState().filters.severity).toBe(severity);
      });
    });

    it('should handle all category values', () => {
      const { setFilter } = useScanStore.getState();
      const categories = [
        'all',
        'images',
        'interactive',
        'forms',
        'color',
        'document',
        'structure',
        'aria',
        'technical',
      ] as const;

      categories.forEach((category) => {
        setFilter('category', category);
        expect(useScanStore.getState().filters.category).toBe(category);
      });
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to initial state', () => {
      const { setFilter, resetFilters } = useScanStore.getState();

      setFilter('severity', 'critical');
      setFilter('category', 'images');
      setFilter('searchQuery', 'test');

      resetFilters();

      const filters = useScanStore.getState().filters;
      expect(filters.severity).toBe('all');
      expect(filters.category).toBe('all');
      expect(filters.searchQuery).toBe('');
    });
  });

  describe('selectIssue', () => {
    it('should select an issue', () => {
      const { selectIssue } = useScanStore.getState();

      selectIssue('issue-123');
      expect(useScanStore.getState().selectedIssueId).toBe('issue-123');
    });

    it('should switch to detail view when selecting issue', () => {
      const { selectIssue } = useScanStore.getState();

      selectIssue('issue-123');
      expect(useScanStore.getState().view).toBe('detail');
    });

    it('should deselect issue with null', () => {
      const { selectIssue } = useScanStore.getState();

      selectIssue('issue-123');
      selectIssue(null);
      expect(useScanStore.getState().selectedIssueId).toBe(null);
    });

    it('should switch to list view when deselecting', () => {
      const { selectIssue } = useScanStore.getState();

      selectIssue('issue-123');
      selectIssue(null);
      expect(useScanStore.getState().view).toBe('list');
    });
  });

  describe('setView', () => {
    it('should set view to list', () => {
      const { setView } = useScanStore.getState();

      setView('list');
      expect(useScanStore.getState().view).toBe('list');
    });

    it('should set view to detail', () => {
      const { setView } = useScanStore.getState();

      setView('detail');
      expect(useScanStore.getState().view).toBe('detail');
    });
  });

  describe('updateSettings', () => {
    it('should update wcag level', () => {
      const { updateSettings } = useScanStore.getState();

      updateSettings({ wcagLevel: 'AAA' });
      expect(useScanStore.getState().settings.wcagLevel).toBe('AAA');
    });

    it('should update vision mode', () => {
      const { updateSettings } = useScanStore.getState();

      updateSettings({ visionMode: 'protanopia' });
      expect(useScanStore.getState().settings.visionMode).toBe('protanopia');
    });

    it('should update show focus order', () => {
      const { updateSettings } = useScanStore.getState();

      updateSettings({ showFocusOrder: true });
      expect(useScanStore.getState().settings.showFocusOrder).toBe(true);
    });

    it('should update multiple settings at once', () => {
      const { updateSettings } = useScanStore.getState();

      updateSettings({
        wcagLevel: 'AA',
        visionMode: 'deuteranopia',
        showFocusOrder: true,
      });

      const settings = useScanStore.getState().settings;
      expect(settings.wcagLevel).toBe('AA');
      expect(settings.visionMode).toBe('deuteranopia');
      expect(settings.showFocusOrder).toBe(true);
    });

    it('should preserve unmodified settings', () => {
      const { updateSettings } = useScanStore.getState();

      const initialVisionMode = useScanStore.getState().settings.visionMode;

      updateSettings({ wcagLevel: 'A' });

      const settings = useScanStore.getState().settings;
      expect(settings.visionMode).toBe(initialVisionMode);
    });
  });

  describe('getFilteredIssues', () => {
    let mockIssues: Issue[];

    beforeEach(() => {
      mockIssues = [
        {
          id: 'issue-1',
          ruleId: 'image-alt',
          severity: 'critical',
          category: 'images',
          message: 'Image missing alt text',
          description: 'Images must have alt text',
          helpUrl: 'https://example.com',
          wcag: { id: '1.1.1', level: 'A', name: 'Test', description: 'Test' },
          element: { selector: 'img', html: '<img>' },
          fix: { description: 'Add alt', code: '', learnMoreUrl: '' },
        },
        {
          id: 'issue-2',
          ruleId: 'button-name',
          severity: 'serious',
          category: 'interactive',
          message: 'Button without name',
          description: 'Buttons must have accessible names',
          helpUrl: 'https://example.com',
          wcag: { id: '4.1.2', level: 'A', name: 'Test', description: 'Test' },
          element: { selector: 'button', html: '<button></button>' },
          fix: { description: 'Add name', code: '', learnMoreUrl: '' },
        },
        {
          id: 'issue-3',
          ruleId: 'label',
          severity: 'moderate',
          category: 'forms',
          message: 'Input missing label',
          description: 'Inputs must have labels',
          helpUrl: 'https://example.com',
          wcag: { id: '1.3.1', level: 'A', name: 'Test', description: 'Test' },
          element: { selector: 'input', html: '<input>' },
          fix: { description: 'Add label', code: '', learnMoreUrl: '' },
        },
      ];

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

    it('should return all issues when no filters applied', () => {
      const { getFilteredIssues } = useScanStore.getState();

      const filtered = getFilteredIssues();
      expect(filtered).toHaveLength(3);
    });

    it('should filter by severity', () => {
      const { setFilter, getFilteredIssues } = useScanStore.getState();

      setFilter('severity', 'critical');
      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe('critical');
    });

    it('should filter by category', () => {
      const { setFilter, getFilteredIssues } = useScanStore.getState();

      setFilter('category', 'images');
      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('images');
    });

    it('should filter by search query in message', () => {
      const { setFilter, getFilteredIssues } = useScanStore.getState();

      setFilter('searchQuery', 'alt');
      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toContain('alt');
    });

    it('should filter by search query in rule ID', () => {
      const { setFilter, getFilteredIssues } = useScanStore.getState();

      setFilter('searchQuery', 'button');
      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].ruleId).toContain('button');
    });

    it('should apply multiple filters', () => {
      const { setFilter, getFilteredIssues } = useScanStore.getState();

      setFilter('severity', 'critical');
      setFilter('category', 'images');

      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe('critical');
      expect(filtered[0].category).toBe('images');
    });

    it('should return empty array when no scan result', () => {
      useScanStore.setState({ scanResult: null });

      const { getFilteredIssues } = useScanStore.getState();
      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(0);
    });

    it('should be case insensitive for search', () => {
      const { setFilter, getFilteredIssues } = useScanStore.getState();

      setFilter('searchQuery', 'ALT');
      const filtered = getFilteredIssues();

      expect(filtered).toHaveLength(1);
    });
  });

  describe('getIssueById', () => {
    beforeEach(() => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [
          {
            id: 'issue-1',
            ruleId: 'test-rule',
            severity: 'critical',
            category: 'images',
            message: 'Test issue',
            description: 'Test',
            helpUrl: 'https://example.com',
            wcag: { id: '1.1.1', level: 'A', name: 'Test', description: 'Test' },
            element: { selector: 'img', html: '<img>' },
            fix: { description: 'Fix', code: '', learnMoreUrl: '' },
          },
        ],
        incomplete: [],
        summary: {
          total: 1,
          bySeverity: { critical: 1, serious: 0, moderate: 0, minor: 0 },
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
        },
      };

      useScanStore.setState({ scanResult: mockResult });
    });

    it('should find issue by ID', () => {
      const { getIssueById } = useScanStore.getState();

      const issue = getIssueById('issue-1');
      expect(issue).toBeDefined();
      expect(issue?.id).toBe('issue-1');
    });

    it('should return undefined for non-existent ID', () => {
      const { getIssueById } = useScanStore.getState();

      const issue = getIssueById('non-existent');
      expect(issue).toBeUndefined();
    });

    it('should return undefined when no scan result', () => {
      useScanStore.setState({ scanResult: null });

      const { getIssueById } = useScanStore.getState();
      const issue = getIssueById('issue-1');

      expect(issue).toBeUndefined();
    });
  });

  describe('getAdjacentIssueIds', () => {
    beforeEach(() => {
      const mockResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [
          {
            id: 'issue-1',
            ruleId: 'test',
            severity: 'critical',
            category: 'images',
            message: 'Test 1',
            description: 'Test',
            helpUrl: 'https://example.com',
            wcag: { id: '1.1.1', level: 'A', name: 'Test', description: 'Test' },
            element: { selector: 'img', html: '<img>' },
            fix: { description: 'Fix', code: '', learnMoreUrl: '' },
          },
          {
            id: 'issue-2',
            ruleId: 'test',
            severity: 'serious',
            category: 'interactive',
            message: 'Test 2',
            description: 'Test',
            helpUrl: 'https://example.com',
            wcag: { id: '4.1.2', level: 'A', name: 'Test', description: 'Test' },
            element: { selector: 'button', html: '<button>' },
            fix: { description: 'Fix', code: '', learnMoreUrl: '' },
          },
          {
            id: 'issue-3',
            ruleId: 'test',
            severity: 'moderate',
            category: 'forms',
            message: 'Test 3',
            description: 'Test',
            helpUrl: 'https://example.com',
            wcag: { id: '1.3.1', level: 'A', name: 'Test', description: 'Test' },
            element: { selector: 'input', html: '<input>' },
            fix: { description: 'Fix', code: '', learnMoreUrl: '' },
          },
        ],
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

    it('should return previous and next issue IDs', () => {
      const { getAdjacentIssueIds } = useScanStore.getState();

      const adjacent = getAdjacentIssueIds('issue-2');
      expect(adjacent.prev).toBe('issue-1');
      expect(adjacent.next).toBe('issue-3');
    });

    it('should return null for previous at start', () => {
      const { getAdjacentIssueIds } = useScanStore.getState();

      const adjacent = getAdjacentIssueIds('issue-1');
      expect(adjacent.prev).toBe(null);
      expect(adjacent.next).toBe('issue-2');
    });

    it('should return null for next at end', () => {
      const { getAdjacentIssueIds } = useScanStore.getState();

      const adjacent = getAdjacentIssueIds('issue-3');
      expect(adjacent.prev).toBe('issue-2');
      expect(adjacent.next).toBe(null);
    });

    it('should respect filters when finding adjacent issues', () => {
      const { setFilter, getAdjacentIssueIds } = useScanStore.getState();

      setFilter('severity', 'critical');

      const adjacent = getAdjacentIssueIds('issue-1');
      expect(adjacent.prev).toBe(null);
      expect(adjacent.next).toBe(null);
    });
  });

  describe('Store mutations', () => {
    it('should allow chained mutations', () => {
      const { setScanning, setScanResult, setError } = useScanStore.getState();

      setScanning(true);
      expect(useScanStore.getState().isScanning).toBe(true);

      setScanning(false);
      expect(useScanStore.getState().isScanning).toBe(false);

      setError('Test error');
      expect(useScanStore.getState().error).toBe('Test error');
    });

    it('should maintain state consistency', () => {
      const state = useScanStore.getState();

      state.setScanning(true);
      state.setError('Error');
      state.setFilter('severity', 'critical');

      const newState = useScanStore.getState();
      expect(newState.isScanning).toBe(true); // setError does not change isScanning
      expect(newState.error).toBe('Error');
      expect(newState.filters.severity).toBe('critical');
    });
  });
});
