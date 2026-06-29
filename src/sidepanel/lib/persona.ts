/**
 * Persona helpers — the read side of the Site-owner repositioning.
 *
 * The audience persona lives in `settings.persona` (persisted via the settings
 * store). Components subscribe to it through these hooks rather than threading a
 * prop through the whole tree, and share the plain-language copy maps below so
 * the wording stays consistent across cards, filters and exports.
 */

import { useScanStore } from '../store';
import type { Persona, Severity } from '@/shared/types';

/** The current audience persona. */
export function usePersona(): Persona {
  return useScanStore((s) => s.settings.persona);
}

/**
 * True when the user is in Site-owner mode — the signal gated features key off
 * to swap jargon for plain language and hide developer-only affordances.
 */
export function useIsSiteOwner(): boolean {
  return useScanStore((s) => s.settings.persona === 'site-owner');
}

/**
 * Plain-language severity subtitles (ux-public-5). Supplementary copy shown
 * alongside — never replacing — the canonical severity label, so the meaning is
 * legible to a non-developer. Audit-agnostic on purpose (these read sensibly for
 * a performance or SEO finding, not just accessibility).
 */
export const SEVERITY_PLAIN: Record<Severity, string> = {
  critical: 'Blocks people from using the page',
  serious: 'Big problems for many visitors',
  moderate: 'Noticeable issues worth fixing',
  minor: 'Small polish',
};

/**
 * Plain, benefit-led one-liners for each audit (ux-public-8). Keyed by the audit
 * id used in the store/AuditSelector. Used to lead with "what it does for you"
 * instead of an acronym.
 */
export const AUDIT_ONE_LINERS: Record<string, string> = {
  accessibility: 'Can everyone use your site?',
  performance: 'Does your site load fast?',
  seo: 'Will Google find and rank your page?',
  security: 'Is your site safe for visitors?',
  'best-practices': 'Is your site built to modern standards?',
  pwa: 'Can people install your site like an app?',
};
