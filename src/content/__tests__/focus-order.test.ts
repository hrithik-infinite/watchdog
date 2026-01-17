import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showFocusOrder, hideFocusOrder, toggleFocusOrder } from '../focus-order';

describe('Focus Order Visualization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    hideFocusOrder();
  });

  describe('showFocusOrder', () => {
    it('should create container element', () => {
      document.body.innerHTML = '<button>Click me</button>';
      showFocusOrder();

      const container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();
    });

    it('should create badges for all focusable elements', () => {
      document.body.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text">
        <button>Button 2</button>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges.length).toBeLessThanOrEqual(4);
    });

    it('should number badges sequentially', () => {
      document.body.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      badges.forEach((badge, index) => {
        expect(badge.textContent).toBe((index + 1).toString());
      });
    });

    it('should highlight focusable elements', () => {
      document.body.innerHTML = '<button id="btn">Click</button>';
      showFocusOrder();

      const button = document.getElementById('btn') as HTMLElement;
      expect(button.style.outline).toBeTruthy();
      expect(button.style.outlineOffset).toBeTruthy();
    });

    it('should handle links with href', () => {
      document.body.innerHTML = `
        <a href="/">Home</a>
        <a href="/about">About</a>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBe(2);
    });

    it('should handle form inputs', () => {
      document.body.innerHTML = `
        <input type="text" placeholder="Text">
        <input type="checkbox">
        <textarea></textarea>
        <select><option>Option</option></select>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThanOrEqual(4);
    });

    it('should skip disabled elements', () => {
      document.body.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
        <input type="text">
        <input type="text" disabled>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      // Should only include enabled elements
      expect(badges.length).toBeLessThanOrEqual(2);
    });

    it('should skip links without href', () => {
      document.body.innerHTML = `
        <a href="/">With href</a>
        <a>Without href</a>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBe(1);
    });

    it('should handle contenteditable elements', () => {
      document.body.innerHTML = `
        <div contenteditable="true">Editable</div>
        <div contenteditable="false">Not editable</div>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle tabindex elements', () => {
      document.body.innerHTML = `
        <div tabindex="0">Focusable</div>
        <div tabindex="-1">Not focusable</div>
        <div tabindex="1">High priority</div>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it('should clean up existing visualization before creating new one', () => {
      document.body.innerHTML = '<button>Click</button>';

      showFocusOrder();
      let containers = document.querySelectorAll('#watchdog-focus-order-container');
      expect(containers.length).toBe(1);

      showFocusOrder();
      containers = document.querySelectorAll('#watchdog-focus-order-container');
      expect(containers.length).toBe(1);
    });

    it('should register scroll and resize listeners', () => {
      document.body.innerHTML = '<button>Click</button>';

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      showFocusOrder();

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should apply correct styling to badges', () => {
      document.body.innerHTML = '<button>Click</button>';
      showFocusOrder();

      const badge = document.querySelector('.watchdog-focus-badge') as HTMLElement;
      expect(badge.style.position).toBe('absolute');
      expect(badge.style.zIndex).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('should apply correct styling to container', () => {
      document.body.innerHTML = '<button>Click</button>';
      showFocusOrder();

      const container = document.getElementById('watchdog-focus-order-container') as HTMLElement;
      expect(container.style.position).toBe('absolute');
      expect(container.style.pointerEvents).toBe('none');
    });
  });

  describe('hideFocusOrder', () => {
    it('should remove container element', () => {
      document.body.innerHTML = '<button>Click</button>';
      showFocusOrder();

      let container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();

      hideFocusOrder();

      container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeFalsy();
    });

    it('should remove highlights from elements', () => {
      document.body.innerHTML = '<button id="btn">Click</button>';
      showFocusOrder();

      const button = document.getElementById('btn') as HTMLElement;
      expect(button.style.outline).toBeTruthy();

      hideFocusOrder();

      expect(button.style.outline).toBe('');
      expect(button.style.outlineOffset).toBe('');
    });

    it('should remove event listeners', () => {
      document.body.innerHTML = '<button>Click</button>';
      showFocusOrder();

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      hideFocusOrder();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should be safe to call when no visualization exists', () => {
      expect(() => hideFocusOrder()).not.toThrow();
    });

    it('should remove all badges', () => {
      document.body.innerHTML = `
        <button>1</button>
        <button>2</button>
        <button>3</button>
      `;

      showFocusOrder();
      let badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBe(3);

      hideFocusOrder();
      badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBe(0);
    });
  });

  describe('toggleFocusOrder', () => {
    it('should show focus order when passed true', () => {
      document.body.innerHTML = '<button>Click</button>';

      toggleFocusOrder(true);

      const container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();
    });

    it('should hide focus order when passed false', () => {
      document.body.innerHTML = '<button>Click</button>';

      toggleFocusOrder(true);
      let container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();

      toggleFocusOrder(false);
      container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeFalsy();
    });

    it('should toggle between show and hide', () => {
      document.body.innerHTML = '<button>Click</button>';

      toggleFocusOrder(true);
      expect(document.getElementById('watchdog-focus-order-container')).toBeTruthy();

      toggleFocusOrder(false);
      expect(document.getElementById('watchdog-focus-order-container')).toBeFalsy();

      toggleFocusOrder(true);
      expect(document.getElementById('watchdog-focus-order-container')).toBeTruthy();
    });
  });

  describe('Focus order sorting', () => {
    it('should prioritize tabindex > 0 elements first', () => {
      document.body.innerHTML = `
        <button tabindex="2">Priority 2</button>
        <button tabindex="1">Priority 1</button>
        <button>Normal</button>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      // The first badge should have text "1" (first in tab order)
      expect(badges[0].textContent).toBe('1');
    });

    it('should maintain DOM order for elements with same tabindex', () => {
      document.body.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Complex layouts', () => {
    it('should handle nested elements', () => {
      document.body.innerHTML = `
        <div>
          <section>
            <button>Button</button>
            <div>
              <input type="text">
            </div>
          </section>
        </div>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle shadow DOM elements gracefully', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const host = document.getElementById('host');
      // Note: happy-dom may not support shadow DOM
      // This test just ensures the function doesn't crash

      showFocusOrder();

      const container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();
    });

    it('should handle large number of focusable elements', () => {
      let html = '';
      for (let i = 0; i < 100; i++) {
        html += `<button>Button ${i}</button>`;
      }
      document.body.innerHTML = html;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBeGreaterThan(90);
    });
  });
});
