// Severity levels for accessibility issues
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

// WCAG conformance levels
export type WCAGLevel = 'A' | 'AA' | 'AAA';

// Issue categories
export type Category =
  | 'images'
  | 'interactive'
  | 'forms'
  | 'color'
  | 'document'
  | 'structure'
  | 'aria'
  | 'technical';

// Element information from the page
export interface ElementInfo {
  selector: string;
  html: string;
  failureSummary?: string;
}

// Fix suggestion for an issue
export interface FixSuggestion {
  description: string;
  code: string;
  learnMoreUrl: string;
}

// WCAG criteria information
export interface WCAGCriteria {
  id: string;
  level: WCAGLevel;
  name: string;
  description: string;
}

// Which audit / standard an issue belongs to. Drives how it is labelled in the
// UI and exports: only `wcag` issues are genuine WCAG/accessibility findings —
// the other scanners reuse the `wcag` field with placeholder values, so display
// code must key off `standard` to avoid calling e.g. a Performance issue "WCAG".
export type IssueStandard = 'wcag' | 'performance' | 'seo' | 'security' | 'best-practice' | 'pwa';

// Individual accessibility issue
export interface Issue {
  id: string;
  ruleId: string;
  severity: Severity;
  category: Category;
  message: string;
  description: string;
  helpUrl: string;
  wcag: WCAGCriteria;
  // Optional for backward compatibility; set centrally in scanPage(). Absent is
  // treated as 'wcag' (the original accessibility-only behaviour).
  standard?: IssueStandard;
  element: ElementInfo;
  fix: FixSuggestion;
}

// Summary of scan results
export interface ScanSummary {
  total: number;
  bySeverity: Record<Severity, number>;
  byCategory: Record<Category, number>;
}

// Complete scan result
export interface ScanResult {
  url: string;
  timestamp: number;
  duration: number;
  issues: Issue[];
  incomplete: Issue[];
  summary: ScanSummary;
}

// Vision simulation modes
export type VisionMode =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'blur-low'
  | 'blur-medium'
  | 'blur-high';

// Settings configuration
export interface Settings {
  wcagLevel: WCAGLevel;
  showIncomplete: boolean;
  autoHighlight: boolean;
  visionMode: VisionMode;
  showFocusOrder: boolean;
}

// Filter state for issue list
export interface FilterState {
  severity: Severity | 'all';
  category: Category | 'all';
  searchQuery: string;
}

// Highlight state
export interface HighlightState {
  activeIssueId: string | null;
  highlightedSelectors: string[];
}
