/**
 * Focus Order Visualization
 * Shows numbered badges on all focusable elements to visualize keyboard tab order
 */

const BADGE_CLASS = 'watchdog-focus-badge';
const CONTAINER_ID = 'watchdog-focus-order-container';

// Store event listeners for cleanup using WeakMap
const eventListenerMap = new WeakMap<HTMLElement, () => void>();

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

  const elements = Array.from(document.querySelectorAll(selector));

  // Sort by tabindex if present
  return elements.sort((a, b) => {
    const aIndex = parseInt(a.getAttribute('tabindex') || '0');
    const bIndex = parseInt(b.getAttribute('tabindex') || '0');

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
 * Highlight the target element
 */
function highlightElement(element: Element): void {
  const el = element as HTMLElement;
  el.style.outline = '2px solid #2563EB';
  el.style.outlineOffset = '2px';
}

/**
 * Remove highlight from element
 */
function removeHighlight(element: Element): void {
  const el = element as HTMLElement;
  el.style.outline = '';
  el.style.outlineOffset = '';
}

/**
 * Show focus order visualization
 */
export function showFocusOrder(): void {
  // Clean up any existing visualization
  hideFocusOrder();

  const focusableElements = getFocusableElements();

  // Create container for all badges
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483645;
  `;
  document.body.appendChild(container);

  // Create and position badges
  focusableElements.forEach((element, index) => {
    const badge = createBadge(index + 1);
    positionBadge(badge, element);
    container.appendChild(badge);

    // Highlight element
    highlightElement(element);
  });

  // Update badge positions on scroll and resize
  const updatePositions = () => {
    const badges = container.querySelectorAll(`.${BADGE_CLASS}`);
    focusableElements.forEach((element, index) => {
      const badge = badges[index] as HTMLElement;
      if (badge) {
        positionBadge(badge, element);
      }
    });
  };

  window.addEventListener('scroll', updatePositions, true);
  window.addEventListener('resize', updatePositions);

  // Store event listeners for cleanup
  eventListenerMap.set(container, updatePositions);
}

/**
 * Hide focus order visualization
 */
export function hideFocusOrder(): void {
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    // Remove event listeners
    const updatePositions = eventListenerMap.get(container);
    if (updatePositions) {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
      eventListenerMap.delete(container);
    }

    // Remove highlights from all focusable elements
    const focusableElements = getFocusableElements();
    focusableElements.forEach((element) => {
      removeHighlight(element);
    });

    // Remove container
    container.remove();
  }
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
