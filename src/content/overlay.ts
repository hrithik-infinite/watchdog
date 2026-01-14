import type { Severity } from '@/shared/types';

const HIGHLIGHT_CLASS_PREFIX = 'watchdog-highlight';
const ACTIVE_CLASS = 'watchdog-highlight-active';

// Track currently highlighted elements
const highlightedElements: Set<Element> = new Set();

function getHighlightClass(severity: Severity): string {
  return `${HIGHLIGHT_CLASS_PREFIX}-${severity}`;
}

export function highlightElement(selector: string, severity: Severity): void {
  // Clear previous highlights first
  clearHighlights();

  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`WatchDog: Element not found for selector: ${selector}`);
      return;
    }

    // Add highlight classes
    element.classList.add(getHighlightClass(severity));
    element.classList.add(ACTIVE_CLASS);
    highlightedElements.add(element);

    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  } catch (error) {
    console.error('WatchDog: Failed to highlight element:', error);
  }
}

export function clearHighlights(): void {
  for (const element of highlightedElements) {
    // Remove all highlight classes
    element.classList.remove(ACTIVE_CLASS);
    element.classList.remove(`${HIGHLIGHT_CLASS_PREFIX}-critical`);
    element.classList.remove(`${HIGHLIGHT_CLASS_PREFIX}-serious`);
    element.classList.remove(`${HIGHLIGHT_CLASS_PREFIX}-moderate`);
    element.classList.remove(`${HIGHLIGHT_CLASS_PREFIX}-minor`);
  }
  highlightedElements.clear();
}

export function highlightMultiple(
  selectors: Array<{ selector: string; severity: Severity }>
): void {
  clearHighlights();

  for (const { selector, severity } of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add(getHighlightClass(severity));
        highlightedElements.add(element);
      }
    } catch (error) {
      console.error('WatchDog: Failed to highlight element:', error);
    }
  }
}
