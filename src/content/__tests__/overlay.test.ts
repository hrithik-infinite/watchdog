import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { highlightElement, clearHighlights, highlightMultiple } from '../overlay';

describe('Overlay - Element Highlighting', () => {
  let mockScrollInto: any;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
    vi.clearAllMocks();

    // Mock scrollIntoView
    mockScrollInto = vi.fn();
    HTMLElement.prototype.scrollIntoView = mockScrollInto;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('highlightElement', () => {
    it('should highlight element by class selector', () => {
      document.body.innerHTML = '<div class="test-element">Content</div>';
      const element = document.querySelector('.test-element') as HTMLElement;

      highlightElement('.test-element', 'critical');

      expect(element.classList.contains('watchdog-highlight-critical')).toBe(true);
      expect(element.classList.contains('watchdog-highlight-active')).toBe(true);
    });

    it('should highlight element by ID selector', () => {
      document.body.innerHTML = '<div id="target">Content</div>';
      const element = document.querySelector('#target') as HTMLElement;

      highlightElement('#target', 'serious');

      expect(element.classList.contains('watchdog-highlight-serious')).toBe(true);
    });

    it('should apply correct class for each severity level', () => {
      const severities = ['critical', 'serious', 'moderate', 'minor'] as const;

      severities.forEach((severity) => {
        document.body.innerHTML = '<div class="test">Content</div>';
        highlightElement('.test', severity);
        const element = document.querySelector('.test') as HTMLElement;
        expect(element.classList.contains(`watchdog-highlight-${severity}`)).toBe(true);
      });
    });

    it('should scroll element into view', () => {
      document.body.innerHTML = '<div class="test">Content</div>';
      highlightElement('.test', 'critical');

      expect(mockScrollInto).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    });

    it('should clear previous highlights before adding new one', () => {
      document.body.innerHTML = `
        <div class="element-1">First</div>
        <div class="element-2">Second</div>
      `;

      highlightElement('.element-1', 'critical');
      const element1 = document.querySelector('.element-1') as HTMLElement;
      expect(element1.classList.contains('watchdog-highlight-critical')).toBe(true);

      highlightElement('.element-2', 'serious');
      const element2 = document.querySelector('.element-2') as HTMLElement;

      expect(element1.classList.contains('watchdog-highlight-critical')).toBe(false);
      expect(element2.classList.contains('watchdog-highlight-serious')).toBe(true);
    });

    it('should handle complex CSS selectors', () => {
      document.body.innerHTML = `
        <main>
          <div class="section">
            <span class="target">Content</span>
          </div>
        </main>
      `;

      highlightElement('main .section .target', 'moderate');
      const element = document.querySelector('main .section .target') as HTMLElement;

      expect(element.classList.contains('watchdog-highlight-moderate')).toBe(true);
    });

    it('should warn when element not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      highlightElement('.non-existent', 'critical');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/Element not found for selector/));
      warnSpy.mockRestore();
    });

    it('should handle errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(document, 'querySelector').mockImplementationOnce(() => {
        throw new Error('Selector error');
      });

      highlightElement('.test', 'critical');

      expect(errorSpy).toHaveBeenCalledWith(
        'WatchDog: Failed to highlight element:',
        expect.any(Error)
      );
      errorSpy.mockRestore();
    });
  });

  describe('clearHighlights', () => {
    it('should remove all highlight classes', () => {
      document.body.innerHTML = '<div class="test">Content</div>';
      const element = document.querySelector('.test') as HTMLElement;

      highlightElement('.test', 'critical');
      expect(element.classList.contains('watchdog-highlight-critical')).toBe(true);

      clearHighlights();

      expect(element.classList.contains('watchdog-highlight-critical')).toBe(false);
      expect(element.classList.contains('watchdog-highlight-active')).toBe(false);
    });

    it('should remove all severity classes', () => {
      document.body.innerHTML = '<div class="test">Content</div>';
      const element = document.querySelector('.test') as HTMLElement;

      // Highlight first so the element is tracked
      highlightElement('.test', 'critical');

      // Verify highlight was applied
      expect(element.classList.contains('watchdog-highlight-critical')).toBe(true);

      clearHighlights();

      // Verify highlight was removed
      expect(element.classList.contains('watchdog-highlight-critical')).toBe(false);
      expect(element.classList.contains('watchdog-highlight-active')).toBe(false);
    });

    it('should handle multiple highlighted elements', () => {
      document.body.innerHTML = `
        <div class="element-1">First</div>
        <div class="element-2">Second</div>
        <div class="element-3">Third</div>
      `;

      // Use highlightMultiple to track all elements
      highlightMultiple([
        { selector: '.element-1', severity: 'critical' },
        { selector: '.element-2', severity: 'serious' },
        { selector: '.element-3', severity: 'moderate' },
      ]);

      clearHighlights();

      expect(
        document.querySelector('.element-1')?.classList.contains('watchdog-highlight-critical')
      ).toBe(false);
      expect(
        document.querySelector('.element-2')?.classList.contains('watchdog-highlight-serious')
      ).toBe(false);
      expect(
        document.querySelector('.element-3')?.classList.contains('watchdog-highlight-moderate')
      ).toBe(false);
    });

    it('should be safe to call when no highlights exist', () => {
      expect(() => clearHighlights()).not.toThrow();
    });
  });

  describe('highlightMultiple', () => {
    it('should highlight multiple elements', () => {
      document.body.innerHTML = `
        <div class="element-1">First</div>
        <div class="element-2">Second</div>
        <div class="element-3">Third</div>
      `;

      highlightMultiple([
        { selector: '.element-1', severity: 'critical' },
        { selector: '.element-2', severity: 'serious' },
        { selector: '.element-3', severity: 'moderate' },
      ]);

      expect(
        document.querySelector('.element-1')?.classList.contains('watchdog-highlight-critical')
      ).toBe(true);
      expect(
        document.querySelector('.element-2')?.classList.contains('watchdog-highlight-serious')
      ).toBe(true);
      expect(
        document.querySelector('.element-3')?.classList.contains('watchdog-highlight-moderate')
      ).toBe(true);
    });

    it('should clear previous highlights before adding new ones', () => {
      document.body.innerHTML = `
        <div class="old">Old Element</div>
        <div class="new">New Element</div>
      `;

      highlightElement('.old', 'critical');
      expect(
        document.querySelector('.old')?.classList.contains('watchdog-highlight-critical')
      ).toBe(true);

      highlightMultiple([{ selector: '.new', severity: 'serious' }]);

      expect(
        document.querySelector('.old')?.classList.contains('watchdog-highlight-critical')
      ).toBe(false);
      expect(document.querySelector('.new')?.classList.contains('watchdog-highlight-serious')).toBe(
        true
      );
    });

    it('should skip non-existent selectors', () => {
      document.body.innerHTML = `
        <div class="exists">Exists</div>
      `;

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      highlightMultiple([
        { selector: '.exists', severity: 'critical' },
        { selector: '.does-not-exist', severity: 'serious' },
      ]);

      expect(
        document.querySelector('.exists')?.classList.contains('watchdog-highlight-critical')
      ).toBe(true);
      errorSpy.mockRestore();
    });

    it('should handle empty array', () => {
      document.body.innerHTML = '<div class="test">Test</div>';
      highlightElement('.test', 'critical');

      highlightMultiple([]);

      expect(
        document.querySelector('.test')?.classList.contains('watchdog-highlight-critical')
      ).toBe(false);
    });

    it('should handle many elements', () => {
      let html = '';
      for (let i = 0; i < 50; i++) {
        html += `<div class="element-${i}">Element ${i}</div>`;
      }
      document.body.innerHTML = html;

      const selectors = Array.from({ length: 50 }, (_, i) => ({
        selector: `.element-${i}`,
        severity: (['critical', 'serious', 'moderate', 'minor'] as const)[i % 4],
      }));

      highlightMultiple(selectors);

      selectors.forEach((sel, i) => {
        const el = document.querySelector(sel.selector);
        expect(el?.classList.contains(`watchdog-highlight-${sel.severity}`)).toBe(true);
      });
    });

    it('should handle selector errors gracefully', () => {
      document.body.innerHTML = '<div class="test">Test</div>';
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let callCount = 0;

      vi.spyOn(document, 'querySelector').mockImplementation((sel) => {
        callCount++;
        if (callCount === 2) throw new Error('Selector error');
        return document.querySelector(sel as string);
      });

      highlightMultiple([
        { selector: '.test', severity: 'critical' },
        { selector: '.error', severity: 'serious' },
      ]);

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
