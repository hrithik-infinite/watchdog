/**
 * Focus Order Visualization
 * Shows numbered badges on all focusable elements to visualize keyboard tab order
 */

const BADGE_CLASS = 'watchdog-focus-badge';
const CONTAINER_ID = 'watchdog-focus-order-container';

// childList + subtree only (no attribute observation): repositioning a badge
// writes to its inline style, and observing style on the subtree would make
// every scroll-driven reposition re-trigger a full re-render — defeating the
// rAF throttle below. Element add/remove is the case we need to stay in sync.
const OBSERVER_OPTIONS: MutationObserverInit = { childList: true, subtree: true };

// Original inline outline styles captured when we highlight an element, so hiding
// the visualization restores the page's own outline instead of clobbering it
// to empty (correctness-23).
interface HighlightRecord {
  element: HTMLElement;
  outline: string;
  outlineOffset: string;
}

let highlightedElements: HighlightRecord[] = [];
let renderedElements: Element[] = [];
let activeContainer: HTMLDivElement | null = null;
let rafId: number | null = null;
// Stored so the exact same handler reference is passed to removeEventListener.
let scheduleReposition: (() => void) | null = null;
let domObserver: MutationObserver | null = null;

/**
 * Resolve an element's tabindex as a finite integer, defaulting to 0.
 * A non-numeric tabindex (e.g. tabindex="abc") yields NaN from parseInt, which
 * would otherwise leak into the sort comparator and corrupt ordering — treat it
 * as the implicit 0 the browser uses for such values (correctness-24).
 */
function getTabIndex(element: Element): number {
  const raw = element.getAttribute('tabindex');
  if (raw === null) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Whether an element is actually visible to (and reachable by) the user.
 * Hidden elements still match the focusable selectors but must not get a badge
 * (correctness-24): display:none / visibility:hidden / the hidden attribute,
 * anything inside an aria-hidden subtree, and boxes that render nothing.
 */
function isElementVisible(element: Element): boolean {
  const htmlEl = element as HTMLElement;

  // Removed from the accessibility tree → not a real tab stop for AT users.
  if (htmlEl.closest('[aria-hidden="true"]')) return false;

  if (htmlEl.hidden) return false;

  const style = window.getComputedStyle(htmlEl);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse'
  ) {
    return false;
  }

  // Zero-size / un-rendered boxes (display:none ancestors, detached subtrees,
  // collapsed boxes) produce no client rects. getClientRects() is used rather
  // than getBoundingClientRect() because layout-less environments still report
  // a rect for attached visible nodes, so genuinely visible elements survive.
  if (htmlEl.getClientRects().length === 0) return false;

  return true;
}

/**
 * Get all focusable elements in the DOM in tab order
 */
function getFocusableElements(): Element[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const elements = Array.from(document.querySelectorAll(selector)).filter(isElementVisible);

  // Sort by tabindex if present
  return elements.sort((a, b) => {
    const aIndex = getTabIndex(a);
    const bIndex = getTabIndex(b);

    // Elements with tabindex > 0 come first
    if (aIndex > 0 && bIndex > 0) return aIndex - bIndex;
    if (aIndex > 0) return -1;
    if (bIndex > 0) return 1;

    // Elements with tabindex 0 or no tabindex follow DOM order
    return 0;
  });
}

/**
 * Create a numbered badge element
 */
function createBadge(number: number): HTMLElement {
  const badge = document.createElement('div');
  badge.className = BADGE_CLASS;
  badge.textContent = number.toString();
  badge.style.cssText = `
    position: absolute;
    z-index: 2147483646;
    min-width: 24px;
    height: 24px;
    padding: 4px 6px;
    background: #2563EB;
    color: white;
    border-radius: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  return badge;
}

/**
 * Position badge relative to target element
 */
function positionBadge(badge: HTMLElement, element: Element): void {
  const rect = element.getBoundingClientRect();

  // Position badge at top-left corner of element
  badge.style.left = `${rect.left + window.scrollX - 8}px`;
  badge.style.top = `${rect.top + window.scrollY - 8}px`;
}

/**
 * Highlight the target element, remembering its original inline outline first.
 */
function applyHighlight(element: HTMLElement): void {
  highlightedElements.push({
    element,
    outline: element.style.outline,
    outlineOffset: element.style.outlineOffset,
  });
  element.style.outline = '2px solid #2563EB';
  element.style.outlineOffset = '2px';
}

/**
 * Restore every highlighted element's original inline outline (correctness-23).
 */
function restoreHighlights(): void {
  highlightedElements.forEach(({ element, outline, outlineOffset }) => {
    element.style.outline = outline;
    element.style.outlineOffset = outlineOffset;
  });
  highlightedElements = [];
}

/**
 * (Re)build the badges and highlights for the current focusable set into the
 * active container. Used on show and whenever the DOM changes while shown.
 */
function renderFocusOrder(): void {
  if (!activeContainer) return;

  // Drop the previous render and restore any outlines we'd applied, so removed
  // elements get cleaned up and indices stay correct.
  activeContainer.replaceChildren();
  restoreHighlights();

  const focusableElements = getFocusableElements();
  focusableElements.forEach((element, index) => {
    const badge = createBadge(index + 1);
    positionBadge(badge, element);
    activeContainer!.appendChild(badge);
    applyHighlight(element as HTMLElement);
  });
  renderedElements = focusableElements;
}

/**
 * Reposition existing badges without rebuilding them.
 */
function repositionBadges(): void {
  if (!activeContainer) return;
  const badges = activeContainer.querySelectorAll(`.${BADGE_CLASS}`);
  renderedElements.forEach((element, index) => {
    const badge = badges[index] as HTMLElement | undefined;
    if (badge) {
      positionBadge(badge, element);
    }
  });
}

/**
 * Show focus order visualization
 */
export function showFocusOrder(): void {
  // Clean up any existing visualization
  hideFocusOrder();

  // Create container for all badges
  activeContainer = document.createElement('div');
  activeContainer.id = CONTAINER_ID;
  activeContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483645;
  `;
  document.body.appendChild(activeContainer);

  // Create and position badges + highlights for the current focusable set.
  renderFocusOrder();

  // Update badge positions on scroll and resize, throttled to one DOM write per
  // animation frame so rapid scroll events don't thrash layout (perf-rel-2).
  scheduleReposition = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      repositionBadges();
    });
  };

  window.addEventListener('scroll', scheduleReposition, true);
  window.addEventListener('resize', scheduleReposition);

  // Keep badges in sync as the page mutates while the overlay is shown
  // (correctness-24). Disconnect during our own re-render so the badge/outline
  // writes don't re-trigger the observer.
  domObserver = new MutationObserver(() => {
    if (!activeContainer) return;
    domObserver?.disconnect();
    renderFocusOrder();
    domObserver?.observe(document.body, OBSERVER_OPTIONS);
  });
  domObserver.observe(document.body, OBSERVER_OPTIONS);
}

/**
 * Hide focus order visualization
 */
export function hideFocusOrder(): void {
  // Stop watching the DOM first so teardown mutations don't queue a re-render.
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }

  if (scheduleReposition) {
    window.removeEventListener('scroll', scheduleReposition, true);
    window.removeEventListener('resize', scheduleReposition);
    scheduleReposition = null;
  }

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Restore original outlines on every element we touched (correctness-23).
  restoreHighlights();
  renderedElements = [];

  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    container.remove();
  }
  activeContainer = null;
}

/**
 * Toggle focus order visualization
 */
export function toggleFocusOrder(show: boolean): void {
  if (show) {
    showFocusOrder();
  } else {
    hideFocusOrder();
  }
}
