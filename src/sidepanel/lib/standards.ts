import type { IssueStandard } from '@/shared/types';

// Neutral display labels for non-accessibility issue standards, so a
// Performance/SEO/Security/etc. finding is never mislabelled "WCAG".
// Accessibility issues ('wcag', or legacy undefined) are rendered with their
// actual WCAG criterion and conformance level instead.
export const STANDARD_LABELS: Record<IssueStandard, string> = {
  wcag: 'WCAG',
  performance: 'Performance metric',
  seo: 'SEO guideline',
  security: 'Security best practice',
  'best-practice': 'Web best practice',
  pwa: 'PWA requirement',
};

// True when an issue should be labelled with WCAG criteria (accessibility).
// Undefined `standard` is treated as WCAG for backward compatibility.
export function isWcagIssue(standard: IssueStandard | undefined): boolean {
  return !standard || standard === 'wcag';
}
