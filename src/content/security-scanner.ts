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
  return `security-issue-${Date.now()}-${++idCounter}`;
}

interface SecurityCheck {
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

// Security headers to check
const SECURITY_HEADERS = [
  {
    name: 'Content-Security-Policy',
    severity: 'serious' as Severity,
    description: 'CSP helps prevent XSS attacks by controlling which resources can be loaded.',
    fix: "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  },
  {
    name: 'Strict-Transport-Security',
    severity: 'serious' as Severity,
    description: 'HSTS ensures browsers only connect to your site over HTTPS.',
    fix: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
  },
  {
    name: 'X-Frame-Options',
    severity: 'serious' as Severity,
    description:
      'Prevents clickjacking attacks by controlling if your site can be embedded in frames.',
    fix: 'X-Frame-Options: DENY',
  },
  {
    name: 'X-Content-Type-Options',
    severity: 'moderate' as Severity,
    description: 'Prevents MIME type sniffing attacks.',
    fix: 'X-Content-Type-Options: nosniff',
  },
  {
    name: 'Referrer-Policy',
    severity: 'moderate' as Severity,
    description: 'Controls how much referrer information is shared with other sites.',
    fix: 'Referrer-Policy: strict-origin-when-cross-origin',
  },
  {
    name: 'Permissions-Policy',
    severity: 'moderate' as Severity,
    description: 'Controls which browser features and APIs can be used.',
    fix: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  },
];

// CSP and Referrer-Policy can be delivered via <meta http-equiv> in addition to
// HTTP response headers, and browsers honor those. The other security headers
// (HSTS, X-Frame-Options, X-Content-Type-Options) are ignored when set via meta,
// so they remain header-only.
const META_DELIVERABLE = new Set(['Content-Security-Policy', 'Referrer-Policy']);

function hasMetaHttpEquiv(name: string): boolean {
  const metas = document.querySelectorAll('meta[http-equiv]');
  for (const meta of metas) {
    if (
      meta.getAttribute('http-equiv')?.toLowerCase() === name.toLowerCase() &&
      (meta.getAttribute('content') || '').trim() !== ''
    ) {
      return true;
    }
  }
  return false;
}

async function checkSecurityHeaders(): Promise<SecurityCheck[]> {
  const checks: SecurityCheck[] = [];

  try {
    // Fetch the current page to check response headers
    const response = await fetch(window.location.href, { method: 'HEAD' });

    for (const header of SECURITY_HEADERS) {
      const headerValue = response.headers.get(header.name);

      if (!headerValue) {
        // A meta-deliverable policy present via <meta http-equiv> is honored by
        // the browser, so its absence from the response headers is not a finding.
        if (META_DELIVERABLE.has(header.name) && hasMetaHttpEquiv(header.name)) {
          continue;
        }

        checks.push({
          id: `header-${header.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: header.name,
          severity: header.severity,
          passed: false,
          message: `Missing ${header.name} header`,
          description: header.description,
          fix: {
            description: `Add the ${header.name} header to your server configuration.`,
            code: header.fix,
          },
        });
      }
    }
  } catch {
    // If fetch fails (e.g., CORS), we can't check headers
    checks.push({
      id: 'headers-check-failed',
      name: 'Security Headers Check',
      severity: 'minor',
      passed: false,
      message: 'Unable to check security headers',
      description: 'Could not fetch response headers due to CORS restrictions.',
      fix: {
        description: 'Security headers should be configured on your server.',
        code: '# Configure security headers in your web server config',
      },
    });
  }

  return checks;
}

function checkHTTPS(): SecurityCheck {
  const isHTTPS = window.location.protocol === 'https:';

  if (!isHTTPS) {
    return {
      id: 'https-not-enabled',
      name: 'HTTPS',
      severity: 'critical',
      passed: false,
      message: 'Page is not served over HTTPS',
      description:
        'HTTPS encrypts data between the browser and server, protecting against eavesdropping and tampering.',
      fix: {
        description: 'Enable HTTPS on your web server and redirect all HTTP traffic to HTTPS.',
        code: '# Apache .htaccess\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      },
    };
  }

  return {
    id: 'https-ok',
    name: 'HTTPS',
    severity: 'minor',
    passed: true,
    message: 'HTTPS is enabled',
    description: '',
    fix: { description: '', code: '' },
  };
}

function checkMixedContent(): SecurityCheck {
  const insecureElements: string[] = [];

  // Check for insecure resources
  const scripts = document.querySelectorAll('script[src^="http://"]');
  const stylesheets = document.querySelectorAll('link[href^="http://"]');
  const images = document.querySelectorAll('img[src^="http://"]');
  const iframes = document.querySelectorAll('iframe[src^="http://"]');

  if (scripts.length > 0) insecureElements.push(`${scripts.length} script(s)`);
  if (stylesheets.length > 0) insecureElements.push(`${stylesheets.length} stylesheet(s)`);
  if (images.length > 0) insecureElements.push(`${images.length} image(s)`);
  if (iframes.length > 0) insecureElements.push(`${iframes.length} iframe(s)`);

  if (insecureElements.length > 0) {
    return {
      id: 'mixed-content',
      name: 'Mixed Content',
      severity: 'serious',
      passed: false,
      message: `Found ${insecureElements.join(', ')} loaded over HTTP`,
      description:
        'Mixed content (HTTP resources on HTTPS pages) weakens HTTPS security and may be blocked by browsers.',
      fix: {
        description: 'Update all resource URLs to use HTTPS or protocol-relative URLs.',
        code: '<!-- Change from -->\n<script src="http://example.com/script.js"></script>\n<!-- To -->\n<script src="https://example.com/script.js"></script>',
      },
    };
  }

  return {
    id: 'mixed-content-ok',
    name: 'Mixed Content',
    severity: 'minor',
    passed: true,
    message: 'No mixed content detected',
    description: '',
    fix: { description: '', code: '' },
  };
}

// Cookie names that typically carry session/auth material and should normally be
// HttpOnly. HttpOnly cookies are invisible to document.cookie, so this check can
// only flag a *readable* cookie whose name looks sensitive — it cannot, and must
// not claim to, audit cookies that are already correctly protected. The previous
// version flagged any non-empty document.cookie, firing on nearly every site
// (analytics, theme, consent cookies are legitimately readable).
const SENSITIVE_COOKIE_NAME =
  /(^|[._-])(sess(ion)?(id)?|sid|auth|token|jwt|phpsessid|jsessionid|aspnet[._-]?sessionid|connect\.sid)([._-]|$)/i;

function checkCookies(): SecurityCheck[] {
  const checks: SecurityCheck[] = [];

  if (!document.cookie) {
    return checks;
  }

  const readableNames = document.cookie
    .split(';')
    .map((c) => c.split('=')[0]?.trim())
    .filter((name): name is string => !!name);

  const sensitive = readableNames.filter((name) => SENSITIVE_COOKIE_NAME.test(name));

  if (sensitive.length > 0) {
    checks.push({
      id: 'cookies-accessible',
      name: 'Cookie Security',
      severity: 'moderate',
      passed: false,
      message: `Session/auth cookie readable by JavaScript: ${sensitive.join(', ')}`,
      description:
        'A cookie whose name indicates session or authentication data is readable by JavaScript, meaning it lacks the HttpOnly flag and could be stolen via XSS. (Cookies that already set HttpOnly are not visible to this check.)',
      fix: {
        description: 'Set the HttpOnly and Secure flags on session/auth cookies from the server.',
        code: 'Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict',
      },
    });
  }

  return checks;
}

function checkForms(): SecurityCheck[] {
  const checks: SecurityCheck[] = [];
  const forms = document.querySelectorAll('form');

  let insecureForms = 0;
  let formsWithoutCSRF = 0;

  forms.forEach((form) => {
    const action = form.getAttribute('action') || '';
    const method = form.getAttribute('method')?.toLowerCase() || 'get';

    // Check for forms submitting over HTTP
    if (action.startsWith('http://')) {
      insecureForms++;
    }

    // Check for POST forms without CSRF protection
    if (method === 'post') {
      const hasCSRFToken =
        form.querySelector('input[name*="csrf"]') ||
        form.querySelector('input[name*="token"]') ||
        form.querySelector('input[name="_token"]');

      if (!hasCSRFToken) {
        formsWithoutCSRF++;
      }
    }
  });

  if (insecureForms > 0) {
    checks.push({
      id: 'forms-insecure',
      name: 'Insecure Form Submission',
      severity: 'critical',
      passed: false,
      message: `${insecureForms} form(s) submit over HTTP`,
      description: 'Forms should always submit data over HTTPS to protect sensitive information.',
      fix: {
        description: 'Update form action URLs to use HTTPS.',
        code: '<form action="https://example.com/submit" method="post">\n  <!-- form fields -->\n</form>',
      },
    });
  }

  if (formsWithoutCSRF > 0) {
    checks.push({
      id: 'forms-no-csrf',
      name: 'CSRF Protection',
      severity: 'serious',
      passed: false,
      message: `${formsWithoutCSRF} POST form(s) missing CSRF tokens`,
      description:
        'POST forms should include CSRF tokens to prevent Cross-Site Request Forgery attacks.',
      fix: {
        description: 'Add CSRF token to forms from your backend framework.',
        code: '<form method="post">\n  <input type="hidden" name="csrf_token" value="TOKEN_FROM_SERVER">\n  <!-- form fields -->\n</form>',
      },
    });
  }

  return checks;
}

function checkPasswordFields(): SecurityCheck[] {
  const checks: SecurityCheck[] = [];
  const passwordFields = document.querySelectorAll('input[type="password"]');

  if (passwordFields.length > 0 && window.location.protocol === 'http:') {
    checks.push({
      id: 'password-over-http',
      name: 'Password Field Security',
      severity: 'critical',
      passed: false,
      message: 'Password fields on non-HTTPS page',
      description:
        'Password fields should never be used on HTTP pages as credentials can be intercepted.',
      fix: {
        description: 'Enable HTTPS for all pages with password fields.',
        code: '# Redirect all HTTP to HTTPS\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      },
    });
  }

  // Check for autocomplete on password fields
  passwordFields.forEach((field) => {
    const autocomplete = field.getAttribute('autocomplete');
    if (autocomplete === 'off' && field.getAttribute('name')?.includes('new')) {
      checks.push({
        id: 'password-autocomplete-off',
        name: 'Password Autocomplete',
        severity: 'moderate',
        passed: false,
        message: 'Password field has autocomplete="off"',
        description:
          'Disabling autocomplete on password fields reduces security by preventing password managers from working.',
        fix: {
          description: 'Allow autocomplete for better password manager support.',
          code: '<input type="password" name="new-password" autocomplete="new-password">',
        },
      });
    }
  });

  return checks;
}

function checkInlineScripts(): SecurityCheck {
  const inlineScripts = document.querySelectorAll('script:not([src])');
  const eventHandlers = document.querySelectorAll('[onclick], [onload], [onerror]');

  const totalInline = inlineScripts.length + eventHandlers.length;

  if (totalInline > 5) {
    return {
      id: 'inline-scripts-excessive',
      name: 'Inline Scripts',
      severity: 'moderate',
      passed: false,
      message: `Found ${totalInline} inline scripts/event handlers`,
      description:
        'Excessive inline scripts make it harder to implement a strict Content Security Policy.',
      fix: {
        description:
          'Move inline scripts to external files and use event listeners instead of inline handlers.',
        code: '// Instead of onclick="handleClick()"\ndocument.getElementById("button").addEventListener("click", handleClick);',
      },
    };
  }

  return {
    id: 'inline-scripts-ok',
    name: 'Inline Scripts',
    severity: 'minor',
    passed: true,
    message: 'Inline script usage is minimal',
    description: '',
    fix: { description: '', code: '' },
  };
}

function checkExternalLinks(): SecurityCheck {
  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  let unsafeLinks = 0;

  externalLinks.forEach((link) => {
    const rel = link.getAttribute('rel') || '';
    // A target="_blank" link is safe from reverse tabnabbing if it has either
    // noopener or noreferrer (noreferrer implies noopener in modern browsers).
    // The old `||` flagged links that already had one of them; only flag links
    // that are missing BOTH.
    if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
      unsafeLinks++;
    }
  });

  if (unsafeLinks > 0) {
    return {
      id: 'external-links-unsafe',
      name: 'External Link Security',
      severity: 'moderate',
      passed: false,
      message: `${unsafeLinks} external link(s) missing rel="noopener noreferrer"`,
      description:
        'Links with target="_blank" should include rel="noopener noreferrer" to prevent reverse tabnabbing attacks.',
      fix: {
        description: 'Add rel="noopener noreferrer" to all target="_blank" links.',
        code: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>',
      },
    };
  }

  return {
    id: 'external-links-ok',
    name: 'External Link Security',
    severity: 'minor',
    passed: true,
    message: 'External links are secure',
    description: '',
    fix: { description: '', code: '' },
  };
}

function securityChecksToIssues(checks: SecurityCheck[]): Issue[] {
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
      helpUrl: 'https://owasp.org/www-project-web-security-testing-guide/',
      wcag: {
        id: 'Security',
        level: 'AA',
        name: 'Web Security',
        description: 'Security best practices to protect users and data',
      } as WCAGCriteria,
      element: {
        selector: 'body',
        html: '<body>...</body>',
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
  if (checkId.includes('https'))
    return 'https://developers.google.com/web/fundamentals/security/encrypt-in-transit/why-https';
  if (checkId.includes('header')) return 'https://owasp.org/www-project-secure-headers/';
  if (checkId.includes('mixed-content'))
    return 'https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content';
  if (checkId.includes('cookie'))
    return 'https://owasp.org/www-community/controls/SecureCookieAttribute';
  if (checkId.includes('csrf')) return 'https://owasp.org/www-community/attacks/csrf';
  if (checkId.includes('password'))
    return 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/02-Testing_for_Weak_SSL_TLS_Ciphers_Insufficient_Transport_Layer_Protection';
  if (checkId.includes('inline-scripts'))
    return 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP';
  if (checkId.includes('external-links'))
    return 'https://owasp.org/www-community/attacks/Reverse_Tabnabbing';

  return 'https://owasp.org/www-project-top-ten/';
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

export async function scanSecurity(): Promise<ScanResult> {
  const startTime = performance.now();

  // Run all security checks
  const allChecks: SecurityCheck[] = [
    ...(await checkSecurityHeaders()),
    checkHTTPS(),
    checkMixedContent(),
    ...checkCookies(),
    ...checkForms(),
    ...checkPasswordFields(),
    checkInlineScripts(),
    checkExternalLinks(),
  ];

  // Convert checks to issues
  const issues = securityChecksToIssues(allChecks);

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
