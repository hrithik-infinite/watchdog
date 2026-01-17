import { useState, useEffect, useCallback } from 'react';
import { Eye, Zap, Search, Shield, CheckCircle2, Smartphone } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';

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
  essential?: boolean;
  keyboardShortcut?: string;
}

const auditTypes: AuditTypeConfig[] = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    description: 'WCAG compliance & screen reader support',
    icon: Eye,
    ruleCount: 15,
    essential: true,
    keyboardShortcut: '1',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Core Web Vitals & loading metrics',
    icon: Zap,
    ruleCount: 12,
    essential: true,
    keyboardShortcut: '2',
  },
  {
    id: 'seo',
    label: 'SEO',
    description: 'Meta tags, structured data, rankings',
    icon: Search,
    ruleCount: 20,
    essential: true,
    keyboardShortcut: '3',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'HTTPS, headers, vulnerabilities',
    icon: Shield,
    ruleCount: 12,
    keyboardShortcut: '4',
  },
  {
    id: 'best-practices',
    label: 'Best Practices',
    description: 'HTML validity, console errors, standards',
    icon: CheckCircle2,
    ruleCount: 15,
    keyboardShortcut: '5',
  },
  {
    id: 'pwa',
    label: 'PWA',
    description: 'Manifest, service worker, installability',
    icon: Smartphone,
    ruleCount: 7,
    keyboardShortcut: '6',
  },
];

interface AuditSelectorProps {
  onStartScan: (auditType: AuditType) => void;
  isScanning: boolean;
}

export default function AuditSelector({ onStartScan, isScanning }: AuditSelectorProps) {
  const [selectedAudit, setSelectedAudit] = useState<AuditType>('accessibility');
  const [hoveredAudit, setHoveredAudit] = useState<AuditType | null>(null);

  const handleSelect = (auditType: AuditType) => {
    if (!isScanning) {
      setSelectedAudit(auditType);
    }
  };

  const handleStartScan = useCallback(() => {
    if (!isScanning) {
      onStartScan(selectedAudit);
    }
  }, [isScanning, selectedAudit, onStartScan]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + number keys
      if ((e.metaKey || e.ctrlKey) && !isScanning) {
        const audit = auditTypes.find((a) => a.keyboardShortcut === e.key);
        if (audit) {
          e.preventDefault();
          setSelectedAudit(audit.id);
        }
      }
      // Enter key to scan
      if (e.key === 'Enter' && !isScanning) {
        e.preventDefault();
        handleStartScan();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScanning, selectedAudit, handleStartScan]);

  const selectedConfig = auditTypes.find((a) => a.id === selectedAudit);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-border/40">
        <h2 className="text-h2 text-foreground mb-1.5">Choose Audit Type</h2>
        <p className="text-body text-muted-foreground text-sm">
          Select which aspects of your page to analyze
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Tip: Use ⌘1-6 for quick selection, Enter to scan
        </p>
      </div>

      {/* Audit Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          {auditTypes.map((audit, index) => {
            const Icon = audit.icon;
            const isSelected = selectedAudit === audit.id;
            const isHovered = hoveredAudit === audit.id;

            return (
              <button
                key={audit.id}
                onClick={() => handleSelect(audit.id)}
                onMouseEnter={() => setHoveredAudit(audit.id)}
                onMouseLeave={() => setHoveredAudit(null)}
                disabled={isScanning}
                aria-label={`${audit.label} audit - ${audit.description}. Press ${audit.keyboardShortcut ? `Command ${audit.keyboardShortcut}` : 'to select'}`}
                aria-pressed={isSelected}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={cn(
                  'group relative p-3 rounded-lg border-2 text-left transition-all duration-200',
                  'bg-card hover:bg-card/80',
                  'animate-fade-in cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isSelected
                    ? 'border-[#007aff] shadow-lg shadow-[#007aff]/20 scale-[1.02]'
                    : 'border-border/40 hover:border-border hover:scale-[1.01]'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Scan line effect on hover */}
                {isHovered && (
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
                <div className="flex items-center gap-2 mb-2">
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
                  {audit.essential && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      Essential
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-muted-foreground mb-2">
                  {audit.description}
                </p>

                {/* Rule Count and Keyboard Shortcut */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {audit.ruleCount} checks
                  </span>
                  {audit.keyboardShortcut && (
                    <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground text-[11px] font-mono">
                      ⌘{audit.keyboardShortcut}
                    </kbd>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse-slow" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer with Scan Button */}
      <div className="px-4 py-3 border-t border-border/40 bg-card/50 backdrop-blur-sm space-y-3">
        {selectedConfig && (
          <div className="bg-card/80 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
              <span className="font-semibold text-foreground text-sm">{selectedConfig.label}</span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-primary text-xs font-medium">
                {selectedConfig.ruleCount} checks
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground pl-3.5">
              {selectedConfig.description}
            </p>
          </div>
        )}

        <Button
          onClick={handleStartScan}
          disabled={isScanning}
          className={cn(
            'w-full py-3 text-base font-semibold rounded-lg shadow-xl transition-all duration-200',
            'bg-primary hover:bg-primary-dark hover:scale-[1.02]',
            'border-2 border-primary/30'
          )}
        >
          {isScanning ? (
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Page...</span>
            </div>
          ) : (
            <span>Start {selectedConfig?.label} Scan</span>
          )}
        </Button>
      </div>
    </div>
  );
}
