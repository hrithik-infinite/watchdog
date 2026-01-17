import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, Zap, Search, Shield, CheckCircle2, Smartphone, Sparkles, Info, Check } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/sidepanel/components/ui/tooltip';

export type AuditType =
  | 'accessibility'
  | 'performance'
  | 'seo'
  | 'security'
  | 'best-practices'
  | 'pwa'
  | 'mobile'
  | 'links'
  | 'i18n'
  | 'privacy';

interface AuditTypeConfig {
  id: AuditType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  ruleCount: number;
  highPriority?: boolean;
  keyboardShortcut?: string;
  checks: string[];
  doesNotCheck: string[];
}

const auditTypes: AuditTypeConfig[] = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    description: 'WCAG compliance & screen reader support',
    icon: Eye,
    ruleCount: 15,
    highPriority: true,
    keyboardShortcut: '1',
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
    highPriority: true,
    keyboardShortcut: '2',
    checks: ['Core Web Vitals (LCP, FCP, CLS)', 'Page load time', 'Resource sizes', 'TTFB'],
    doesNotCheck: ['Accessibility', 'SEO', 'Security', 'PWA', 'Best Practices'],
  },
  {
    id: 'seo',
    label: 'SEO',
    description: 'Meta tags, structured data, rankings',
    icon: Search,
    ruleCount: 20,
    highPriority: true,
    keyboardShortcut: '3',
    checks: ['Meta tags', 'Open Graph', 'Heading hierarchy', 'Canonical URLs', 'Structured data'],
    doesNotCheck: ['Accessibility', 'Performance', 'Security', 'PWA', 'Best Practices'],
  },
  {
    id: 'security',
    label: 'Security',
    description: 'HTTPS, headers, vulnerabilities',
    icon: Shield,
    ruleCount: 12,
    keyboardShortcut: '4',
    checks: ['HTTPS', 'Security headers', 'Mixed content', 'Cookie security', 'CSRF protection'],
    doesNotCheck: ['Accessibility', 'Performance', 'SEO', 'PWA', 'Best Practices'],
  },
  {
    id: 'best-practices',
    label: 'Best Practices',
    description: 'HTML validity, console errors, standards',
    icon: CheckCircle2,
    ruleCount: 15,
    keyboardShortcut: '5',
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
    keyboardShortcut: '6',
    checks: ['Web manifest', 'Service worker', 'HTTPS', 'App icons', 'Theme color'],
    doesNotCheck: ['Accessibility', 'Performance', 'SEO', 'Security', 'Best Practices'],
  },
];

// Get high priority audit types for quick action
const highPriorityAudits = auditTypes.filter((a) => a.highPriority);

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
  // Multi-select state - default to accessibility selected
  const [selectedAudits, setSelectedAudits] = useState<Set<AuditType>>(
    () => new Set(['accessibility'])
  );
  const [hoveredAudit, setHoveredAudit] = useState<AuditType | null>(null);

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

  // Handler for scanning all high priority audits
  const handleScanAllHighPriority = useCallback(() => {
    if (isScanning) return;
    const highPriorityIds = highPriorityAudits.map((a) => a.id);
    if (onStartMultipleScan) {
      onStartMultipleScan(highPriorityIds);
    } else {
      // Fallback: run first high priority audit
      onStartScan(highPriorityIds[0]);
    }
  }, [isScanning, onStartMultipleScan, onStartScan]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + number keys to toggle
      if ((e.metaKey || e.ctrlKey) && !isScanning) {
        const audit = auditTypes.find((a) => a.keyboardShortcut === e.key);
        if (audit) {
          e.preventDefault();
          toggleAudit(audit.id);
        }
      }
      // Enter key to scan
      if (e.key === 'Enter' && !isScanning && selectedAudits.size > 0) {
        e.preventDefault();
        handleStartScan();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScanning, selectedAudits, handleStartScan, toggleAudit]);

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
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-h2 text-foreground">Choose Audit Types</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={selectAll}
              disabled={isScanning || selectedAudits.size === auditTypes.length}
              className="text-xs text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              Select All
            </button>
            <span className="text-muted-foreground/40">|</span>
            <button
              onClick={clearAll}
              disabled={isScanning || selectedAudits.size === 0}
              className="text-xs text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-body text-muted-foreground text-sm">
          Select multiple audits to run together
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Tip: Use ⌘1-6 to toggle selection, Enter to scan
        </p>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanAllHighPriority}
            disabled={isScanning}
            className="w-full gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Scan All High Priority ({highPriorityAudits.length})</span>
          </Button>
          <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">
            Runs Accessibility, Performance & SEO together
          </p>
        </div>
      </div>

      {/* Audit Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          {auditTypes.map((audit, index) => {
            const Icon = audit.icon;
            const isSelected = selectedAudits.has(audit.id);
            const isHovered = hoveredAudit === audit.id;

            return (
              <button
                key={audit.id}
                onClick={() => toggleAudit(audit.id)}
                onMouseEnter={() => setHoveredAudit(audit.id)}
                onMouseLeave={() => setHoveredAudit(null)}
                disabled={isScanning}
                aria-label={`${audit.label} audit - ${audit.description}. Press ${audit.keyboardShortcut ? `Command ${audit.keyboardShortcut}` : ''} to toggle`}
                aria-pressed={isSelected}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                className={cn(
                  'group relative p-3 rounded-lg border-2 text-left transition-all duration-200',
                  'bg-card hover:bg-card/80',
                  'animate-fade-in cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isSelected
                    ? 'border-[#007aff] bg-primary/5 shadow-md shadow-[#007aff]/10'
                    : 'border-border/40 hover:border-border hover:scale-[1.01]'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Checkbox indicator - top right */}
                <div className="absolute top-2 right-2">
                  <div
                    className={cn(
                      'h-5 w-5 rounded border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                {/* Scan line effect on hover */}
                {isHovered && !isSelected && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                    <div
                      className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"
                      style={{
                        animation: 'scan 2s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}

                {/* Icon and Label Row */}
                <div className="flex items-center gap-2 mb-2 pr-6">
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                      isSelected
                        ? 'text-primary scale-110'
                        : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                    )}
                  />
                  <h3
                    className={cn(
                      'text-sm font-semibold transition-colors flex-1',
                      isSelected
                        ? 'text-foreground'
                        : 'text-foreground/90 group-hover:text-foreground'
                    )}
                  >
                    {audit.label}
                  </h3>
                </div>

                {/* High Priority Badge */}
                {audit.highPriority && (
                  <div className="mb-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      High Priority
                    </span>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs leading-relaxed text-muted-foreground mb-2">
                  {audit.description}
                </p>

                {/* Rule Count, Info Tooltip and Keyboard Shortcut */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'font-medium',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {audit.ruleCount} checks
                    </span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted/50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-1">
                                ✓ Checks:
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {audit.checks.join(', ')}
                              </p>
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
                  {audit.keyboardShortcut && (
                    <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground text-[11px] font-mono">
                      ⌘{audit.keyboardShortcut}
                    </kbd>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer with Scan Button */}
      <div className="px-4 py-3 border-t border-border/40 bg-card/50 backdrop-blur-sm space-y-3">
        {/* Selected audits summary */}
        {selectedAudits.size > 0 && (
          <div className="bg-card/80 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
                <span className="font-semibold text-foreground text-sm">
                  {selectedAudits.size === 1
                    ? auditTypes.find((a) => selectedAudits.has(a.id))?.label
                    : `${selectedAudits.size} Audits Selected`}
                </span>
              </div>
              <span className="text-primary text-xs font-medium">{totalChecks} total checks</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground pl-3.5">
              {Array.from(selectedAudits)
                .map((id) => auditTypes.find((a) => a.id === id)?.label)
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}

        {/* Empty state when nothing selected */}
        {selectedAudits.size === 0 && (
          <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
            <p className="text-xs text-muted-foreground text-center">
              Select one or more audits to scan your page
            </p>
          </div>
        )}

        <Button
          onClick={handleStartScan}
          disabled={isScanning || selectedAudits.size === 0}
          className={cn(
            'w-full py-3 text-base font-semibold rounded-lg shadow-xl transition-all duration-200',
            'bg-primary hover:bg-primary-dark hover:scale-[1.02]',
            'border-2 border-primary/30',
            selectedAudits.size === 0 && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isScanning ? (
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Page...</span>
            </div>
          ) : (
            <span>{buttonText}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
