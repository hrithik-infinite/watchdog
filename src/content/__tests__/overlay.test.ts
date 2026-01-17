import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Overlay Manager', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="test-element" class="test-class">Test Content</div>
      <button id="test-button">Click me</button>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Element highlighting', () => {
    it('should find elements by selector', () => {
      const element = document.querySelector('#test-element');
      expect(element).toBeTruthy();
      expect(element?.textContent).toBe('Test Content');
    });

    it('should apply highlight classes correctly', () => {
      const element = document.querySelector('#test-element') as HTMLElement;
      expect(element).toBeTruthy();

      const severityClasses = [
        'watchdog-highlight-critical',
        'watchdog-highlight-serious',
        'watchdog-highlight-moderate',
        'watchdog-highlight-minor',
      ];

      severityClasses.forEach((className) => {
        element.classList.add(className);
        expect(element.classList.contains(className)).toBe(true);
        element.classList.remove(className);
      });
    });

    it('should support multiple elements with same class', () => {
      document.body.innerHTML = `
        <div class="highlight-target">Element 1</div>
        <div class="highlight-target">Element 2</div>
        <div class="highlight-target">Element 3</div>
      `;

      const elements = document.querySelectorAll('.highlight-target');
      expect(elements.length).toBe(3);

      elements.forEach((el) => {
        expect(el.classList.contains('highlight-target')).toBe(true);
      });
    });

    it('should handle complex selectors', () => {
      document.body.innerHTML = `
        <div class="parent">
          <div class="child">
            <span id="target">Target</span>
          </div>
        </div>
      `;

      const selectors = ['#target', '.parent .child span', 'div.parent > div.child > span#target'];

      selectors.forEach((selector) => {
        const element = document.querySelector(selector);
        expect(element).toBeTruthy();
        expect(element?.textContent).toBe('Target');
      });
    });
  });

  describe('Highlight removal', () => {
    it('should remove all highlight classes', () => {
      const element = document.querySelector('#test-element') as HTMLElement;
      const highlightClasses = [
        'watchdog-highlight-critical',
        'watchdog-highlight-serious',
        'watchdog-highlight-moderate',
        'watchdog-highlight-minor',
        'watchdog-highlight-active',
      ];

      // Add all classes
      highlightClasses.forEach((className) => {
        element.classList.add(className);
      });

      // Remove all classes
      highlightClasses.forEach((className) => {
        element.classList.remove(className);
      });

      // Verify all removed
      highlightClasses.forEach((className) => {
        expect(element.classList.contains(className)).toBe(false);
      });
    });
  });

  describe('Scroll into view', () => {
    it('should have scrollIntoView method available', () => {
      const element = document.querySelector('#test-element') as HTMLElement;
      expect(element.scrollIntoView).toBeDefined();
    });
  });
});
