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
  return `pwa-issue-${Date.now()}-${++idCounter}`;
}

interface PWACheck {
  id: string;
  name: string;
  severity: Severity;
  passed: boolean;
  message: string;
  description: string;
  fix: {
    description: string;
    code: string;
  };
}

interface ManifestData {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  theme_color?: string;
  background_color?: string;
  icons?: Array<{
    src: string;
    sizes?: string;
    type?: string;
  }>;
  description?: string;
  orientation?: string;
}

async function fetchManifest(): Promise<ManifestData | null> {
  const manifestLink = document.querySelector('link[rel="manifest"]');

  if (!manifestLink) {
    return null;
  }

  const manifestUrl = manifestLink.getAttribute('href');
  if (!manifestUrl) {
    return null;
  }

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch manifest:', error);
    return null;
  }
}

function checkManifestLink(): PWACheck {
  const manifestLink = document.querySelector('link[rel="manifest"]');

  if (!manifestLink) {
    return {
      id: 'manifest-missing',
      name: 'Web App Manifest',
      severity: 'critical',
      passed: false,
      message: 'Page is missing a web app manifest',
      description:
        'A web app manifest is required for PWAs to be installable and provide app-like experiences.',
      fix: {
        description: 'Add a manifest.json file and link to it from your HTML.',
        code: '<!-- In HTML <head> -->\n<link rel="manifest" href="/manifest.json">\n\n<!-- manifest.json -->\n{\n  "name": "My PWA",\n  "short_name": "PWA",\n  "start_url": "/",\n  "display": "standalone",\n  "theme_color": "#000000",\n  "background_color": "#ffffff",\n  "icons": [\n    {\n      "src": "/icon-192.png",\n      "sizes": "192x192",\n      "type": "image/png"\n    },\n    {\n      "src": "/icon-512.png",\n      "sizes": "512x512",\n      "type": "image/png"\n    }\n  ]\n}',
      },
    };
  }

  return {
    id: 'manifest-ok',
    name: 'Web App Manifest',
    severity: 'minor',
    passed: true,
    message: 'Web app manifest is linked',
    description: '',
    fix: { description: '', code: '' },
  };
}

function checkManifestContent(manifest: ManifestData | null): PWACheck[] {
  const checks: PWACheck[] = [];

  if (!manifest) {
    return checks;
  }

  // Check for name
  if (!manifest.name || manifest.name.length === 0) {
    checks.push({
      id: 'manifest-name-missing',
      name: 'Manifest Name',
      severity: 'serious',
      passed: false,
      message: 'Manifest is missing "name" property',
      description: 'The name property is required for users to identify your app.',
      fix: {
        description: 'Add a name property to your manifest.',
        code: '{\n  "name": "My Progressive Web App",\n  ...\n}',
      },
    });
  }

  // Check for short_name
  if (!manifest.short_name) {
    checks.push({
      id: 'manifest-short-name-missing',
      name: 'Manifest Short Name',
      severity: 'moderate',
      passed: false,
      message: 'Manifest is missing "short_name" property',
      description: 'The short_name is used when space is limited (e.g., home screen).',
      fix: {
        description: 'Add a short_name property to your manifest.',
        code: '{\n  "short_name": "My PWA",\n  ...\n}',
      },
    });
  }

  // Check for start_url
  if (!manifest.start_url) {
    checks.push({
      id: 'manifest-start-url-missing',
      name: 'Manifest Start URL',
      severity: 'serious',
      passed: false,
      message: 'Manifest is missing "start_url" property',
      description: 'The start_url defines where your app should start when launched.',
      fix: {
        description: 'Add a start_url property to your manifest.',
        code: '{\n  "start_url": "/",\n  ...\n}',
      },
    });
  }

  // Check for display mode
  if (!manifest.display) {
    checks.push({
      id: 'manifest-display-missing',
      name: 'Manifest Display Mode',
      severity: 'moderate',
      passed: false,
      message: 'Manifest is missing "display" property',
      description:
        'The display mode controls how your app appears (standalone, fullscreen, minimal-ui, browser).',
      fix: {
        description: 'Add a display property to your manifest.',
        code: '{\n  "display": "standalone",\n  ...\n}',
      },
    });
  }

  // Check for theme_color
  if (!manifest.theme_color) {
    checks.push({
      id: 'manifest-theme-color-missing',
      name: 'Manifest Theme Color',
      severity: 'moderate',
      passed: false,
      message: 'Manifest is missing "theme_color" property',
      description: 'The theme_color sets the color of the toolbar and UI elements.',
      fix: {
        description: 'Add a theme_color property to your manifest.',
        code: '{\n  "theme_color": "#000000",\n  ...\n}',
      },
    });
  }

  // Check for background_color
  if (!manifest.background_color) {
    checks.push({
      id: 'manifest-background-color-missing',
      name: 'Manifest Background Color',
      severity: 'moderate',
      passed: false,
      message: 'Manifest is missing "background_color" property',
      description: 'The background_color is shown while your app loads.',
      fix: {
        description: 'Add a background_color property to your manifest.',
        code: '{\n  "background_color": "#ffffff",\n  ...\n}',
      },
    });
  }

  // Check for icons
  if (!manifest.icons || manifest.icons.length === 0) {
    checks.push({
      id: 'manifest-icons-missing',
      name: 'Manifest Icons',
      severity: 'critical',
      passed: false,
      message: 'Manifest has no icons',
      description:
        'Icons are required for your app to be installable. Provide at least 192x192 and 512x512 icons.',
      fix: {
        description: 'Add icons to your manifest with multiple sizes.',
        code: '{\n  "icons": [\n    {\n      "src": "/icon-192.png",\n      "sizes": "192x192",\n      "type": "image/png"\n    },\n    {\n      "src": "/icon-512.png",\n      "sizes": "512x512",\n      "type": "image/png"\n    }\n  ],\n  ...\n}',
      },
    });
  } else {
    // Check for required icon sizes
    const iconSizes = manifest.icons.map((icon) => icon.sizes).filter(Boolean);
    const has192 = iconSizes.some((size) => size?.includes('192'));
    const has512 = iconSizes.some((size) => size?.includes('512'));

    if (!has192 || !has512) {
      checks.push({
        id: 'manifest-icons-sizes',
        name: 'Manifest Icon Sizes',
        severity: 'serious',
        passed: false,
        message: 'Manifest is missing required icon sizes (192x192 and 512x512)',
        description: 'For optimal installability, provide icons in both 192x192 and 512x512 sizes.',
        fix: {
          description: 'Add icons in the required sizes.',
          code: '{\n  "icons": [\n    {\n      "src": "/icon-192.png",\n      "sizes": "192x192",\n      "type": "image/png"\n    },\n    {\n      "src": "/icon-512.png",\n      "sizes": "512x512",\n      "type": "image/png"\n    }\n  ]\n}',
        },
      });
    }
  }

  return checks;
}

async function checkServiceWorker(): Promise<PWACheck> {
  if (!('serviceWorker' in navigator)) {
    return {
      id: 'service-worker-not-supported',
      name: 'Service Worker Support',
      severity: 'serious',
      passed: false,
      message: 'Service workers are not supported in this browser',
      description: 'Service workers require HTTPS and a modern browser.',
      fix: {
        description: 'Ensure your site is served over HTTPS.',
        code: '// Service workers require HTTPS (except on localhost)',
      },
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return {
        id: 'service-worker-not-registered',
        name: 'Service Worker',
        severity: 'critical',
        passed: false,
        message: 'No service worker is registered',
        description: 'Service workers enable offline functionality and are required for PWAs.',
        fix: {
          description: 'Register a service worker in your application.',
          code: '// Register service worker\nif ("serviceWorker" in navigator) {\n  navigator.serviceWorker.register("/sw.js")\n    .then((reg) => console.log("SW registered", reg))\n    .catch((err) => console.log("SW registration failed", err));\n}',
        },
      };
    }

    return {
      id: 'service-worker-ok',
      name: 'Service Worker',
      severity: 'minor',
      passed: true,
      message: 'Service worker is registered',
      description: '',
      fix: { description: '', code: '' },
    };
  } catch {
    return {
      id: 'service-worker-check-failed',
      name: 'Service Worker',
      severity: 'moderate',
      passed: false,
      message: 'Unable to check service worker registration',
      description: 'Could not determine if a service worker is registered.',
      fix: {
        description: 'Ensure service worker registration code is present.',
        code: '// Register service worker\nnavigator.serviceWorker.register("/sw.js");',
      },
    };
  }
}

function checkHTTPS(): PWACheck {
  const isHTTPS = window.location.protocol === 'https:';
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isHTTPS && !isLocalhost) {
    return {
      id: 'pwa-https-required',
      name: 'HTTPS Required',
      severity: 'critical',
      passed: false,
      message: 'PWAs require HTTPS (except on localhost)',
      description: 'Service workers and many PWA features require a secure context (HTTPS).',
      fix: {
        description: 'Enable HTTPS on your web server.',
        code: '# Redirect all HTTP to HTTPS\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      },
    };
  }

  return {
    id: 'pwa-https-ok',
    name: 'HTTPS',
    severity: 'minor',
    passed: true,
    message: 'Site is served over HTTPS',
    description: '',
    fix: { description: '', code: '' },
  };
}

function checkViewportMeta(): PWACheck {
  const viewport = document.querySelector('meta[name="viewport"]');

  if (!viewport) {
    return {
      id: 'pwa-viewport-missing',
      name: 'Viewport Meta Tag',
      severity: 'serious',
      passed: false,
      message: 'Page is missing viewport meta tag',
      description: 'The viewport meta tag is essential for responsive design and mobile PWAs.',
      fix: {
        description: 'Add a viewport meta tag.',
        code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      },
    };
  }

  return {
    id: 'pwa-viewport-ok',
    name: 'Viewport Meta Tag',
    severity: 'minor',
    passed: true,
    message: 'Viewport meta tag is present',
    description: '',
    fix: { description: '', code: '' },
  };
}

function checkAppleTouchIcon(): PWACheck {
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');

  if (!appleTouchIcon) {
    return {
      id: 'apple-touch-icon-missing',
      name: 'Apple Touch Icon',
      severity: 'moderate',
      passed: false,
      message: 'Missing apple-touch-icon for iOS',
      description:
        'Apple touch icons improve the experience when users add your PWA to their iOS home screen.',
      fix: {
        description: 'Add an apple-touch-icon link tag.',
        code: '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      },
    };
  }

  return {
    id: 'apple-touch-icon-ok',
    name: 'Apple Touch Icon',
    severity: 'minor',
    passed: true,
    message: 'Apple touch icon is present',
    description: '',
    fix: { description: '', code: '' },
  };
}

function checkThemeColor(): PWACheck {
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (!themeColor) {
    return {
      id: 'theme-color-meta-missing',
      name: 'Theme Color Meta Tag',
      severity: 'moderate',
      passed: false,
      message: 'Missing theme-color meta tag',
      description: 'The theme-color meta tag colors the browser UI to match your app.',
      fix: {
        description: 'Add a theme-color meta tag.',
        code: '<meta name="theme-color" content="#000000">',
      },
    };
  }

  return {
    id: 'theme-color-meta-ok',
    name: 'Theme Color Meta Tag',
    severity: 'minor',
    passed: true,
    message: 'Theme color meta tag is present',
    description: '',
    fix: { description: '', code: '' },
  };
}

function pwaChecksToIssues(checks: PWACheck[]): Issue[] {
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
      helpUrl: 'https://web.dev/progressive-web-apps/',
      wcag: {
        id: 'PWA',
        level: 'AA',
        name: 'Progressive Web App',
        description: 'PWA requirements for installability and offline support',
      } as WCAGCriteria,
      element: {
        selector: 'head',
        html: '<head>...</head>',
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

function getLearnMoreUrl(checkId: string): string {
  if (checkId.includes('manifest')) return 'https://web.dev/add-manifest/';
  if (checkId.includes('service-worker')) return 'https://web.dev/service-workers-cache-storage/';
  if (checkId.includes('https')) return 'https://web.dev/why-https-matters/';
  if (checkId.includes('viewport')) return 'https://web.dev/viewport/';
  if (checkId.includes('apple-touch-icon'))
    return 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html';
  if (checkId.includes('theme-color')) return 'https://web.dev/add-manifest/#theme-color';

  return 'https://web.dev/progressive-web-apps/';
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

export async function scanPWA(): Promise<ScanResult> {
  const startTime = performance.now();

  // Check for manifest link first
  const manifestLinkCheck = checkManifestLink();

  // Fetch and validate manifest
  let manifest: ManifestData | null = null;
  if (manifestLinkCheck.passed) {
    manifest = await fetchManifest();
  }

  // Run all PWA checks
  const allChecks: PWACheck[] = [
    manifestLinkCheck,
    ...checkManifestContent(manifest),
    await checkServiceWorker(),
    checkHTTPS(),
    checkViewportMeta(),
    checkAppleTouchIcon(),
    checkThemeColor(),
  ];

  // Convert checks to issues
  const issues = pwaChecksToIssues(allChecks);

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
