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
});
