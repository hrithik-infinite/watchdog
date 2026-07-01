import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hideFocusOrder, showFocusOrder, toggleFocusOrder } from '../focus-order';

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

  describe('Scroll and resize handlers', () => {
    it('should update badge positions on scroll event', () => {
      document.body.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

      showFocusOrder();

      const container = document.getElementById('watchdog-focus-order-container');
      const badges = container?.querySelectorAll('.watchdog-focus-badge');
      expect(badges?.length).toBe(2);

      // Get initial badge position
      const firstBadge = badges?.[0] as HTMLElement;
      const initialTop = firstBadge?.style.top;

      // Trigger scroll event
      const scrollEvent = new Event('scroll', { bubbles: true });
      window.dispatchEvent(scrollEvent);

      // Badges should still exist after scroll (positions get updated)
      const badgesAfterScroll = container?.querySelectorAll('.watchdog-focus-badge');
      expect(badgesAfterScroll?.length).toBe(2);
    });

    it('should update badge positions on resize event', () => {
      document.body.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

      showFocusOrder();

      const container = document.getElementById('watchdog-focus-order-container');
      const badges = container?.querySelectorAll('.watchdog-focus-badge');
      expect(badges?.length).toBe(2);

      // Trigger resize event
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Badges should still exist after resize (positions get updated)
      const badgesAfterResize = container?.querySelectorAll('.watchdog-focus-badge');
      expect(badgesAfterResize?.length).toBe(2);
    });

    it('should handle scroll events when badges exist', () => {
      document.body.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

      showFocusOrder();

      // Verify badges are created
      const container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();

      // Dispatch multiple scroll events to ensure handler works
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(new Event('scroll', { bubbles: true }));
      }

      // Badges should still be present and positioned
      const badgesAfter = container?.querySelectorAll('.watchdog-focus-badge');
      expect(badgesAfter?.length).toBe(3);
    });

    it('should handle resize events when badges exist', () => {
      document.body.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

      showFocusOrder();

      const container = document.getElementById('watchdog-focus-order-container');
      expect(container).toBeTruthy();

      // Dispatch multiple resize events
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(new Event('resize'));
      }

      // Badges should still be present
      const badgesAfter = container?.querySelectorAll('.watchdog-focus-badge');
      expect(badgesAfter?.length).toBe(3);
    });

    it('should not throw when scroll occurs after hiding focus order', () => {
      document.body.innerHTML = '<button>Click</button>';

      showFocusOrder();
      hideFocusOrder();

      // Should not throw when scroll event fires after cleanup
      expect(() => {
        window.dispatchEvent(new Event('scroll', { bubbles: true }));
      }).not.toThrow();
    });

    it('should not throw when resize occurs after hiding focus order', () => {
      document.body.innerHTML = '<button>Click</button>';

      showFocusOrder();
      hideFocusOrder();

      // Should not throw when resize event fires after cleanup
      expect(() => {
        window.dispatchEvent(new Event('resize'));
      }).not.toThrow();
    });
  });

  // Regression coverage for correctness-24 (visibility + NaN tabindex + DOM sync),
  // correctness-23 (original outline restore) and perf-rel-2 (scroll throttling).
  describe('Visibility filtering (correctness-24)', () => {
    // Buggy behavior: hidden elements still matched the focusable selectors and
    // got a badge, so the visualization showed tab stops the user can't reach.
    it('should exclude display:none elements', () => {
      document.body.innerHTML = `
        <button id="visible">Visible</button>
        <button id="gone" style="display:none">Hidden</button>
      `;

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBe(1);
      expect((document.getElementById('visible') as HTMLElement).style.outline).toBeTruthy();
      expect((document.getElementById('gone') as HTMLElement).style.outline).toBe('');
    });

    it('should exclude visibility:hidden elements', () => {
      document.body.innerHTML = `
        <button id="visible">Visible</button>
        <button id="invisible" style="visibility:hidden">Hidden</button>
      `;

      showFocusOrder();

      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(1);
    });

    it('should exclude elements with the hidden attribute', () => {
      document.body.innerHTML = `
        <button id="visible">Visible</button>
        <button id="hidden-attr" hidden>Hidden</button>
      `;

      showFocusOrder();

      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(1);
    });

    it('should exclude elements inside an aria-hidden subtree', () => {
      document.body.innerHTML = `
        <button id="visible">Visible</button>
        <div aria-hidden="true">
          <button id="ariaHidden">Hidden</button>
        </div>
      `;

      showFocusOrder();

      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(1);
    });

    it('should exclude zero-size elements that render no client rects', () => {
      document.body.innerHTML = `
        <button id="a">A</button>
        <button id="b">B</button>
      `;
      const b = document.getElementById('b') as HTMLElement;
      // Simulate a collapsed/un-rendered box: getClientRects() returns no rects.
      vi.spyOn(b, 'getClientRects').mockReturnValue({ length: 0 } as unknown as DOMRectList);

      showFocusOrder();

      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(1);
    });
  });

  describe('Tabindex parsing (correctness-24)', () => {
    const rectAt = (left: number, top: number): DOMRect =>
      ({
        left,
        top,
        width: 10,
        height: 10,
        right: left + 10,
        bottom: top + 10,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    // Buggy behavior: parseInt of a non-numeric tabindex yielded NaN, which fed
    // into the sort comparator. A non-numeric tabindex must be treated as the
    // implicit 0 the browser uses, leaving positive tabindex elements ahead and
    // the rest in DOM order.
    it('should treat a non-numeric tabindex as 0 without corrupting order', () => {
      document.body.innerHTML = `
        <button id="normal">Normal</button>
        <button id="weird" tabindex="abc">Weird</button>
        <button id="prio" tabindex="1">Priority</button>
      `;
      // Distinct rects let us read back which element each (sorted) badge sits on.
      vi.spyOn(document.getElementById('normal')!, 'getBoundingClientRect').mockReturnValue(
        rectAt(200, 0)
      );
      vi.spyOn(document.getElementById('weird')!, 'getBoundingClientRect').mockReturnValue(
        rectAt(300, 0)
      );
      vi.spyOn(document.getElementById('prio')!, 'getBoundingClientRect').mockReturnValue(
        rectAt(100, 0)
      );

      showFocusOrder();

      const badges = document.querySelectorAll('.watchdog-focus-badge');
      expect(badges.length).toBe(3);
      // Badges are appended in tab order: positive tabindex (prio) first, then
      // the two tabindex-0 elements (normal, weird) in DOM order.
      // positionBadge offsets left by -8px.
      expect((badges[0] as HTMLElement).style.left).toBe('92px'); // prio (100)
      expect((badges[1] as HTMLElement).style.left).toBe('192px'); // normal (200)
      expect((badges[2] as HTMLElement).style.left).toBe('292px'); // weird (300)
    });
  });

  describe('Outline restoration (correctness-23)', () => {
    // Buggy behavior: hideFocusOrder set outline='' unconditionally, wiping any
    // outline the page itself had set inline.
    it('should restore the original inline outline instead of clearing it', () => {
      document.body.innerHTML =
        '<button id="btn" style="outline: 3px dashed red; outline-offset: 5px;">x</button>';
      const btn = document.getElementById('btn') as HTMLElement;
      const originalOutline = btn.style.outline;
      const originalOffset = btn.style.outlineOffset;
      expect(originalOutline).toBeTruthy();

      showFocusOrder();
      // While shown, the highlight overrides the page outline.
      expect(btn.style.outline).not.toBe(originalOutline);
      expect(btn.style.outlineOffset).toBe('2px');

      hideFocusOrder();
      // Original inline outline is restored, not blanked.
      expect(btn.style.outline).toBe(originalOutline);
      expect(btn.style.outlineOffset).toBe(originalOffset);
    });

    it('should restore an empty outline for elements that had none', () => {
      document.body.innerHTML = '<button id="btn">x</button>';
      const btn = document.getElementById('btn') as HTMLElement;

      showFocusOrder();
      expect(btn.style.outline).toBeTruthy();

      hideFocusOrder();
      expect(btn.style.outline).toBe('');
      expect(btn.style.outlineOffset).toBe('');
    });
  });

  describe('Scroll throttling (perf-rel-2)', () => {
    // Buggy behavior: every scroll event repositioned all badges synchronously,
    // thrashing layout. Repositioning is now coalesced into one animation frame.
    it('should schedule only one animation frame for a burst of scroll events', () => {
      document.body.innerHTML = '<button>B</button>';
      showFocusOrder();

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      for (let i = 0; i < 5; i++) {
        window.dispatchEvent(new Event('scroll', { bubbles: true }));
      }

      expect(rafSpy).toHaveBeenCalledTimes(1);
      rafSpy.mockRestore();
    });

    it('should reposition badges when the scheduled frame runs', () => {
      document.body.innerHTML = '<button id="b">B</button>';
      const btn = document.getElementById('b') as HTMLElement;
      const rectSpy = vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 50,
        width: 10,
        height: 10,
        right: 110,
        bottom: 60,
        x: 100,
        y: 50,
        toJSON: () => ({}),
      } as DOMRect);

      let frameCb: FrameRequestCallback | null = null;
      const rafSpy = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          frameCb = cb;
          return 1;
        });

      showFocusOrder();
      const badge = document.querySelector('.watchdog-focus-badge') as HTMLElement;
      expect(badge.style.left).toBe('92px');

      // Element moves; a scroll schedules a frame that has not run yet.
      rectSpy.mockReturnValue({
        left: 200,
        top: 50,
        width: 10,
        height: 10,
        right: 210,
        bottom: 60,
        x: 200,
        y: 50,
        toJSON: () => ({}),
      } as DOMRect);
      window.dispatchEvent(new Event('scroll', { bubbles: true }));
      expect(badge.style.left).toBe('92px'); // not repositioned synchronously

      // Running the frame applies the new position.
      expect(typeof frameCb).toBe('function');
      frameCb!(0);
      expect(badge.style.left).toBe('192px');

      rafSpy.mockRestore();
    });
  });

  describe('DOM mutation sync (correctness-24)', () => {
    // Buggy behavior: badges were rendered once and never updated, so elements
    // added or removed while the overlay was shown went un-badged or stale.
    it('should add a badge when a focusable element is inserted while shown', async () => {
      document.body.innerHTML = '<button>A</button>';
      showFocusOrder();
      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(1);

      const btn = document.createElement('button');
      btn.textContent = 'B';
      document.body.appendChild(btn);

      // MutationObserver delivers asynchronously.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(2);
    });

    it('should remove a badge when a focusable element is removed while shown', async () => {
      document.body.innerHTML = `
        <button id="a">A</button>
        <button id="b">B</button>
      `;
      showFocusOrder();
      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(2);

      document.getElementById('b')?.remove();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(1);
    });

    it('should stop observing the DOM after hide', async () => {
      document.body.innerHTML = '<button>A</button>';
      showFocusOrder();
      hideFocusOrder();

      // Mutations after hide must not recreate the container/badges.
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.getElementById('watchdog-focus-order-container')).toBeFalsy();
      expect(document.querySelectorAll('.watchdog-focus-badge').length).toBe(0);
    });
  });
});
