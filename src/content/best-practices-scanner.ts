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

// ============================================
// Phase 2: Vulnerable Libraries Detection
// ============================================

interface LibraryInfo {
  name: string;
  version: string;
  detected: boolean;
}

interface VulnerabilityInfo {
  library: string;
  minVersion: string;
  maxVersion: string;
  severity: Severity;
  cve: string;
  description: string;
  fixedIn: string;
}

// Known vulnerabilities database (simplified)
const KNOWN_VULNERABILITIES: VulnerabilityInfo[] = [
  // jQuery vulnerabilities
  {
    library: 'jquery',
    minVersion: '0.0.0',
    maxVersion: '3.4.99',
    severity: 'moderate',
    cve: 'CVE-2020-11022',
    description: 'XSS vulnerability in jQuery.htmlPrefilter',
    fixedIn: '3.5.0',
  },
  {
    library: 'jquery',
    minVersion: '0.0.0',
    maxVersion: '3.4.99',
    severity: 'moderate',
    cve: 'CVE-2020-11023',
    description: 'XSS vulnerability when passing HTML from untrusted sources',
    fixedIn: '3.5.0',
  },
  {
    library: 'jquery',
    minVersion: '0.0.0',
    maxVersion: '1.11.99',
    severity: 'serious',
    cve: 'CVE-2015-9251',
    description: 'XSS vulnerability in cross-domain ajax requests',
    fixedIn: '1.12.0',
  },
  // Lodash vulnerabilities
  {
    library: 'lodash',
    minVersion: '0.0.0',
    maxVersion: '4.17.20',
    severity: 'serious',
    cve: 'CVE-2021-23337',
    description: 'Command injection via template function',
    fixedIn: '4.17.21',
  },
  {
    library: 'lodash',
    minVersion: '0.0.0',
    maxVersion: '4.17.15',
    severity: 'serious',
    cve: 'CVE-2020-8203',
    description: 'Prototype pollution in zipObjectDeep',
    fixedIn: '4.17.16',
  },
  // Moment.js
  {
    library: 'moment',
    minVersion: '0.0.0',
    maxVersion: '2.29.3',
    severity: 'moderate',
    cve: 'CVE-2022-24785',
    description: 'Path traversal vulnerability',
    fixedIn: '2.29.4',
  },
  // Angular 1.x
  {
    library: 'angular',
    minVersion: '1.0.0',
    maxVersion: '1.8.2',
    severity: 'serious',
    cve: 'Multiple',
    description: 'AngularJS 1.x is end-of-life and has multiple unpatched vulnerabilities',
    fixedIn: 'Migrate to Angular 2+',
  },
  // Bootstrap
  {
    library: 'bootstrap',
    minVersion: '0.0.0',
    maxVersion: '4.3.0',
    severity: 'moderate',
    cve: 'CVE-2019-8331',
    description: 'XSS vulnerability in tooltip/popover data-template',
    fixedIn: '4.3.1',
  },
];

function detectLibraries(): LibraryInfo[] {
  const libraries: LibraryInfo[] = [];
  const win = window as unknown as Record<string, unknown>;

  // jQuery
  const jQuery = win.jQuery as { fn?: { jquery?: string } } | undefined;
  if (jQuery?.fn?.jquery) {
    libraries.push({ name: 'jquery', version: jQuery.fn.jquery, detected: true });
  }

  // Lodash
  const lodash = win._ as { VERSION?: string } | undefined;
  if (lodash?.VERSION) {
    libraries.push({ name: 'lodash', version: lodash.VERSION, detected: true });
  }

  // React
  const React = win.React as { version?: string } | undefined;
  if (React?.version) {
    libraries.push({ name: 'react', version: React.version, detected: true });
  }

  // Angular 1.x
  const angular = win.angular as { version?: { full?: string } } | undefined;
  if (angular?.version?.full) {
    libraries.push({ name: 'angular', version: angular.version.full, detected: true });
  }

  // Vue
  const Vue = win.Vue as { version?: string } | undefined;
  if (Vue?.version) {
    libraries.push({ name: 'vue', version: Vue.version, detected: true });
  }

  // Moment.js
  const moment = win.moment as { version?: string } | undefined;
  if (moment?.version) {
    libraries.push({ name: 'moment', version: moment.version, detected: true });
  }

  // Bootstrap
  const bootstrap = win.bootstrap as { VERSION?: string } | undefined;
  if (bootstrap?.VERSION) {
    libraries.push({ name: 'bootstrap', version: bootstrap.VERSION, detected: true });
  }

  // Backbone
  const Backbone = win.Backbone as { VERSION?: string } | undefined;
  if (Backbone?.VERSION) {
    libraries.push({ name: 'backbone', version: Backbone.VERSION, detected: true });
  }

  // Ember
  const Ember = win.Ember as { VERSION?: string } | undefined;
  if (Ember?.VERSION) {
    libraries.push({ name: 'ember', version: Ember.VERSION, detected: true });
  }

  // Underscore
  const underscore = win._ as { VERSION?: string } | undefined;
  if (underscore?.VERSION && !lodash?.VERSION) {
    libraries.push({ name: 'underscore', version: underscore.VERSION, detected: true });
  }

  return libraries;
}

function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map((p) => parseInt(p, 10) || 0);
  const v2Parts = version2.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;
    if (v1 > v2) return 1;
    if (v1 < v2) return -1;
  }
  return 0;
}

function checkVulnerableLibraries(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const libraries = detectLibraries();

  for (const lib of libraries) {
    const vulns = KNOWN_VULNERABILITIES.filter(
      (v) =>
        v.library === lib.name &&
        compareVersions(lib.version, v.minVersion) >= 0 &&
        compareVersions(lib.version, v.maxVersion) <= 0
    );

    for (const vuln of vulns) {
      checks.push({
        id: `vuln-${lib.name}-${vuln.cve}`,
        name: 'Vulnerable Library',
        severity: vuln.severity,
        passed: false,
        message: `${lib.name} ${lib.version} has known vulnerability (${vuln.cve})`,
        description: `${vuln.description}. Fixed in version ${vuln.fixedIn}.`,
        element: null,
        fix: {
          description: `Update ${lib.name} to version ${vuln.fixedIn} or later.`,
          code: `npm update ${lib.name}\n# or\nyarn upgrade ${lib.name}`,
        },
      });
    }
  }

  return checks;
}

// ============================================
// Phase 2: Additional Best Practices
// ============================================

function checkPasswordPastePrevention(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const passwordFields = document.querySelectorAll('input[type="password"]');

  let preventsPaste = 0;
  let firstElement: HTMLElement | null = null;

  passwordFields.forEach((input) => {
    const onpaste = input.getAttribute('onpaste');
    if (onpaste && (onpaste.includes('return false') || onpaste.includes('preventDefault'))) {
      preventsPaste++;
      if (!firstElement) firstElement = input as HTMLElement;
    }

    // Also check for paste event listeners (heuristic)
    const autocomplete = input.getAttribute('autocomplete');
    if (autocomplete === 'off' || autocomplete === 'new-password') {
      // This might indicate paste prevention intent
    }
  });

  if (preventsPaste > 0) {
    checks.push({
      id: 'password-paste-prevention',
      name: 'Password Paste Prevention',
      severity: 'moderate',
      passed: false,
      message: `${preventsPaste} password field(s) prevent paste`,
      description:
        'Preventing paste in password fields breaks password managers and reduces security.',
      element: firstElement,
      fix: {
        description:
          'Remove paste prevention from password fields to allow password manager usage.',
        code: '<!-- Don\'t do this -->\n<input type="password" onpaste="return false">\n\n<!-- Do this instead -->\n<input type="password" autocomplete="current-password">',
      },
    });
  }

  return checks;
}

function checkNotificationOnLoad(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const scripts = document.querySelectorAll('script');
  let requestsNotification = false;

  scripts.forEach((script) => {
    const content = script.textContent || '';
    // Check for notification permission request that's not in an event handler
    if (
      content.includes('Notification.requestPermission') &&
      !content.includes('addEventListener') &&
      !content.includes('onclick') &&
      !content.includes('click')
    ) {
      requestsNotification = true;
    }
  });

  if (requestsNotification) {
    checks.push({
      id: 'notification-on-load',
      name: 'Notification Permission on Load',
      severity: 'moderate',
      passed: false,
      message: 'Page requests notification permission on load',
      description:
        'Requesting notification permission immediately is intrusive and often denied by users.',
      element: null,
      fix: {
        description: 'Request notification permission only after user interaction.',
        code: '// Request notification permission after user clicks\nbutton.addEventListener("click", async () => {\n  const permission = await Notification.requestPermission();\n  if (permission === "granted") {\n    // Show notifications\n  }\n});',
      },
    });
  }

  return checks;
}

function checkUnsizedImages(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const images = document.querySelectorAll('img');
  let unsizedCount = 0;
  let firstUnsized: HTMLImageElement | null = null;

  images.forEach((img) => {
    const hasWidth = img.hasAttribute('width') || img.style.width;
    const hasHeight = img.hasAttribute('height') || img.style.height;

    // Check if image is visible and significant size
    if (img.offsetWidth > 50 && img.offsetHeight > 50) {
      if (!hasWidth || !hasHeight) {
        unsizedCount++;
        if (!firstUnsized) firstUnsized = img;
      }
    }
  });

  if (unsizedCount > 3) {
    checks.push({
      id: 'unsized-images',
      name: 'Images Without Dimensions',
      severity: 'moderate',
      passed: false,
      message: `${unsizedCount} image(s) missing explicit width/height`,
      description: 'Images without dimensions cause layout shifts (CLS) when they load.',
      element: firstUnsized,
      fix: {
        description: 'Add width and height attributes to images to reserve space.',
        code: '<!-- Add explicit dimensions -->\n<img src="image.jpg" width="800" height="600" alt="Description">\n\n<!-- Or use CSS aspect-ratio -->\n<img src="image.jpg" style="aspect-ratio: 4/3; width: 100%;" alt="Description">',
      },
    });
  }

  return checks;
}

function checkImageAspectRatio(): BestPracticeCheck[] {
  const checks: BestPracticeCheck[] = [];
  const images = document.querySelectorAll('img');
  let incorrectAspectRatio = 0;
  let firstIncorrect: HTMLImageElement | null = null;

  images.forEach((img) => {
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const declaredWidth = parseInt(img.getAttribute('width') || '0', 10);
      const declaredHeight = parseInt(img.getAttribute('height') || '0', 10);

      if (declaredWidth > 0 && declaredHeight > 0) {
        const naturalRatio = img.naturalWidth / img.naturalHeight;
        const declaredRatio = declaredWidth / declaredHeight;

        // Check if aspect ratio is significantly different (>10% difference)
        if (Math.abs(naturalRatio - declaredRatio) / naturalRatio > 0.1) {
          incorrectAspectRatio++;
          if (!firstIncorrect) firstIncorrect = img;
        }
      }
    }
  });

  if (incorrectAspectRatio > 2) {
    checks.push({
      id: 'image-aspect-ratio',
      name: 'Incorrect Image Aspect Ratio',
      severity: 'minor',
      passed: false,
      message: `${incorrectAspectRatio} image(s) have incorrect aspect ratio in attributes`,
      description:
        'Declared width/height does not match actual image aspect ratio, causing distortion.',
      element: firstIncorrect,
      fix: {
        description: 'Set width and height attributes to match the actual image aspect ratio.',
        code: '<!-- Ensure attributes match actual image dimensions -->\n<img src="image.jpg" width="800" height="600" alt="...">\n\n<!-- Use object-fit if you need different display size -->\n<img src="image.jpg" width="800" height="600" style="object-fit: cover; width: 400px; height: 400px;">',
      },
    });
  }

  return checks;
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
    // Original checks
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

    // Phase 2: New checks
    ...checkVulnerableLibraries(), // Vulnerable JS libraries
    ...checkPasswordPastePrevention(), // Password paste prevention
    ...checkNotificationOnLoad(), // Notification permission on load
    ...checkUnsizedImages(), // Images without dimensions
    ...checkImageAspectRatio(), // Incorrect image aspect ratios
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
