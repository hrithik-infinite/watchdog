import { Check, CheckCircle2, Eye, Info, Search, Shield, Smartphone, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { MVP_RULES } from '@/shared/constants';
import { Button } from '@/sidepanel/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/sidepanel/components/ui/tooltip';
import { AUDIT_ONE_LINERS, useIsSiteOwner } from '@/sidepanel/lib/persona';
import { cn } from '@/sidepanel/lib/utils';

export type AuditType =
  | 'accessibility'
  | 'performance'
  | 'seo'
  | 'security'
  | 'best-practices'
  | 'pwa';

interface AuditTypeConfig {
  id: AuditType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  ruleCount: number;
  checks: string[];
  doesNotCheck: string[];
}

const auditTypes: AuditTypeConfig[] = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    description: 'WCAG compliance & screen reader support',
    icon: Eye,
    ruleCount: MVP_RULES.length,
    checks: [
      'WCAG 2.1 AA',
      'Screen reader compatibility',
      'Color contrast',
      'Form labels',
      'ARIA attributes',
    ],
    doesNotCheck: ['SEO', 'Performance', 'Security', 'PWA', 'Best Practices'],
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Core Web Vitals & loading metrics',
    icon: Zap,
    ruleCount: 12,
    checks: ['Core Web Vitals (LCP, FCP, CLS)', 'Page load time', 'Resource sizes', 'TTFB'],
    doesNotCheck: ['Accessibility', 'SEO', 'Security', 'PWA', 'Best Practices'],
  },
  {
    id: 'seo',
    label: 'SEO',
    description: 'Meta tags, structured data, rankings',
    icon: Search,
    ruleCount: 20,
    checks: ['Meta tags', 'Open Graph', 'Heading hierarchy', 'Canonical URLs', 'Structured data'],
    doesNotCheck: ['Accessibility', 'Performance', 'Security', 'PWA', 'Best Practices'],
  },
  {
    id: 'security',
    label: 'Security',
    description: 'HTTPS, headers, vulnerabilities',
    icon: Shield,
    ruleCount: 12,
    checks: ['HTTPS', 'Security headers', 'Mixed content', 'Cookie security', 'CSRF protection'],
    doesNotCheck: ['Accessibility', 'Performance', 'SEO', 'PWA', 'Best Practices'],
  },
  {
    id: 'best-practices',
    label: 'Best Practices',
    description: 'HTML validity, console errors, standards',
    icon: CheckCircle2,
    ruleCount: 15,
    checks: [
      'HTML validity',
      'Deprecated elements',
      'Duplicate IDs',
      'DOCTYPE',
      'Character encoding',
    ],
    doesNotCheck: ['Accessibility', 'Performance', 'SEO', 'Security', 'PWA'],
  },
  {
    id: 'pwa',
    label: 'PWA',
    description: 'Manifest, service worker, installability',
    icon: Smartphone,
    ruleCount: 7,
    checks: ['Web manifest', 'Service worker', 'HTTPS', 'App icons', 'Theme color'],
    doesNotCheck: ['Accessibility', 'Performance', 'SEO', 'Security', 'Best Practices'],
  },
];

// Per-audit identity colors. Used for the icon tile (always) and the
// selected-card tint/border/checkbox, so a fully-selected grid reads as six
// distinct categories instead of a wall of one accent. Deliberately scoped to
// the audit picker — kept off the severity ramp and the rest of the app.
const AUDIT_COLORS: Record<AuditType, string> = {
  accessibility: '#46a6ff',
  performance: '#f5a623',
  seo: '#3dd68c',
  security: '#9b8cff',
  'best-practices': '#2dd4bf',
  pwa: '#ec6cb9',
};

interface AuditSelectorProps {
  onStartScan: (auditType: AuditType) => void;
  onStartMultipleScan?: (auditTypes: AuditType[]) => void;
  isScanning: boolean;
}

export default function AuditSelector({
  onStartScan,
  onStartMultipleScan,
  isScanning,
}: AuditSelectorProps) {
  const isSiteOwner = useIsSiteOwner();

  // Multi-select default (ux-public-9): site owners want a broad health check, so
  // seed all six audits; developers start focused on accessibility. First paint is
  // held until settings load, so the persona is correct at mount and this initializer
  // (which only runs once) reads the right default.
  const [selectedAudits, setSelectedAudits] = useState<Set<AuditType>>(() =>
    isSiteOwner ? new Set(auditTypes.map((a) => a.id)) : new Set(['accessibility'])
  );

  // Toggle audit selection
  const toggleAudit = useCallback(
    (auditType: AuditType) => {
      if (isScanning) return;
      setSelectedAudits((prev) => {
        const next = new Set(prev);
        if (next.has(auditType)) {
          next.delete(auditType);
        } else {
          next.add(auditType);
        }
        return next;
      });
    },
    [isScanning]
  );

  // Select all audits
  const selectAll = useCallback(() => {
    if (isScanning) return;
    setSelectedAudits(new Set(auditTypes.map((a) => a.id)));
  }, [isScanning]);

  // Clear all selections
  const clearAll = useCallback(() => {
    if (isScanning) return;
    setSelectedAudits(new Set());
  }, [isScanning]);

  // Start scan with selected audits
  const handleStartScan = useCallback(() => {
    if (isScanning || selectedAudits.size === 0) return;

    const auditsArray = Array.from(selectedAudits);

    if (auditsArray.length === 1) {
      // Single audit - use regular scan
      onStartScan(auditsArray[0]);
    } else if (onStartMultipleScan) {
      // Multiple audits - use multi-scan
      onStartMultipleScan(auditsArray);
    } else {
      // Fallback: just run first selected
      onStartScan(auditsArray[0]);
    }
  }, [isScanning, selectedAudits, onStartScan, onStartMultipleScan]);

  // Compute total checks for selected audits
  const totalChecks = useMemo(() => {
    return Array.from(selectedAudits).reduce((sum, auditId) => {
      const audit = auditTypes.find((a) => a.id === auditId);
      return sum + (audit?.ruleCount || 0);
    }, 0);
  }, [selectedAudits]);

  // Get button text based on selection
  const buttonText = useMemo(() => {
    if (isScanning) return null; // Will show spinner
    if (selectedAudits.size === 0) return 'Select audits to scan';
    if (selectedAudits.size === 1) {
      const auditId = Array.from(selectedAudits)[0];
      const audit = auditTypes.find((a) => a.id === auditId);
      return `Start ${audit?.label} Scan`;
    }
    if (selectedAudits.size === auditTypes.length) {
      return `Start Full Audit (${selectedAudits.size})`;
    }
    return `Start ${selectedAudits.size} Audits`;
  }, [isScanning, selectedAudits]);

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-fade-in">
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-h2 text-foreground">Choose Audit Types</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAll}
              disabled={isScanning || selectedAudits.size === auditTypes.length}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              Select All
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={clearAll}
              disabled={isScanning || selectedAudits.size === 0}
              className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-body text-muted-foreground text-sm">
          Select multiple audits to run together
        </p>
      </div>

      {/* Audit Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* biome-ignore lint/a11y/useSemanticElements: intentional ARIA group wrapping the custom checkbox widgets below */}
        <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Audit types">
          {auditTypes.map((audit) => {
            const Icon = audit.icon;
            const isSelected = selectedAudits.has(audit.id);
            const color = AUDIT_COLORS[audit.id];
            // Site owners lead with the plain benefit one-liner (ux-public-8); the
            // jargon `description` stays available in the info tooltip below.
            const displayDescription =
              isSiteOwner && AUDIT_ONE_LINERS[audit.id]
                ? AUDIT_ONE_LINERS[audit.id]
                : audit.description;

            return (
              <div key={audit.id} className="relative">
                {/* biome-ignore lint/a11y/useSemanticElements: custom checkbox — a styled button holding icon + label content with roving focus and aria-checked */}
                <button
                  type="button"
                  onClick={() => toggleAudit(audit.id)}
                  disabled={isScanning}
                  aria-label={`${audit.label} audit - ${displayDescription}`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={cn(
                    'group relative w-full h-full p-3 rounded-xl border-2 text-left animate-fade-in cursor-pointer',
                    !isSelected && 'border-border bg-card hover:bg-accent'
                  )}
                  // Selected cards tint in their OWN category color, not the
                  // single blue accent — so all-selected isn't a wall of blue.
                  style={
                    isSelected
                      ? { borderColor: `${color}8c`, backgroundColor: `${color}1c` }
                      : undefined
                  }
                >
                  {/* Top row: category icon tile (left) and the select checkbox
                      (right) on their own line. Keeping the checkbox out of the
                      title's row means long labels like "Accessibility" can never
                      run underneath it. */}
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                      // Tile carries the category color; the lucide icon inherits
                      // it via currentColor (its prop type only allows className).
                      style={{ backgroundColor: `${color}1f`, color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div
                      className={cn(
                        'h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0',
                        !isSelected && 'border-border group-hover:border-muted-foreground'
                      )}
                      style={
                        isSelected ? { backgroundColor: color, borderColor: color } : undefined
                      }
                    >
                      {isSelected && <Check className="h-3 w-3" style={{ color: '#0a0a0c' }} />}
                    </div>
                  </div>

                  {/* Title — full card width so it wraps cleanly instead of
                      running under the checkbox. */}
                  <h3 className="text-sm font-semibold text-foreground leading-snug mb-1">
                    {audit.label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs leading-relaxed text-muted-foreground mb-2">
                    {displayDescription}
                  </p>

                  {/* Rule Count — keeps clear of the info button bottom-right. */}
                  <div className="flex items-center gap-1.5 text-xs pr-6">
                    <span className="font-medium text-muted-foreground">
                      {audit.ruleCount} checks
                    </span>
                  </div>
                </button>

                {/* Info tooltip - separate focusable control, kept out of the card button */}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`What the ${audit.label} audit checks and does not check`}
                        className="absolute bottom-2 right-2 inline-flex items-center justify-center size-6 rounded-md hover:bg-accent transition-colors cursor-help text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-3">
                      <div className="space-y-2">
                        {/* Technical details — the jargon description the card face
                            drops in site-owner mode stays reachable here. */}
                        {isSiteOwner && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1">
                              Technical details:
                            </p>
                            <p className="text-xs text-muted-foreground">{audit.description}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">✓ Checks:</p>
                          <p className="text-xs text-muted-foreground">{audit.checks.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">
                            ✗ Does NOT check:
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {audit.doesNotCheck.join(', ')}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer — primary CTA sits on top so it is never pushed below the fold;
          a single compact line summarizes the selection beneath it. */}
      <div className="px-4 py-3 border-t border-border bg-card space-y-2">
        <Button
          onClick={handleStartScan}
          disabled={isScanning || selectedAudits.size === 0}
          className="w-full h-11 text-base font-semibold"
        >
          {isScanning ? (
            <span className="flex items-center gap-2.5">
              <span className="h-5 w-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              <span>Scanning Page...</span>
            </span>
          ) : (
            <span>{buttonText}</span>
          )}
        </Button>

        {selectedAudits.size > 0 ? (
          <p className="text-xs text-center text-muted-foreground tabular-nums">
            {selectedAudits.size === 1
              ? auditTypes.find((a) => selectedAudits.has(a.id))?.label
              : `${selectedAudits.size} Audits Selected`}{' '}
            · {totalChecks} total checks
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Select one or more audits to scan your page
          </p>
        )}
      </div>
    </div>
  );
}
