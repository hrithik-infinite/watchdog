import { describe, it, expect } from 'vitest';
import { generateFix } from '../fixes';
import type { ElementInfo } from '../types';

describe('Fixes - Fix suggestion generation', () => {
  const mockElement: ElementInfo = {
    selector: 'img.hero',
    html: '<img class="hero" src="test.jpg">',
  };

  describe('image-alt fix', () => {
    it('should generate fix for missing alt text', () => {
      const fix = generateFix('image-alt', mockElement);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('alt text');
      expect(fix.code).toContain('alt=');
      expect(fix.learnMoreUrl).toContain('webaim');
    });

    it('should include alt placeholder in code', () => {
      const fix = generateFix('image-alt', mockElement);
      expect(fix.code).toContain('[Describe');
    });
  });

  describe('button-name fix', () => {
    it('should generate fix for button without accessible name', () => {
      const element: ElementInfo = {
        selector: 'button.submit',
        html: '<button class="submit"></button>',
      };

      const fix = generateFix('button-name', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('text content');
      expect(fix.learnMoreUrl).toContain('button-name');
    });

    it('should add aria-label if not present', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button></button>',
      };

      const fix = generateFix('button-name', element);

      expect(fix.code).toContain('aria-label');
    });

    it('should not add aria-label if already present', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button aria-label="Submit"></button>',
      };

      const fix = generateFix('button-name', element);

      expect(fix.code).toBe('<button aria-label="Submit"></button>');
    });
  });

  describe('link-name fix', () => {
    it('should generate fix for link without text', () => {
      const element: ElementInfo = {
        selector: 'a.icon-link',
        html: '<a class="icon-link" href="/"></a>',
      };

      const fix = generateFix('link-name', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('text content');
      expect(fix.learnMoreUrl).toContain('link-name');
    });

    it('should add link text placeholder', () => {
      const element: ElementInfo = {
        selector: 'a',
        html: '<a href="/"></a>',
      };

      const fix = generateFix('link-name', element);

      expect(fix.code).toContain('[Link text]');
    });

    it('should not modify if aria-label is present', () => {
      const element: ElementInfo = {
        selector: 'a',
        html: '<a aria-label="Home" href="/"></a>',
      };

      const fix = generateFix('link-name', element);

      expect(fix.code).toBe('<a aria-label="Home" href="/"></a>');
    });
  });

  describe('color-contrast fix', () => {
    it('should generate fix for low contrast', () => {
      const element: ElementInfo = {
        selector: '.low-contrast',
        html: '<div class="low-contrast">Text</div>',
      };

      const fix = generateFix('color-contrast', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('contrast');
      expect(fix.code).toContain('contrast');
      expect(fix.learnMoreUrl).toContain('contrast');
    });

    it('should provide multiple fix suggestions', () => {
      const fix = generateFix('color-contrast', mockElement);

      expect(fix.code).toContain('Darken');
      expect(fix.code).toContain('Lighten');
      expect(fix.code).toContain('Increase font');
    });
  });

  describe('label fix', () => {
    it('should generate fix for input without label', () => {
      const element: ElementInfo = {
        selector: 'input.email',
        html: '<input class="email" type="email">',
      };

      const fix = generateFix('label', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('label');
      expect(fix.code).toContain('<label');
      expect(fix.learnMoreUrl).toContain('forms');
    });

    it('should include proper label structure', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input type="text">',
      };

      const fix = generateFix('label', element);

      expect(fix.code).toContain('for=');
      expect(fix.code).toContain('id=');
    });
  });

  describe('html-has-lang fix', () => {
    it('should generate fix for missing lang attribute', () => {
      const element: ElementInfo = {
        selector: 'html',
        html: '<html>',
      };

      const fix = generateFix('html-has-lang', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('lang');
      expect(fix.code).toContain('<html lang=');
    });

    it('should use en as default language', () => {
      const fix = generateFix('html-has-lang', mockElement);

      expect(fix.code).toContain('lang="en"');
    });
  });

  describe('document-title fix', () => {
    it('should generate fix for missing title', () => {
      const element: ElementInfo = {
        selector: 'head',
        html: '<head></head>',
      };

      const fix = generateFix('document-title', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('title');
      expect(fix.code).toContain('<title>');
    });

    it('should provide meaningful title example', () => {
      const fix = generateFix('document-title', mockElement);

      expect(fix.code).toContain('Page Title');
      expect(fix.code).toContain('Site Name');
    });
  });

  describe('heading-order fix', () => {
    it('should generate fix for incorrect heading order', () => {
      const element: ElementInfo = {
        selector: 'h3',
        html: '<h3>Heading</h3>',
      };

      const fix = generateFix('heading-order', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('heading');
      expect(fix.description).toContain('order');
      expect(fix.code).toContain('h1');
    });

    it('should explain heading hierarchy', () => {
      const fix = generateFix('heading-order', mockElement);

      expect(fix.code).toContain('h1');
      expect(fix.code).toContain('h2');
      expect(fix.code).toContain('h3');
    });
  });

  describe('region fix', () => {
    it('should generate fix for missing landmark regions', () => {
      const element: ElementInfo = {
        selector: 'div.content',
        html: '<div class="content">Content</div>',
      };

      const fix = generateFix('region', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('landmark');
      expect(fix.code).toContain('<main>');
    });

    it('should list valid landmark regions', () => {
      const fix = generateFix('region', mockElement);

      expect(fix.code).toContain('main');
      expect(fix.description).toContain('nav');
    });
  });

  describe('aria-valid-attr fix', () => {
    it('should generate fix for invalid ARIA attributes', () => {
      const element: ElementInfo = {
        selector: '[aria-invalid]',
        html: '<div aria-invalid="true"></div>',
      };

      const fix = generateFix('aria-valid-attr', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('ARIA');
      expect(fix.code).toContain('aria-label');
    });

    it('should provide valid ARIA attribute examples', () => {
      const fix = generateFix('aria-valid-attr', mockElement);

      expect(fix.code).toContain('aria-labelledby');
      expect(fix.code).toContain('aria-describedby');
    });
  });

  describe('aria-required-attr fix', () => {
    it('should generate fix for missing required ARIA attributes', () => {
      const element: ElementInfo = {
        selector: '[role="button"]',
        html: '<div role="button"></div>',
      };

      const fix = generateFix('aria-required-attr', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('required');
      expect(fix.code).toContain('ARIA');
    });

    it('should suggest checking WAI-ARIA spec', () => {
      const fix = generateFix('aria-required-attr', mockElement);

      expect(fix.code).toContain('WAI-ARIA');
    });
  });

  describe('aria-roles fix', () => {
    it('should generate fix for invalid ARIA role', () => {
      const element: ElementInfo = {
        selector: '[role="invalid"]',
        html: '<div role="invalid"></div>',
      };

      const fix = generateFix('aria-roles', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('valid');
      expect(fix.description).toContain('ARIA role');
    });

    it('should provide valid role examples', () => {
      const fix = generateFix('aria-roles', mockElement);

      expect(fix.code).toContain('button');
      expect(fix.code).toContain('link');
      expect(fix.code).toContain('navigation');
    });
  });

  describe('meta-viewport fix', () => {
    it('should generate fix for restrictive viewport meta', () => {
      const element: ElementInfo = {
        selector: 'meta[name="viewport"]',
        html: '<meta name="viewport" content="user-scalable=no">',
      };

      const fix = generateFix('meta-viewport', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('zoom');
      expect(fix.code).toContain('initial-scale=1');
    });

    it('should provide correct viewport meta tag', () => {
      const fix = generateFix('meta-viewport', mockElement);

      expect(fix.code).toContain('width=device-width');
      expect(fix.code).not.toContain('maximum-scale');
    });
  });

  describe('tabindex fix', () => {
    it('should generate fix for positive tabindex', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button tabindex="5">Click</button>',
      };

      const fix = generateFix('tabindex', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('tabindex');
      expect(fix.code).toContain('tabindex="0"');
    });

    it('should replace positive tabindex with 0', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button tabindex="10">Click</button>',
      };

      const fix = generateFix('tabindex', element);

      expect(fix.code).not.toContain('tabindex="10"');
      expect(fix.code).toContain('tabindex="0"');
    });
  });

  describe('duplicate-id fix', () => {
    it('should generate fix for duplicate IDs', () => {
      const element: ElementInfo = {
        selector: '[id="duplicate"]',
        html: '<div id="duplicate">Content</div>',
      };

      const fix = generateFix('duplicate-id', element);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('unique');
      expect(fix.code).toContain('unique-identifier');
    });

    it('should suggest making ID unique', () => {
      const fix = generateFix('duplicate-id', mockElement);

      expect(fix.code).toContain('id=');
    });
  });

  describe('unknown rule', () => {
    it('should generate fallback fix for unknown rules', () => {
      const fix = generateFix('unknown-rule', mockElement);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('documentation');
      expect(fix.learnMoreUrl).toContain('unknown-rule');
    });

    it('should have empty code for fallback', () => {
      const fix = generateFix('unknown-rule', mockElement);

      expect(fix.code).toBe('');
    });
  });

  describe('Fix suggestion structure', () => {
    it('should include all required properties', () => {
      const fix = generateFix('image-alt', mockElement);

      expect(fix).toHaveProperty('description');
      expect(fix).toHaveProperty('code');
      expect(fix).toHaveProperty('learnMoreUrl');
    });

    it('should have non-empty description', () => {
      const rules = ['image-alt', 'button-name', 'link-name', 'color-contrast', 'label'];

      rules.forEach((rule) => {
        const fix = generateFix(rule, mockElement);
        expect(fix.description).toBeTruthy();
        expect(fix.description.length).toBeGreaterThan(0);
      });
    });

    it('should have valid URLs', () => {
      const rules = ['image-alt', 'button-name', 'link-name', 'color-contrast', 'label'];

      rules.forEach((rule) => {
        const fix = generateFix(rule, mockElement);
        expect(fix.learnMoreUrl).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Element-specific fixes', () => {
    it('should use element HTML in fix suggestions', () => {
      const element: ElementInfo = {
        selector: 'img',
        html: '<img src="photo.jpg" class="hero-image">',
      };

      const fix = generateFix('image-alt', element);

      expect(fix.code).toContain('photo.jpg');
      expect(fix.code).toContain('hero-image');
    });

    it('should preserve element attributes in fixes', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button type="submit" class="btn-primary"></button>',
      };

      const fix = generateFix('button-name', element);

      expect(fix.code).toContain('type="submit"');
      expect(fix.code).toContain('btn-primary');
    });
  });

  describe('All 15 MVP rules', () => {
    const mvpRules = [
      'image-alt',
      'button-name',
      'link-name',
      'color-contrast',
      'label',
      'html-has-lang',
      'document-title',
      'heading-order',
      'region',
      'aria-valid-attr',
      'aria-required-attr',
      'aria-roles',
      'meta-viewport',
      'tabindex',
      'duplicate-id',
    ];

    mvpRules.forEach((rule) => {
      it(`should have fix template for ${rule}`, () => {
        const fix = generateFix(rule, mockElement);

        expect(fix).toBeDefined();
        expect(fix.description).toBeTruthy();
        expect(fix.learnMoreUrl).toBeTruthy();
      });
    });
  });

  describe('Navigation & Focus rules', () => {
    it('should generate fix for bypass rule', () => {
      const fix = generateFix('bypass', mockElement);

      expect(fix).toBeDefined();
      expect(fix.description).toContain('skip link');
      expect(fix.code).toContain('skip-link');
    });

    it('should generate fix for scrollable-region-focusable', () => {
      const element: ElementInfo = {
        selector: 'div.scrollable',
        html: '<div class="scrollable">Content</div>',
      };

      const fix = generateFix('scrollable-region-focusable', element);

      expect(fix.description).toContain('scrollable');
      expect(fix.code).toContain('tabindex');
      expect(fix.code).toContain('role="region"');
    });

    it('should generate fix for frame-focusable-content', () => {
      const element: ElementInfo = {
        selector: 'iframe',
        html: '<iframe src="content.html"></iframe>',
      };

      const fix = generateFix('frame-focusable-content', element);

      expect(fix.description).toContain('iframe');
      expect(fix.code).toContain('interactive');
    });

    it('should generate fix for focus-order-semantics', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button tabindex="5">Click</button>',
      };

      const fix = generateFix('focus-order-semantics', element);

      expect(fix.description).toContain('focus order');
      expect(fix.code).toContain('tabindex');
    });
  });

  describe('Media & Multimedia rules', () => {
    it('should generate fix for video-caption', () => {
      const fix = generateFix('video-caption', mockElement);

      expect(fix.description).toContain('captions');
      expect(fix.code).toContain('track');
      expect(fix.code).toContain('captions');
    });

    it('should generate fix for audio-caption', () => {
      const fix = generateFix('audio-caption', mockElement);

      expect(fix.description).toContain('transcript');
      expect(fix.code).toContain('audio');
    });

    it('should generate fix for no-autoplay-audio', () => {
      const element: ElementInfo = {
        selector: 'audio',
        html: '<audio autoplay muted></audio>',
      };

      const fix = generateFix('no-autoplay-audio', element);

      expect(fix.description).toContain('autoplay');
      expect(fix.code).toContain('controls');
    });

    it('should generate fix for object-alt', () => {
      const element: ElementInfo = {
        selector: 'object',
        html: '<object data="file.pdf"></object>',
      };

      const fix = generateFix('object-alt', element);

      expect(fix.description).toContain('alternative');
      expect(fix.code).toContain('Alternative content');
    });

    it('should generate fix for svg-img-alt', () => {
      const element: ElementInfo = {
        selector: 'svg',
        html: '<svg><circle/></svg>',
      };

      const fix = generateFix('svg-img-alt', element);

      expect(fix.description).toContain('SVG');
      expect(fix.code).toContain('role="img"');
    });

    it('should not add role="img" to SVG with aria-label', () => {
      const element: ElementInfo = {
        selector: 'svg',
        html: '<svg aria-label="Icon"></svg>',
      };

      const fix = generateFix('svg-img-alt', element);

      expect(fix.code).toBe('<svg aria-label="Icon"></svg>');
    });
  });

  describe('Tables rules', () => {
    it('should generate fix for td-headers-attr', () => {
      const fix = generateFix('td-headers-attr', mockElement);

      expect(fix.description).toContain('headers');
      expect(fix.code).toContain('headers=');
    });

    it('should generate fix for th-has-data-cells', () => {
      const fix = generateFix('th-has-data-cells', mockElement);

      expect(fix.description).toContain('table');
      expect(fix.code).toContain('th');
    });

    it('should generate fix for scope-attr-valid', () => {
      const element: ElementInfo = {
        selector: 'th',
        html: '<th scope="invalid">Header</th>',
      };

      const fix = generateFix('scope-attr-valid', element);

      expect(fix.description).toContain('valid scope');
      expect(fix.code).toContain('scope="col"');
    });

    it('should generate fix for table-fake-caption', () => {
      const fix = generateFix('table-fake-caption', mockElement);

      expect(fix.description).toContain('caption');
      expect(fix.code).toContain('<caption>');
    });
  });

  describe('Structure & Semantics rules', () => {
    it('should generate fix for definition-list', () => {
      const element: ElementInfo = {
        selector: 'dl',
        html: '<dl><dt>Term</dt><dd>Definition</dd></dl>',
      };

      const fix = generateFix('definition-list', element);

      expect(fix.description).toContain('definition');
      expect(fix.code).toContain('dl');
    });

    it('should generate fix for list', () => {
      const element: ElementInfo = {
        selector: 'ul',
        html: '<ul><li>Item</li></ul>',
      };

      const fix = generateFix('list', element);

      expect(fix.description).toContain('list');
      expect(fix.code).toContain('li');
    });

    it('should generate fix for listitem', () => {
      const element: ElementInfo = {
        selector: 'li',
        html: '<li>Item</li>',
      };

      const fix = generateFix('listitem', element);

      expect(fix.description).toContain('list items');
      expect(fix.code).toContain('ul');
    });

    it('should generate fix for nested-interactive', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<a href="#"><button>Click</button></a>',
      };

      const fix = generateFix('nested-interactive', element);

      expect(fix.description).toContain('nested');
      expect(fix.code).toContain("Don't nest");
    });
  });

  describe('Forms rules', () => {
    it('should generate fix for input-image-alt', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input type="image" src="button.png">',
      };

      const fix = generateFix('input-image-alt', element);

      expect(fix.description).toContain('alt');
      expect(fix.code).toContain('alt=');
    });

    it('should generate fix for select-name', () => {
      const element: ElementInfo = {
        selector: 'select',
        html: '<select><option>Option</option></select>',
      };

      const fix = generateFix('select-name', mockElement);

      expect(fix.description).toContain('select');
      expect(fix.code).toContain('<label');
    });

    it('should generate fix for autocomplete-valid', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input autocomplete="invalid-value">',
      };

      const fix = generateFix('autocomplete-valid', element);

      expect(fix.description).toContain('autocomplete');
      expect(fix.code).toContain('autocomplete=');
    });
  });

  describe('Frames rules', () => {
    it('should generate fix for frame-title', () => {
      const element: ElementInfo = {
        selector: 'iframe',
        html: '<iframe src="content.html"></iframe>',
      };

      const fix = generateFix('frame-title', element);

      expect(fix.description).toContain('title');
      expect(fix.code).toContain('title=');
    });
  });

  describe('Language rules', () => {
    it('should generate fix for valid-lang', () => {
      const element: ElementInfo = {
        selector: 'html',
        html: '<html lang="invalid-lang">',
      };

      const fix = generateFix('valid-lang', element);

      expect(fix.description).toContain('language');
      expect(fix.code).toContain('language codes');
    });
  });

  describe('Deprecated elements rules', () => {
    it('should generate fix for marquee', () => {
      const element: ElementInfo = {
        selector: 'marquee',
        html: '<marquee>Scrolling text</marquee>',
      };

      const fix = generateFix('marquee', element);

      expect(fix.description).toContain('marquee');
      expect(fix.code).toContain('animation');
      expect(fix.code).toContain('CSS');
    });

    it('should generate fix for blink', () => {
      const element: ElementInfo = {
        selector: 'blink',
        html: '<blink>Blinking text</blink>',
      };

      const fix = generateFix('blink', element);

      expect(fix.description).toContain('blink');
      expect(fix.code).toContain('seizures');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle elements with no HTML attribute', () => {
      const element: ElementInfo = {
        selector: 'img',
        html: '<img>',
      };

      const fix = generateFix('image-alt', element);

      expect(fix).toBeDefined();
      expect(fix.code).toContain('alt=');
    });

    it('should handle empty HTML string', () => {
      const element: ElementInfo = {
        selector: '',
        html: '',
      };

      const fix = generateFix('image-alt', element);

      expect(fix).toBeDefined();
      expect(fix.code).toBeDefined();
    });

    it('should handle button with multiple attributes', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button type="submit" class="btn-primary" id="submit-btn" data-action="submit"></button>',
      };

      const fix = generateFix('button-name', element);

      expect(fix.code).toContain('aria-label');
      expect(fix.code).toContain('type="submit"');
    });

    it('should handle tabindex replacement with single quotes', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: "<button tabindex='5'>Click</button>",
      };

      const fix = generateFix('tabindex', element);

      expect(fix.code).toContain('tabindex="0"');
    });

    it('should handle tabindex replacement with high numbers', () => {
      const element: ElementInfo = {
        selector: 'button',
        html: '<button tabindex="999">Click</button>',
      };

      const fix = generateFix('tabindex', element);

      expect(fix.code).toContain('tabindex="0"');
      expect(fix.code).not.toContain('999');
    });

    it('should handle autocomplete with special characters', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input autocomplete="not-valid-here">',
      };

      const fix = generateFix('autocomplete-valid', element);

      expect(fix.code).toContain('autocomplete="email"');
    });

    it('should handle no-autoplay-audio with both attributes', () => {
      const element: ElementInfo = {
        selector: 'audio',
        html: '<audio autoplay muted controls></audio>',
      };

      const fix = generateFix('no-autoplay-audio', element);

      expect(fix.code).toContain('controls');
    });

    it('should preserve other attributes when modifying scrollable region', () => {
      const element: ElementInfo = {
        selector: 'div',
        html: '<div id="scroll-container" class="custom">Content</div>',
      };

      const fix = generateFix('scrollable-region-focusable', element);

      expect(fix.code).toContain('id="scroll-container"');
      expect(fix.code).toContain('class="custom"');
    });
  });

  describe('Image alt attribute variations', () => {
    it('should add alt to img tag without any attributes', () => {
      const element: ElementInfo = {
        selector: 'img',
        html: '<img>',
      };

      const fix = generateFix('image-alt', element);

      expect(fix.code).toContain('<img alt=');
    });

    it('should add alt to img tag with src', () => {
      const element: ElementInfo = {
        selector: 'img',
        html: '<img src="test.jpg">',
      };

      const fix = generateFix('image-alt', element);

      expect(fix.code).toContain('alt=');
      expect(fix.code).toContain('src="test.jpg"');
    });

    it('should add alt to img tag with src and class', () => {
      const element: ElementInfo = {
        selector: 'img',
        html: '<img src="test.jpg" class="thumbnail">',
      };

      const fix = generateFix('image-alt', element);

      expect(fix.code).toContain('alt=');
      expect(fix.code).toContain('class="thumbnail"');
    });
  });

  describe('Label fixes with various inputs', () => {
    it('should add label to text input', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input type="text">',
      };

      const fix = generateFix('label', element);

      expect(fix.code).toContain('<label');
      expect(fix.code).toContain('for=');
      expect(fix.code).toContain('input-id');
    });

    it('should add label to email input', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input type="email" placeholder="your@email.com">',
      };

      const fix = generateFix('label', element);

      expect(fix.code).toContain('id="input-id"');
      expect(fix.code).toContain('<label');
    });

    it('should add label to search input', () => {
      const element: ElementInfo = {
        selector: 'input',
        html: '<input type="search">',
      };

      const fix = generateFix('label', element);

      expect(fix.code).toContain('id=');
      expect(fix.code).toContain('for=');
    });
  });

  describe('Link modifications', () => {
    it('should add text to empty link', () => {
      const element: ElementInfo = {
        selector: 'a',
        html: '<a href="/page"></a>',
      };

      const fix = generateFix('link-name', element);

      expect(fix.code).toContain('[Link text]');
      expect(fix.code).toContain('href="/page"');
    });

    it('should not modify link with text content', () => {
      const element: ElementInfo = {
        selector: 'a',
        html: '<a href="/page">Click here</a>',
      };

      const fix = generateFix('link-name', element);

      expect(fix.code).toContain('Click here');
    });

    it('should not modify link with aria-label and no text', () => {
      const element: ElementInfo = {
        selector: 'a',
        html: '<a href="/page" aria-label="Navigation link"></a>',
      };

      const fix = generateFix('link-name', element);

      expect(fix.code).toBe('<a href="/page" aria-label="Navigation link"></a>');
    });
  });

  describe('Region fixes', () => {
    it('should wrap content in main region', () => {
      const element: ElementInfo = {
        selector: 'div',
        html: '<div class="content">Page content</div>',
      };

      const fix = generateFix('region', element);

      expect(fix.code).toContain('<main>');
      expect(fix.code).toContain('</main>');
      expect(fix.code).toContain('class="content"');
    });

    it('should provide landmark examples in description', () => {
      const fix = generateFix('region', mockElement);

      expect(fix.description).toContain('landmark');
      expect(fix.description).toContain('nav');
    });
  });

  describe('generateFix function integration', () => {
    it('should handle all known rules without errors', () => {
      const knownRules = [
        'image-alt',
        'button-name',
        'link-name',
        'color-contrast',
        'label',
        'html-has-lang',
        'document-title',
        'heading-order',
        'region',
        'aria-valid-attr',
        'aria-required-attr',
        'aria-roles',
        'meta-viewport',
        'tabindex',
        'duplicate-id',
        'bypass',
        'scrollable-region-focusable',
        'frame-focusable-content',
        'focus-order-semantics',
        'video-caption',
        'audio-caption',
        'no-autoplay-audio',
        'object-alt',
        'svg-img-alt',
        'td-headers-attr',
        'th-has-data-cells',
        'scope-attr-valid',
        'table-fake-caption',
        'definition-list',
        'list',
        'listitem',
        'nested-interactive',
        'input-image-alt',
        'select-name',
        'autocomplete-valid',
        'frame-title',
        'valid-lang',
        'marquee',
        'blink',
      ];

      knownRules.forEach((rule) => {
        const fix = generateFix(rule, mockElement);
        expect(fix).toBeDefined();
        expect(fix.description).toBeTruthy();
        expect(fix.code).toBeDefined();
        expect(fix.learnMoreUrl).toMatch(/^https?:\/\//);
      });
    });

    it('should have consistent URL format across all rules', () => {
      const rules = [
        'image-alt',
        'button-name',
        'link-name',
        'color-contrast',
        'label',
        'html-has-lang',
        'document-title',
        'heading-order',
        'region',
      ];

      rules.forEach((rule) => {
        const fix = generateFix(rule, mockElement);
        expect(fix.learnMoreUrl).toMatch(/^https?:\/\/.*dequeuniversity|webaim|web\.dev/);
      });
    });
  });
});
