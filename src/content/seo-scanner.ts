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
  return `seo-issue-${Date.now()}-${++idCounter}`;
}

interface SEOCheck {
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

function checkTitle(): SEOCheck {
  const title = document.querySelector('title');
  const titleText = title?.textContent?.trim() || '';
  const titleLength = titleText.length;

  if (!title || !titleText) {
    return {
      id: 'title-missing',
      name: 'Page Title',
      severity: 'critical',
      passed: false,
      message: 'Page is missing a title tag',
      description:
        'Every page should have a unique, descriptive title tag for SEO and accessibility.',
      element: null,
      fix: {
        description: 'Add a descriptive title tag within the <head> section.',
        code: '<title>Your Page Title Here (50-60 characters)</title>',
      },
    };
  }

  if (titleLength < 30 || titleLength > 60) {
    return {
      id: 'title-length',
      name: 'Page Title Length',
      severity: 'moderate',
      passed: false,
      message: `Title length is ${titleLength} characters (recommended: 50-60)`,
      description:
        'Page titles should be between 50-60 characters for optimal display in search results.',
      element: title,
      fix: {
        description: 'Adjust your title to be between 50-60 characters for better SEO.',
        code: `<title>${titleText.substring(0, 60)}...</title>`,
      },
    };
  }

  return {
    id: 'title-ok',
    name: 'Page Title',
    severity: 'minor',
    passed: true,
    message: 'Page title is present and optimal',
    description: '',
    element: title,
    fix: { description: '', code: '' },
  };
}

function checkMetaDescription(): SEOCheck {
  const meta = document.querySelector('meta[name="description"]');
  const content = meta?.getAttribute('content')?.trim() || '';
  const contentLength = content.length;

  if (!meta || !content) {
    return {
      id: 'meta-description-missing',
      name: 'Meta Description',
      severity: 'serious',
      passed: false,
      message: 'Page is missing a meta description',
      description:
        'Meta descriptions help search engines understand your page content and improve click-through rates.',
      element: null,
      fix: {
        description: 'Add a meta description tag within the <head> section.',
        code: '<meta name="description" content="A compelling description of your page content (150-160 characters)">',
      },
    };
  }

  if (contentLength < 120 || contentLength > 160) {
    return {
      id: 'meta-description-length',
      name: 'Meta Description Length',
      severity: 'moderate',
      passed: false,
      message: `Meta description is ${contentLength} characters (recommended: 150-160)`,
      description:
        'Meta descriptions should be between 150-160 characters for optimal display in search results.',
      element: meta as HTMLElement,
      fix: {
        description: 'Adjust your meta description to be between 150-160 characters.',
        code: `<meta name="description" content="${content.substring(0, 160)}...">`,
      },
    };
  }

  return {
    id: 'meta-description-ok',
    name: 'Meta Description',
    severity: 'minor',
    passed: true,
    message: 'Meta description is present and optimal',
    description: '',
    element: meta as HTMLElement,
    fix: { description: '', code: '' },
  };
}

function checkHeadings(): SEOCheck[] {
  const checks: SEOCheck[] = [];
  const h1Elements = document.querySelectorAll('h1');

  // Check for H1 presence
  if (h1Elements.length === 0) {
    checks.push({
      id: 'h1-missing',
      name: 'H1 Heading',
      severity: 'serious',
      passed: false,
      message: 'Page is missing an H1 heading',
      description: 'Every page should have exactly one H1 heading that describes the main content.',
      element: null,
      fix: {
        description: 'Add a single H1 heading that describes your page content.',
        code: '<h1>Your Main Page Heading</h1>',
      },
    });
  } else if (h1Elements.length > 1) {
    checks.push({
      id: 'h1-multiple',
      name: 'Multiple H1 Headings',
      severity: 'moderate',
      passed: false,
      message: `Page has ${h1Elements.length} H1 headings (should have exactly 1)`,
      description:
        'Multiple H1 headings can confuse search engines about the main topic of the page.',
      element: h1Elements[0] as HTMLElement,
      fix: {
        description: 'Keep only one H1 heading and convert others to H2 or lower.',
        code: '<h1>Main Heading</h1>\n<h2>Subheading 1</h2>\n<h2>Subheading 2</h2>',
      },
    });
  }

  return checks;
}

function checkOpenGraph(): SEOCheck[] {
  const checks: SEOCheck[] = [];

  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (!ogTitle) {
    checks.push({
      id: 'og-title-missing',
      name: 'Open Graph Title',
      severity: 'moderate',
      passed: false,
      message: 'Missing Open Graph title',
      description: 'Open Graph tags improve how your page appears when shared on social media.',
      element: null,
      fix: {
        description: 'Add Open Graph meta tags for better social media sharing.',
        code: '<meta property="og:title" content="Your Page Title">\n<meta property="og:description" content="Your page description">\n<meta property="og:image" content="https://example.com/image.jpg">\n<meta property="og:url" content="https://example.com/page">',
      },
    });
  }

  if (!ogImage) {
    checks.push({
      id: 'og-image-missing',
      name: 'Open Graph Image',
      severity: 'moderate',
      passed: false,
      message: 'Missing Open Graph image',
      description:
        'An og:image tag ensures your page displays a preview image when shared on social media.',
      element: null,
      fix: {
        description: 'Add an Open Graph image tag.',
        code: '<meta property="og:image" content="https://example.com/image.jpg">',
      },
    });
  }

  return checks;
}

function checkCanonical(): SEOCheck {
  const canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    return {
      id: 'canonical-missing',
      name: 'Canonical URL',
      severity: 'moderate',
      passed: false,
      message: 'Page is missing a canonical URL',
      description:
        'Canonical URLs help prevent duplicate content issues by specifying the preferred version of a page.',
      element: null,
      fix: {
        description: 'Add a canonical link tag to specify the preferred URL for this page.',
        code: `<link rel="canonical" href="${window.location.href}">`,
      },
    };
  }

  return {
    id: 'canonical-ok',
    name: 'Canonical URL',
    severity: 'minor',
    passed: true,
    message: 'Canonical URL is present',
    description: '',
    element: canonical as HTMLElement,
    fix: { description: '', code: '' },
  };
}

function checkViewport(): SEOCheck {
  const viewport = document.querySelector('meta[name="viewport"]');

  if (!viewport) {
    return {
      id: 'viewport-missing',
      name: 'Viewport Meta Tag',
      severity: 'serious',
      passed: false,
      message: 'Page is missing a viewport meta tag',
      description: 'The viewport meta tag is essential for mobile-friendliness and mobile SEO.',
      element: null,
      fix: {
        description: 'Add a viewport meta tag for mobile optimization.',
        code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      },
    };
  }

  return {
    id: 'viewport-ok',
    name: 'Viewport Meta Tag',
    severity: 'minor',
    passed: true,
    message: 'Viewport meta tag is present',
    description: '',
    element: viewport as HTMLElement,
    fix: { description: '', code: '' },
  };
}

function checkHTTPS(): SEOCheck {
  const isHTTPS = window.location.protocol === 'https:';

  if (!isHTTPS) {
    return {
      id: 'https-missing',
      name: 'HTTPS Protocol',
      severity: 'critical',
      passed: false,
      message: 'Page is not served over HTTPS',
      description:
        'HTTPS is a ranking factor and essential for security. Google prioritizes HTTPS pages in search results.',
      element: null,
      fix: {
        description: 'Enable HTTPS on your server and redirect all HTTP traffic to HTTPS.',
        code: '# .htaccess redirect\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      },
    };
  }

  return {
    id: 'https-ok',
    name: 'HTTPS Protocol',
    severity: 'minor',
    passed: true,
    message: 'Page is served over HTTPS',
    description: '',
    element: null,
    fix: { description: '', code: '' },
  };
}

function checkImages(): SEOCheck[] {
  const checks: SEOCheck[] = [];
  const images = document.querySelectorAll('img');
  let imagesWithoutAlt = 0;

  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      imagesWithoutAlt++;
    }
  });

  if (imagesWithoutAlt > 0) {
    checks.push({
      id: 'images-missing-alt',
      name: 'Image Alt Text',
      severity: 'serious',
      passed: false,
      message: `${imagesWithoutAlt} image(s) missing alt text`,
      description:
        'Alt text is crucial for both accessibility and SEO. Search engines use alt text to understand image content.',
      element: document.querySelector('img:not([alt])') as HTMLElement,
      fix: {
        description: 'Add descriptive alt text to all images.',
        code: '<img src="image.jpg" alt="Descriptive text about the image">',
      },
    });
  }

  return checks;
}

function checkStructuredData(): SEOCheck {
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');

  if (jsonLdScripts.length === 0) {
    return {
      id: 'structured-data-missing',
      name: 'Structured Data',
      severity: 'moderate',
      passed: false,
      message: 'Page has no structured data (Schema.org)',
      description:
        'Structured data helps search engines understand your content and can enable rich results.',
      element: null,
      fix: {
        description: 'Add Schema.org structured data using JSON-LD format.',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Your Page Name",
  "description": "Your page description"
}
</script>`,
      },
    };
  }

  return {
    id: 'structured-data-ok',
    name: 'Structured Data',
    severity: 'minor',
    passed: true,
    message: 'Structured data is present',
    description: '',
    element: jsonLdScripts[0] as HTMLElement,
    fix: { description: '', code: '' },
  };
}

function seoChecksToIssues(checks: SEOCheck[]): Issue[] {
  const issues: Issue[] = [];

  for (const check of checks) {
    // Only create issues for failed checks
    if (check.passed) continue;

    issues.push({
      id: generateId(),
      ruleId: check.id,
      severity: check.severity,
      category: 'document' as Category,
      message: check.message,
      description: check.description,
      helpUrl: 'https://developers.google.com/search/docs',
      wcag: {
        id: 'SEO',
        level: 'AA',
        name: 'Search Engine Optimization',
        description: 'SEO best practices for better search visibility',
      } as WCAGCriteria,
      element: {
        selector: check.element ? getSelector(check.element) : 'head',
        html: check.element ? check.element.outerHTML.substring(0, 200) : '<head>...</head>',
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
  if (checkId.includes('title'))
    return 'https://developers.google.com/search/docs/appearance/title-link';
  if (checkId.includes('meta-description'))
    return 'https://developers.google.com/search/docs/appearance/snippet';
  if (checkId.includes('h1'))
    return 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data';
  if (checkId.includes('og-')) return 'https://ogp.me/';
  if (checkId.includes('canonical'))
    return 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls';
  if (checkId.includes('viewport'))
    return 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing';
  if (checkId.includes('https'))
    return 'https://developers.google.com/search/docs/crawling-indexing/https';
  if (checkId.includes('images'))
    return 'https://developers.google.com/search/docs/appearance/google-images';
  if (checkId.includes('structured-data'))
    return 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data';

  return 'https://developers.google.com/search/docs';
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

export async function scanSEO(): Promise<ScanResult> {
  const startTime = performance.now();

  // Run all SEO checks
  const allChecks: SEOCheck[] = [
    checkTitle(),
    checkMetaDescription(),
    ...checkHeadings(),
    ...checkOpenGraph(),
    checkCanonical(),
    checkViewport(),
    checkHTTPS(),
    ...checkImages(),
    checkStructuredData(),
  ];

  // Convert checks to issues
  const issues = seoChecksToIssues(allChecks);

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
