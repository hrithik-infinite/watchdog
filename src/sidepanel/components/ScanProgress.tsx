import {
  Check,
  CheckCircle2,
  Circle,
  Eye,
  Loader2,
  Search,
  Shield,
  Smartphone,
  Zap,
} from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import type { AuditType } from '../store';

interface ScanProgressProps {
  currentAuditType: AuditType | null;
  currentAuditIndex: number;
  totalAudits: number;
  auditTypes?: AuditType[];
  onCancel?: () => void;
}

const auditIcons: Record<AuditType, React.ComponentType<{ className?: string }>> = {
  accessibility: Eye,
  performance: Zap,
  seo: Search,
  security: Shield,
  'best-practices': CheckCircle2,
  pwa: Smartphone,
};

const auditLabels: Record<AuditType, string> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
};

/**
 * Loading state for an in-progress scan.
 *
 * One honest loading primitive, because the product audits motion: a single
 * spinner for a single audit (unknown sub-progress), and a DETERMINATE bar plus
 * a live per-audit checklist wired to real audit-level progress for a
 * multi-scan. No fake results skeleton, no timer-driven status copy disconnected
 * from real work, no concurrent decorative animations. The spinner is
 * neutralized for users who request reduced motion by the global rule in
 * globals.css.
 */
export default function ScanProgress({
  currentAuditType,
  currentAuditIndex,
  totalAudits,
  auditTypes,
  onCancel,
}: ScanProgressProps) {
  const Icon = (currentAuditType && auditIcons[currentAuditType]) || Eye;
  const label = (currentAuditType && auditLabels[currentAuditType]) || 'Accessibility';
  const isMultiScan = totalAudits > 1;
  const progress = totalAudits > 0 ? Math.round(((currentAuditIndex + 1) / totalAudits) * 100) : 0;

  // Multi-audit: a determinate bar plus a live checklist of every audit in the
  // run, each row reflecting real done / scanning / waiting state.
  if (isMultiScan) {
    return (
      <div className="flex-1 flex flex-col items-center px-6 py-12 animate-fade-in">
        <div className="w-full max-w-sm">
          <h2 className="text-h3 text-foreground">Running full audit</h2>
          <p className="text-sm text-muted-foreground">
            Staying on your machine — nothing is uploaded.
          </p>

          <div className="flex items-center justify-between mt-5">
            <span className="text-sm font-semibold tabular-nums">
              Audit {currentAuditIndex + 1} of {totalAudits} · {progress}%
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>

          {/* Determinate progress — wired to real audit-level progress. */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`Scan progress: audit ${currentAuditIndex + 1} of ${totalAudits}`}
            className="h-2 bg-muted rounded-full overflow-hidden mt-2"
          >
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-caption uppercase text-muted-foreground mt-5">Progress</p>

          <ul className="mt-1">
            {(auditTypes ?? []).map((auditType, i) => {
              const rowLabel = auditLabels[auditType];
              const isDone = i < currentAuditIndex;
              const isScanning = i === currentAuditIndex;

              return (
                <li
                  key={auditType}
                  className="flex items-center justify-between border-t border-border py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {isDone ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : isScanning ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    {rowLabel}
                  </span>
                  {isDone ? (
                    <span className="text-xs text-muted-foreground">Done</span>
                  ) : isScanning ? (
                    <span className="text-xs text-primary">Scanning…</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Waiting</span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Cancel control — lets the user bail out of a slow or stuck scan. */}
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="w-full mt-6">
              Cancel scan
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      {/* Single honest loader: a spinner ring around the current audit's icon. */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-border border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>

      <h2 className="text-h3 text-foreground mb-1">Scanning {label}</h2>

      <p className="text-sm text-muted-foreground mb-6">Checking the page…</p>

      {/* Cancel control — lets the user bail out of a slow or stuck scan. */}
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="mt-2 text-muted-foreground hover:text-foreground"
        >
          Cancel scan
        </Button>
      )}
    </div>
  );
}
