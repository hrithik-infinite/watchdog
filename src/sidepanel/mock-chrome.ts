// Mock Chrome APIs for standalone UI testing
// This file is only used when running outside the extension context

import type { ScanResult, Issue } from '@/shared/types';

const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    ruleId: 'color-contrast',
    severity: 'serious',
    category: 'color',
    message: 'Elements must meet minimum color contrast ratio thresholds',
    description:
      'Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
    wcag: {
      id: '1.4.3',
      level: 'AA',
      name: 'Contrast (Minimum)',
      description: 'WCAG 1.4.3 - Contrast (Minimum)',
    },
    element: {
      selector: 'p.text-gray-500',
      html: '<p class="text-gray-500 hover:text-gray-600">Learn more</p>',
      failureSummary: 'Fix any of the following: Element has insufficient color contrast of 3.5:1',
    },
    fix: {
      description: 'Increase contrast ratio to at least 4.5:1 for normal text.',
      code: '/* Darken text color or lighten background */\ncolor: #595959; /* darker gray */',
      learnMoreUrl: 'https://webaim.org/resources/contrastchecker/',
    },
  },
  {
    id: 'issue-2',
    ruleId: 'image-alt',
    severity: 'critical',
    category: 'images',
    message: 'Image elements must have an alt attribute',
    description: 'Ensures <img> elements have alternate text or a role of none or presentation.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
    wcag: {
      id: '1.1.1',
      level: 'A',
      name: 'Non-text Content',
      description: 'WCAG 1.1.1 - Non-text Content',
    },
    element: {
      selector: 'img.hero-image',
      html: '<img src="hero.jpg" class="hero-image">',
      failureSummary: 'Fix any of the following: Element does not have an alt attribute',
    },
    fix: {
      description: 'Add descriptive alt text that conveys the image content.',
      code: '<img src="hero.jpg" class="hero-image" alt="Description of image">',
      learnMoreUrl: 'https://webaim.org/techniques/alttext/',
    },
  },
  {
    id: 'issue-3',
    ruleId: 'button-name',
    severity: 'serious',
    category: 'interactive',
    message: 'Buttons must have discernible text',
    description: 'Ensures buttons have discernible text.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
    wcag: {
      id: '4.1.2',
      level: 'A',
      name: 'Name, Role, Value',
      description: 'WCAG 4.1.2 - Name, Role, Value',
    },
    element: {
      selector: 'button.icon-btn',
      html: '<button class="icon-btn"><svg>...</svg></button>',
      failureSummary: 'Fix any of the following: Element does not have inner text',
    },
    fix: {
      description: 'Add text content or aria-label to the button.',
      code: '<button class="icon-btn" aria-label="Close menu"><svg>...</svg></button>',
      learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
    },
  },
  {
    id: 'issue-4',
    ruleId: 'label',
    severity: 'moderate',
    category: 'forms',
    message: 'Form elements must have labels',
    description: 'Ensures every form element has a label.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
    wcag: {
      id: '1.3.1',
      level: 'A',
      name: 'Info and Relationships',
      description: 'WCAG 1.3.1 - Info and Relationships',
    },
    element: {
      selector: 'input#email',
      html: '<input type="email" id="email" placeholder="Enter email">',
      failureSummary: 'Fix any of the following: Form element does not have an associated label',
    },
    fix: {
      description: 'Associate a label with the input using for/id or wrapping.',
      code: '<label for="email">Email address</label>\n<input type="email" id="email" placeholder="Enter email">',
      learnMoreUrl: 'https://webaim.org/techniques/forms/controls',
    },
  },
  {
    id: 'issue-5',
    ruleId: 'heading-order',
    severity: 'minor',
    category: 'structure',
    message: 'Heading levels should only increase by one',
    description: 'Ensures the order of headings is semantically correct.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
    wcag: {
      id: '1.3.1',
      level: 'A',
      name: 'Info and Relationships',
      description: 'WCAG 1.3.1 - Info and Relationships',
    },
    element: {
      selector: 'h4.section-title',
      html: '<h4 class="section-title">Features</h4>',
      failureSummary: 'Fix any of the following: Heading order invalid',
    },
    fix: {
      description: 'Ensure headings follow a logical order without skipping levels.',
      code: '/* Change h4 to h2 or h3 based on document structure */',
      learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
    },
  },
];

const mockScanResult: ScanResult = {
  url: 'https://example.com',
  timestamp: Date.now(),
  duration: 245,
  issues: mockIssues,
  incomplete: [],
  summary: {
    total: mockIssues.length,
    bySeverity: {
      critical: mockIssues.filter((i) => i.severity === 'critical').length,
      serious: mockIssues.filter((i) => i.severity === 'serious').length,
      moderate: mockIssues.filter((i) => i.severity === 'moderate').length,
      minor: mockIssues.filter((i) => i.severity === 'minor').length,
    },
    byCategory: {
      images: mockIssues.filter((i) => i.category === 'images').length,
      interactive: mockIssues.filter((i) => i.category === 'interactive').length,
      forms: mockIssues.filter((i) => i.category === 'forms').length,
      color: mockIssues.filter((i) => i.category === 'color').length,
      document: mockIssues.filter((i) => i.category === 'document').length,
      structure: mockIssues.filter((i) => i.category === 'structure').length,
      aria: mockIssues.filter((i) => i.category === 'aria').length,
      technical: mockIssues.filter((i) => i.category === 'technical').length,
    },
  },
};

// Check if we're running in a Chrome extension context
const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

if (!isExtensionContext) {
  console.log('Running in standalone mode with mock data');

  // Create mock chrome object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).chrome = {
    runtime: {
      id: 'mock-extension-id',
      sendMessage: () => Promise.resolve({ success: true }),
      onMessage: {
        addListener: () => {},
      },
    },
    tabs: {
      query: () => Promise.resolve([{ id: 1, url: 'https://example.com' }]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendMessage: (_tabId: number, message: any) => {
        return new Promise((resolve) => {
          // Simulate scan delay
          if (message.type === 'SCAN_PAGE') {
            setTimeout(() => {
              resolve({ success: true, result: mockScanResult });
            }, 1500);
          } else if (message.type === 'PING') {
            resolve({ success: true, loaded: true });
          } else {
            resolve({ success: true });
          }
        });
      },
    },
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
      },
    },
    scripting: {
      executeScript: () => Promise.resolve(),
    },
  };
}

export {};
