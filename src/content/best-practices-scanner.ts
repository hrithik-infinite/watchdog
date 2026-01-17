import type {
  Issue,
  ScanResult,
  ScanSummary,
  Severity,
  Category,
  WCAGCriteria,
} from '@/shared/types';

let idCounter = 0;

function generateId(): string {
  return `bp-issue-${Date.now()}-${++idCounter}`;
}

interface BestPracticeCheck {
  id: string;
  name: string;
  severity: Severity;
  passed: boolean;
  message: string;
  description: string;
  element?: HTMLElement | null;
  fix: {
    description: string;
    code: string;
  };
}

function checkDoctype(): BestPracticeCheck {
  const doctype = document.doctype;

  if (!doctype) {
    return {
      id: 'doctype-missing',
      name: 'DOCTYPE Declaration',
      severity: 'serious',
      passed: false,
      message: 'Page is missing a DOCTYPE declaration',
      description:
        'A DOCTYPE declaration is required for the browser to render the page in standards mode.',
      element: null,
      fix: {
        description: 'Add a DOCTYPE declaration at the very beginning of your HTML document.',
        code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <!-- head content -->\n</head>',
      },
    };
  }

  const doctypeName = doctype.name.toLowerCase();
  if (doctypeName !== 'html') {
    return {
      id: 'doctype-invalid',
      name: 'DOCTYPE Declaration',
      severity: 'moderate',
      passed: false,
      message: `DOCTYPE is "${doctypeName}", should be "html"`,
      description: 'Use the HTML5 DOCTYPE for modern web standards.',
      element: null,
      fix: {
        description: 'Use the HTML5 DOCTYPE declaration.',
        code: '<!DOCTYPE html>',
      },
    };
  }

  return {
    id: 'doctype-ok',
    name: 'DOCTYPE Declaration',
    severity: 'minor',
    passed: true,
    message: 'DOCTYPE is present and valid',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function checkCharset(): BestPracticeCheck {
  const charset = document.querySelector('meta[charset]');
  const httpEquiv = document.querySelector('meta[http-equiv="Content-Type"]');

  if (!charset && !httpEquiv) {
    return {
      id: 'charset-missing',
      name: 'Character Encoding',
      severity: 'serious',
      passed: false,
      message: 'Page is missing character encoding declaration',
      description:
        'Always declare the character encoding to prevent encoding issues and security vulnerabilities.',
      element: null,
      fix: {
        description: 'Add a meta charset tag in the <head> section.',
        code: '<meta charset="UTF-8">',
      },
    };
  }

  return {
    id: 'charset-ok',
    name: 'Character Encoding',
    severity: 'minor',
    passed: true,
    message: 'Character encoding is declared',
    description: '',
    element: charset as HTMLElement,
    fix: { description: '', code: '' },
  };
}

function checkLangAttribute(): BestPracticeCheck {
  const html = document.documentElement;
  const lang = html.getAttribute('lang');

  if (!lang) {
    return {
      id: 'lang-missing',
      name: 'Language Attribute',
      severity: 'serious',
      passed: false,
      message: 'HTML element is missing lang attribute',
      description:
        'The lang attribute helps screen readers and search engines understand the page language.',
      element: html,
      fix: {
        description: 'Add a lang attribute to the <html> element.',
        code: '<html lang="en">',
      },
    };
  }

  return {
    id: 'lang-ok',
    name: 'Language Attribute',
    severity: 'minor',
    passed: true,
    message: 'Language attribute is present',
    description: '',
    element: html,
    fix: { description: '', code: '' },
  };
}

function checkDeprecatedElements(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const deprecated = [
    'acronym',
    'applet',
    'basefont',
    'big',
    'center',
    'dir',
    'font',
    'frame',
    'frameset',
    'noframes',
    'strike',
    'tt',
    'marquee',
    'blink',
  ];

  const foundDeprecated: string[] = [];

  deprecated.forEach((tag) => {
    const elements = document.querySelectorAll(tag);
    if (elements.length > 0) {
      foundDeprecated.push(`${tag} (${elements.length})`);
    }
  });

  if (foundDeprecated.length > 0) {
    checks.push({
      id: 'deprecated-elements',
      name: 'Deprecated HTML Elements',
      severity: 'moderate',
      passed: false,
      message: `Found deprecated elements: ${foundDeprecated.join(', ')}`,
      description: 'Deprecated HTML elements should be replaced with modern alternatives.',
      element: document.querySelector(deprecated.join(',')) as HTMLElement,
      fix: {
        description: 'Replace deprecated elements with modern HTML5 elements.',
        code: '<!-- Replace <center> with CSS -->\n<div style="text-align: center;">Content</div>\n\n<!-- Replace <font> with CSS -->\n<span style="font-family: Arial;">Text</span>',
      },
    });
  }

  return checks;
}

function checkConsoleErrors(): BestPracticeCheck {
  // We can't directly access console errors, but we can check for common error indicators
  const errorElements = document.querySelectorAll('[onerror]');

  if (errorElements.length > 5) {
    return {
      id: 'excessive-error-handlers',
      name: 'Error Handlers',
      severity: 'moderate',
      passed: false,
      message: `Found ${errorElements.length} inline error handlers`,
      description:
        'Excessive inline error handlers may indicate error-prone code. Use centralized error handling.',
      element: errorElements[0] as HTMLElement,
      fix: {
        description: 'Use centralized error handling instead of inline onerror attributes.',
        code: '// Use a global error handler\nwindow.addEventListener("error", (event) => {\n  console.error("Error:", event.error);\n});',
      },
    };
  }

  return {
    id: 'error-handlers-ok',
    name: 'Error Handlers',
    severity: 'minor',
    passed: true,
    message: 'Error handling is reasonable',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function checkBrokenImages(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const images = document.querySelectorAll('img');
  let brokenCount = 0;
  let firstBroken: HTMLImageElement | null = null;

  images.forEach((img) => {
    if (!img.complete || img.naturalHeight === 0) {
      brokenCount++;
      if (!firstBroken) firstBroken = img;
    }
  });

  if (brokenCount > 0) {
    checks.push({
      id: 'broken-images',
      name: 'Broken Images',
      severity: 'moderate',
      passed: false,
      message: `${brokenCount} image(s) failed to load`,
      description:
        'Broken images create a poor user experience and may indicate incorrect paths or missing files.',
      element: firstBroken,
      fix: {
        description: 'Verify image paths and ensure all images exist on the server.',
        code: '<!-- Ensure correct image paths -->\n<img src="/images/correct-path.jpg" alt="Description">\n\n<!-- Add error handling -->\n<img src="image.jpg" alt="Description" onerror="this.src=\'fallback.jpg\'">',
      },
    });
  }

  return checks;
}

function checkDuplicateIds(): BestPracticeCheck {
  const allIds: { [key: string]: number } = {};
  const elements = document.querySelectorAll('[id]');

  elements.forEach((el) => {
    const id = el.id;
    allIds[id] = (allIds[id] || 0) + 1;
  });

  const duplicates = Object.entries(allIds).filter(([, count]) => count > 1);

  if (duplicates.length > 0) {
    const duplicateList = duplicates.map(([id, count]) => `"${id}" (${count}x)`).join(', ');

    return {
      id: 'duplicate-ids',
      name: 'Duplicate IDs',
      severity: 'serious',
      passed: false,
      message: `Found duplicate IDs: ${duplicateList}`,
      description: 'Duplicate IDs are invalid HTML and can cause JavaScript and CSS issues.',
      element: document.getElementById(duplicates[0][0]),
      fix: {
        description: 'Ensure all IDs are unique on the page.',
        code: '<!-- Change duplicate IDs to classes -->\n<div id="unique-id-1"></div>\n<div id="unique-id-2"></div>\n\n<!-- Or use classes instead -->\n<div class="shared-style"></div>\n<div class="shared-style"></div>',
      },
    };
  }

  return {
    id: 'duplicate-ids-ok',
    name: 'Duplicate IDs',
    severity: 'minor',
    passed: true,
    message: 'No duplicate IDs found',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function checkEmptyLinks(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const links = document.querySelectorAll('a[href]');
  let emptyLinks = 0;
  let jsLinks = 0;

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const text = link.textContent?.trim() || '';

    if (href === '#' || href === '') {
      emptyLinks++;
    } else if (href.startsWith('javascript:')) {
      jsLinks++;
    }

    if (!text && !link.querySelector('img')) {
      emptyLinks++;
    }
  });

  if (emptyLinks > 0) {
    checks.push({
      id: 'empty-links',
      name: 'Empty or Invalid Links',
      severity: 'moderate',
      passed: false,
      message: `${emptyLinks} link(s) with empty or invalid hrefs`,
      description: 'Links should have meaningful hrefs and content for accessibility and SEO.',
      element: document.querySelector('a[href="#"], a[href=""]') as HTMLElement,
      fix: {
        description: 'Provide meaningful href attributes and link text.',
        code: '<!-- Instead of empty href -->\n<a href="#section-1">Go to Section 1</a>\n\n<!-- Instead of javascript: -->\n<button type="button" onclick="handleClick()">Click</button>',
      },
    });
  }

  if (jsLinks > 0) {
    checks.push({
      id: 'javascript-links',
      name: 'JavaScript Links',
      severity: 'moderate',
      passed: false,
      message: `${jsLinks} link(s) using javascript: protocol`,
      description:
        'Using javascript: in hrefs is an anti-pattern. Use button elements or event listeners instead.',
      element: document.querySelector('a[href^="javascript:"]') as HTMLElement,
      fix: {
        description: 'Replace javascript: links with proper event handlers or buttons.',
        code: '<!-- Instead of javascript: links -->\n<button type="button" onclick="handleAction()">Action</button>\n\n<!-- Or with event listeners -->\n<a href="#" id="action-link">Action</a>\n<script>\n  document.getElementById("action-link").addEventListener("click", (e) => {\n    e.preventDefault();\n    handleAction();\n  });\n</script>',
      },
    });
  }

  return checks;
}

function checkMetaRefresh(): BestPracticeCheck {
  const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');

  if (metaRefresh) {
    return {
      id: 'meta-refresh',
      name: 'Meta Refresh',
      severity: 'moderate',
      passed: false,
      message: 'Page uses meta refresh',
      description:
        'Meta refresh is considered an anti-pattern. Use JavaScript redirects or server-side redirects instead.',
      element: metaRefresh as HTMLElement,
      fix: {
        description: 'Use proper redirects instead of meta refresh.',
        code: '// Use JavaScript redirect\nwindow.location.href = "/new-page";\n\n// Or server-side redirect (HTTP 301/302)',
      },
    };
  }

  return {
    id: 'meta-refresh-ok',
    name: 'Meta Refresh',
    severity: 'minor',
    passed: true,
    message: 'No meta refresh detected',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function checkPassiveEventListeners(): BestPracticeCheck {
  // Check for elements that might benefit from passive listeners
  const scrollElements = document.querySelectorAll('[onscroll], [onwheel], [ontouchmove]');

  if (scrollElements.length > 3) {
    return {
      id: 'passive-listeners',
      name: 'Passive Event Listeners',
      severity: 'moderate',
      passed: false,
      message: `Found ${scrollElements.length} scroll/touch event handlers`,
      description:
        'Consider using passive event listeners for scroll/touch events to improve scroll performance.',
      element: scrollElements[0] as HTMLElement,
      fix: {
        description: 'Use passive event listeners for better scroll performance.',
        code: '// Use passive listeners\ndocument.addEventListener("touchstart", handler, { passive: true });\ndocument.addEventListener("wheel", handler, { passive: true });',
      },
    };
  }

  return {
    id: 'passive-listeners-ok',
    name: 'Passive Event Listeners',
    severity: 'minor',
    passed: true,
    message: 'Event listeners are reasonable',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function checkGeolocationUsage(): BestPracticeCheck {
  // Check if page immediately requests geolocation
  const scripts = document.querySelectorAll('script');
  let hasGeolocationRequest = false;

  scripts.forEach((script) => {
    const content = script.textContent || '';
    if (
      content.includes('navigator.geolocation.getCurrentPosition') &&
      !content.includes('addEventListener')
    ) {
      hasGeolocationRequest = true;
    }
  });

  if (hasGeolocationRequest) {
    return {
      id: 'geolocation-on-load',
      name: 'Geolocation Request',
      severity: 'moderate',
      passed: false,
      message: 'Page requests geolocation on load',
      description:
        'Requesting geolocation immediately on page load is considered intrusive. Request it in response to user interaction.',
      element: null,
      fix: {
        description: 'Request geolocation only after user interaction.',
        code: '// Request geolocation on button click\nbutton.addEventListener("click", () => {\n  navigator.geolocation.getCurrentPosition(success, error);\n});',
      },
    };
  }

  return {
    id: 'geolocation-ok',
    name: 'Geolocation Request',
    severity: 'minor',
    passed: true,
    message: 'No intrusive geolocation requests',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function bestPracticeChecksToIssues(checks: BestPracticeCheck[]): Issue[] {
  const issues: Issue[] = [];

  for (const check of checks) {
    // Only create issues for failed checks
    if (check.passed) continue;

    issues.push({
      id: generateId(),
      ruleId: check.id,
      severity: check.severity,
      category: 'technical' as Category,
      message: check.message,
      description: check.description,
      helpUrl: 'https://web.dev/learn/',
      wcag: {
        id: 'Best Practices',
        level: 'AA',
        name: 'Web Development Best Practices',
        description: 'Modern web development standards and best practices',
      } as WCAGCriteria,
      element: {
        selector: check.element ? getSelector(check.element) : 'html',
        html: check.element ? check.element.outerHTML.substring(0, 200) : '<html>...</html>',
        failureSummary: check.message,
      },
      fix: {
        description: check.fix.description,
        code: check.fix.code,
        learnMoreUrl: getLearnMoreUrl(check.id),
      },
    });
  }

  return issues;
}

function getSelector(element: HTMLElement): string {
  if (element.id) return `#${element.id}`;
  if (element.className)
    return `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`;
  return element.tagName.toLowerCase();
}

function getLearnMoreUrl(checkId: string): string {
  if (checkId.includes('doctype'))
    return 'https://developer.mozilla.org/en-US/docs/Glossary/Doctype';
  if (checkId.includes('charset'))
    return 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset';
  if (checkId.includes('lang'))
    return 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang';
  if (checkId.includes('deprecated'))
    return 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element#obsolete_and_deprecated_elements';
  if (checkId.includes('duplicate-ids')) return 'https://web.dev/duplicate-id/';
  if (checkId.includes('links')) return 'https://web.dev/link-text/';
  if (checkId.includes('passive')) return 'https://web.dev/uses-passive-event-listeners/';

  return 'https://web.dev/learn/';
}

function generateSummary(issues: Issue[]): ScanSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  const byCategory: Record<Category, number> = {
    images: 0,
    interactive: 0,
    forms: 0,
    color: 0,
    document: 0,
    structure: 0,
    aria: 0,
    technical: 0,
  };

  for (const issue of issues) {
    bySeverity[issue.severity]++;
    byCategory[issue.category]++;
  }

  return {
    total: issues.length,
    bySeverity,
    byCategory,
  };
}

export async function scanBestPractices(): Promise<ScanResult> {
  const startTime = performance.now();

  // Run all best practice checks
  const allChecks: BestPracticeCheck[] = [
    checkDoctype(),
    checkCharset(),
    checkLangAttribute(),
    ...checkDeprecatedElements(),
    checkConsoleErrors(),
    ...checkBrokenImages(),
    checkDuplicateIds(),
    ...checkEmptyLinks(),
    checkMetaRefresh(),
    checkPassiveEventListeners(),
    checkGeolocationUsage(),
  ];

  // Convert checks to issues
  const issues = bestPracticeChecksToIssues(allChecks);

  const duration = performance.now() - startTime;

  return {
    url: window.location.href,
    timestamp: Date.now(),
    duration,
    issues,
    incomplete: [],
    summary: generateSummary(issues),
  };
}
