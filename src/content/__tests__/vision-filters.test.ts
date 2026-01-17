import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyVisionFilter, removeVisionFilter, getCurrentVisionFilter } from '../vision-filters';

describe('Vision Filters', () => {
  beforeEach(() => {
    // Clear any existing filters
    document.documentElement.style.filter = '';
    const svg = document.getElementById('watchdog-vision-filters');
    if (svg) svg.remove();
    vi.clearAllMocks();
  });

  afterEach(() => {
    removeVisionFilter();
  });

  describe('applyVisionFilter', () => {
    it('should apply protanopia filter', () => {
      applyVisionFilter('protanopia');

      const filter = document.documentElement.style.filter;
      expect(filter).toContain('watchdog-vision-filter-protanopia');
    });

    it('should apply deuteranopia filter', () => {
      applyVisionFilter('deuteranopia');

      const filter = document.documentElement.style.filter;
      expect(filter).toContain('watchdog-vision-filter-deuteranopia');
    });

    it('should apply tritanopia filter', () => {
      applyVisionFilter('tritanopia');

      const filter = document.documentElement.style.filter;
      expect(filter).toContain('watchdog-vision-filter-tritanopia');
    });

    it('should apply achromatopsia filter', () => {
      applyVisionFilter('achromatopsia');

      const filter = document.documentElement.style.filter;
      expect(filter).toContain('watchdog-vision-filter-achromatopsia');
    });

    it('should apply blur-low filter', () => {
      applyVisionFilter('blur-low');

      const filter = document.documentElement.style.filter;
      expect(filter).toBe('blur(2px)');
    });

    it('should apply blur-medium filter', () => {
      applyVisionFilter('blur-medium');

      const filter = document.documentElement.style.filter;
      expect(filter).toBe('blur(4px)');
    });

    it('should apply blur-high filter', () => {
      applyVisionFilter('blur-high');

      const filter = document.documentElement.style.filter;
      expect(filter).toBe('blur(8px)');
    });

    it('should do nothing when mode is none', () => {
      applyVisionFilter('protanopia');
      expect(document.documentElement.style.filter).toBeTruthy();

      applyVisionFilter('none');

      expect(document.documentElement.style.filter).toBe('');
    });

    it('should create SVG filters for colorblind modes', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      expect(svg).toBeTruthy();
      expect(svg?.tagName.toLowerCase()).toBe('svg');
    });

    it('should create filter definitions for all colorblind types', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      const filters = svg?.querySelectorAll('filter');

      expect(filters?.length).toBeGreaterThanOrEqual(4);
    });

    it('should use url format for colorblind filters', () => {
      applyVisionFilter('deuteranopia');

      const filter = document.documentElement.style.filter;
      expect(filter).toMatch(/url\(#/);
    });

    it('should remove previous filter before applying new one', () => {
      applyVisionFilter('protanopia');
      let svg = document.querySelectorAll('#watchdog-vision-filters');
      expect(svg.length).toBe(1);

      applyVisionFilter('deuteranopia');
      svg = document.querySelectorAll('#watchdog-vision-filters');
      expect(svg.length).toBe(1);
    });

    it('should handle switching from colorblind to blur', () => {
      applyVisionFilter('protanopia');
      expect(document.documentElement.style.filter).toContain('url(');

      applyVisionFilter('blur-low');
      expect(document.documentElement.style.filter).toBe('blur(2px)');
    });

    it('should handle switching from blur to colorblind', () => {
      applyVisionFilter('blur-low');
      expect(document.documentElement.style.filter).toBe('blur(2px)');

      applyVisionFilter('protanopia');
      expect(document.documentElement.style.filter).toContain('url(');
    });

    it('should append SVG to document body', () => {
      const initialBodyChildren = document.body.children.length;

      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      expect(svg?.parentElement).toBe(document.body);
    });

    it('should handle multiple sequential filter applications', () => {
      const modes = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;

      modes.forEach((mode) => {
        applyVisionFilter(mode);
        const filter = document.documentElement.style.filter;
        expect(filter).toContain(mode);
      });
    });

    it('should handle blur levels sequentially', () => {
      applyVisionFilter('blur-low');
      expect(document.documentElement.style.filter).toBe('blur(2px)');

      applyVisionFilter('blur-medium');
      expect(document.documentElement.style.filter).toBe('blur(4px)');

      applyVisionFilter('blur-high');
      expect(document.documentElement.style.filter).toBe('blur(8px)');
    });
  });

  describe('removeVisionFilter', () => {
    it('should remove filter from documentElement', () => {
      applyVisionFilter('protanopia');
      expect(document.documentElement.style.filter).toBeTruthy();

      removeVisionFilter();

      expect(document.documentElement.style.filter).toBe('');
    });

    it('should remove SVG filter element', () => {
      applyVisionFilter('protanopia');
      expect(document.getElementById('watchdog-vision-filters')).toBeTruthy();

      removeVisionFilter();

      expect(document.getElementById('watchdog-vision-filters')).toBeFalsy();
    });

    it('should remove blur filters', () => {
      applyVisionFilter('blur-low');
      expect(document.documentElement.style.filter).toBe('blur(2px)');

      removeVisionFilter();

      expect(document.documentElement.style.filter).toBe('');
    });

    it('should be safe to call when no filter exists', () => {
      expect(() => removeVisionFilter()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      applyVisionFilter('protanopia');
      removeVisionFilter();
      expect(() => removeVisionFilter()).not.toThrow();
      expect(() => removeVisionFilter()).not.toThrow();
    });

    it('should handle removing filter without SVG', () => {
      // Apply blur (no SVG)
      applyVisionFilter('blur-low');
      expect(() => removeVisionFilter()).not.toThrow();
      expect(document.documentElement.style.filter).toBe('');
    });
  });

  describe('getCurrentVisionFilter', () => {
    it('should return none when no filter is applied', () => {
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('none');
    });

    it('should return protanopia when applied', () => {
      applyVisionFilter('protanopia');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('protanopia');
    });

    it('should return deuteranopia when applied', () => {
      applyVisionFilter('deuteranopia');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('deuteranopia');
    });

    it('should return tritanopia when applied', () => {
      applyVisionFilter('tritanopia');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('tritanopia');
    });

    it('should return achromatopsia when applied', () => {
      applyVisionFilter('achromatopsia');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('achromatopsia');
    });

    it('should return blur-low when applied', () => {
      applyVisionFilter('blur-low');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('blur-low');
    });

    it('should return blur-medium when applied', () => {
      applyVisionFilter('blur-medium');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('blur-medium');
    });

    it('should return blur-high when applied', () => {
      applyVisionFilter('blur-high');
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('blur-high');
    });

    it('should return none after removing filter', () => {
      applyVisionFilter('protanopia');
      removeVisionFilter();
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('none');
    });

    it('should handle filter string matching', () => {
      // Manually set filter to test parsing
      document.documentElement.style.filter = 'url(#watchdog-vision-filter-protanopia)';
      const mode = getCurrentVisionFilter();
      expect(mode).toBe('protanopia');
    });
  });

  describe('Filter persistence', () => {
    it('should maintain filter when applying same mode twice', () => {
      applyVisionFilter('protanopia');
      const filter1 = document.documentElement.style.filter;

      applyVisionFilter('protanopia');
      const filter2 = document.documentElement.style.filter;

      expect(filter1).toBe(filter2);
    });

    it('should replace filter when applying different mode', () => {
      applyVisionFilter('protanopia');
      const filter1 = document.documentElement.style.filter;

      applyVisionFilter('deuteranopia');
      const filter2 = document.documentElement.style.filter;

      expect(filter1).not.toBe(filter2);
      expect(filter2).toContain('deuteranopia');
    });
  });

  describe('SVG filter structure', () => {
    it('should create valid SVG element', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      expect(svg).toBeTruthy();
      expect(svg?.namespaceURI).toContain('svg');
    });

    it('should have correct SVG styling', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters') as SVGElement;
      expect(svg).toBeTruthy();
      expect(svg.style.position).toBeTruthy();
      expect(svg.style.overflow).toBeTruthy();
    });

    it('should contain defs element', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      const defs = svg?.querySelector('defs');
      expect(defs).toBeTruthy();
    });

    it('should contain filter elements with correct IDs', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      const filter = svg?.querySelector('filter');
      expect(filter?.getAttribute('id')).toContain('watchdog-vision-filter');
    });

    it('should contain feColorMatrix elements', () => {
      applyVisionFilter('protanopia');

      const svg = document.getElementById('watchdog-vision-filters');
      const matrix = svg?.querySelector('feColorMatrix');
      expect(matrix).toBeTruthy();
      expect(matrix?.getAttribute('type')).toBe('matrix');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid filter changes', () => {
      const modes = ['protanopia', 'deuteranopia', 'blur-low', 'tritanopia', 'none'] as const;

      modes.forEach((mode) => {
        applyVisionFilter(mode);
      });

      const currentMode = getCurrentVisionFilter();
      expect(currentMode).toBe('none');
    });

    it('should handle manual filter removal', () => {
      applyVisionFilter('protanopia');
      document.documentElement.style.filter = '';

      const mode = getCurrentVisionFilter();
      expect(mode).toBe('none');
    });

    it('should handle SVG element removal', () => {
      applyVisionFilter('protanopia');
      const svg = document.getElementById('watchdog-vision-filters');
      svg?.remove();

      expect(() => removeVisionFilter()).not.toThrow();
    });
  });
});
