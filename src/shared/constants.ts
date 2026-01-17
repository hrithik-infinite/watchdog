import type { Category, Severity } from './types';

// Expanded accessibility rules from axe-core (35 rules total)
export const MVP_RULES = [
  // Original 15 rules
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

  // Navigation & Focus (4 new)
  'bypass',
  'scrollable-region-focusable',
  'frame-focusable-content',
  'focus-order-semantics',

  // Media & Multimedia (5 new)
  'video-caption',
  'audio-caption',
  'no-autoplay-audio',
  'object-alt',
  'svg-img-alt',

  // Tables (4 new)
  'td-headers-attr',
  'th-has-data-cells',
  'scope-attr-valid',
  'table-fake-caption',

  // Structure & Semantics (4 new)
  'definition-list',
  'list',
  'listitem',
  'nested-interactive',

  // Forms (3 new)
  'input-image-alt',
  'select-name',
  'autocomplete-valid',

  // Frames (1 new)
  'frame-title',

  // Language (1 new)
  'valid-lang',

  // Deprecated elements (2 new)
  'marquee',
  'blink',
] as const;

export type RuleId = (typeof MVP_RULES)[number];

// Map rule IDs to categories
export const RULE_CATEGORIES: Record<RuleId, Category> = {
  // Original rules
  'image-alt': 'images',
  'button-name': 'interactive',
  'link-name': 'interactive',
  'color-contrast': 'color',
  label: 'forms',
  'html-has-lang': 'document',
  'document-title': 'document',
  'heading-order': 'structure',
  region: 'structure',
  'aria-valid-attr': 'aria',
  'aria-required-attr': 'aria',
  'aria-roles': 'aria',
  'meta-viewport': 'document',
  tabindex: 'technical',
  'duplicate-id': 'technical',

  // Navigation & Focus
  bypass: 'interactive',
  'scrollable-region-focusable': 'interactive',
  'frame-focusable-content': 'interactive',
  'focus-order-semantics': 'interactive',

  // Media & Multimedia
  'video-caption': 'images',
  'audio-caption': 'images',
  'no-autoplay-audio': 'images',
  'object-alt': 'images',
  'svg-img-alt': 'images',

  // Tables
  'td-headers-attr': 'structure',
  'th-has-data-cells': 'structure',
  'scope-attr-valid': 'structure',
  'table-fake-caption': 'structure',

  // Structure & Semantics
  'definition-list': 'structure',
  list: 'structure',
  listitem: 'structure',
  'nested-interactive': 'interactive',

  // Forms
  'input-image-alt': 'forms',
  'select-name': 'forms',
  'autocomplete-valid': 'forms',

  // Frames
  'frame-title': 'document',

  // Language
  'valid-lang': 'document',

  // Deprecated elements
  marquee: 'technical',
  blink: 'technical',
};

// Map axe-core impact to our severity
export const SEVERITY_MAP: Record<string, Severity> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
};

// Severity display configuration
export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  critical: {
    label: 'Critical',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    icon: '🔴',
  },
  serious: {
    label: 'Serious',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    icon: '🟠',
  },
  moderate: {
    label: 'Moderate',
    color: '#CA8A04',
    bgColor: 'rgba(202, 138, 4, 0.1)',
    icon: '🟡',
  },
  minor: {
    label: 'Minor',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    icon: '🔵',
  },
};

// Category display configuration
export const CATEGORY_CONFIG: Record<Category, { label: string; icon: string }> = {
  images: { label: 'Images', icon: '🖼️' },
  interactive: { label: 'Interactive', icon: '👆' },
  forms: { label: 'Forms', icon: '📝' },
  color: { label: 'Color', icon: '🎨' },
  document: { label: 'Document', icon: '📄' },
  structure: { label: 'Structure', icon: '🏗️' },
  aria: { label: 'ARIA', icon: '♿' },
  technical: { label: 'Technical', icon: '⚙️' },
};

// WCAG criteria data for all rules
export const WCAG_CRITERIA: Record<RuleId, { id: string; level: 'A' | 'AA'; name: string }> = {
  // Original rules
  'image-alt': { id: '1.1.1', level: 'A', name: 'Non-text Content' },
  'button-name': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },
  'link-name': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },
  'color-contrast': { id: '1.4.3', level: 'AA', name: 'Contrast (Minimum)' },
  label: { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  'html-has-lang': { id: '3.1.1', level: 'A', name: 'Language of Page' },
  'document-title': { id: '2.4.2', level: 'A', name: 'Page Titled' },
  'heading-order': { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  region: { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  'aria-valid-attr': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },
  'aria-required-attr': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },
  'aria-roles': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },
  'meta-viewport': { id: '1.4.4', level: 'AA', name: 'Resize Text' },
  tabindex: { id: '2.4.3', level: 'A', name: 'Focus Order' },
  'duplicate-id': { id: '4.1.1', level: 'A', name: 'Parsing' },

  // Navigation & Focus
  bypass: { id: '2.4.1', level: 'A', name: 'Bypass Blocks' },
  'scrollable-region-focusable': { id: '2.1.1', level: 'A', name: 'Keyboard' },
  'frame-focusable-content': { id: '2.1.1', level: 'A', name: 'Keyboard' },
  'focus-order-semantics': { id: '2.4.3', level: 'A', name: 'Focus Order' },

  // Media & Multimedia
  'video-caption': { id: '1.2.2', level: 'A', name: 'Captions (Prerecorded)' },
  'audio-caption': { id: '1.2.1', level: 'A', name: 'Audio-only and Video-only' },
  'no-autoplay-audio': { id: '1.4.2', level: 'A', name: 'Audio Control' },
  'object-alt': { id: '1.1.1', level: 'A', name: 'Non-text Content' },
  'svg-img-alt': { id: '1.1.1', level: 'A', name: 'Non-text Content' },

  // Tables
  'td-headers-attr': { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  'th-has-data-cells': { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  'scope-attr-valid': { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  'table-fake-caption': { id: '1.3.1', level: 'A', name: 'Info and Relationships' },

  // Structure & Semantics
  'definition-list': { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  list: { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  listitem: { id: '1.3.1', level: 'A', name: 'Info and Relationships' },
  'nested-interactive': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },

  // Forms
  'input-image-alt': { id: '1.1.1', level: 'A', name: 'Non-text Content' },
  'select-name': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },
  'autocomplete-valid': { id: '1.3.5', level: 'AA', name: 'Identify Input Purpose' },

  // Frames
  'frame-title': { id: '4.1.2', level: 'A', name: 'Name, Role, Value' },

  // Language
  'valid-lang': { id: '3.1.2', level: 'AA', name: 'Language of Parts' },

  // Deprecated elements
  marquee: { id: '2.2.2', level: 'A', name: 'Pause, Stop, Hide' },
  blink: { id: '2.2.2', level: 'A', name: 'Pause, Stop, Hide' },
};

// Default settings
export const DEFAULT_SETTINGS = {
  wcagLevel: 'AA' as const,
  showIncomplete: false,
  autoHighlight: true,
  visionMode: 'none' as const,
  showFocusOrder: false,
};
