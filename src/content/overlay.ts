import logger from '@/shared/logger';
import type { Severity } from '@/shared/types';

const HIGHLIGHT_CLASS_PREFIX = 'watchdog-highlight';
const ACTIVE_CLASS = 'watchdog-highlight-active';

// Track currently highlighted elements
const highlightedElements: Set<Element> = new Set();

function getHighlightClass(severity: Severity): string {
  return `${HIGHLIGHT_CLASS_PREFIX}-${severity}`;
}

// Elements that shouldn't be highlighted (full-page elements)
const SKIP_HIGHLIGHT_TAGS = ['body', 'html'];

export function highlightElement(selector: string, severity: Severity): void {
  // Clear previous highlights first
  clearHighlights();

  try {
    const element = document.querySelector(selector);
    if (!element) {
      logger.warn('Element not found for selector', { selector });
      return;
    }

    // Skip highlighting full-page elements (body/html) — this is a routine,
    // expected no-op, so it stays silent rather than logging on every call.
    const tagName = element.tagName.toLowerCase();
    if (SKIP_HIGHLIGHT_TAGS.includes(tagName)) {
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
    logger.error('Failed to highlight element', { error });
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
        // Skip highlighting full-page elements
        const tagName = element.tagName.toLowerCase();
        if (SKIP_HIGHLIGHT_TAGS.includes(tagName)) {
          continue;
        }
        element.classList.add(getHighlightClass(severity));
        highlightedElements.add(element);
      }
    } catch (error) {
      logger.error('Failed to highlight element', { error });
    }
  }
}
