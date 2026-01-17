import type { Category, Severity } from './types';

// The 15 MVP accessibility rules from axe-core
export const MVP_RULES = [
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
] as const;

export type RuleId = (typeof MVP_RULES)[number];

// Map rule IDs to categories
export const RULE_CATEGORIES: Record<RuleId, Category> = {
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

// WCAG criteria data for the 15 rules
export const WCAG_CRITERIA: Record<RuleId, { id: string; level: 'A' | 'AA'; name: string }> = {
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
};

// Default settings
export const DEFAULT_SETTINGS = {
  wcagLevel: 'AA' as const,
  showIncomplete: false,
  autoHighlight: true,
  visionMode: 'none' as const,
  showFocusOrder: false,
};
