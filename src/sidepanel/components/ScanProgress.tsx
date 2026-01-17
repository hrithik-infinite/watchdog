import { useEffect, useState } from 'react';
import { Eye, Zap, Search, Shield, CheckCircle2, Smartphone } from 'lucide-react';
import { cn } from '@/sidepanel/lib/utils';
import type { AuditType } from '../store';

interface ScanProgressProps {
  currentAuditType: AuditType | null;
  currentAuditIndex: number;
  totalAudits: number;
}

const auditIcons: Record<AuditType, React.ComponentType<{ className?: string }>> = {
  accessibility: Eye,
  performance: Zap,
  seo: Search,
  security: Shield,
  'best-practices': CheckCircle2,
  pwa: Smartphone,
  mobile: Smartphone,
  links: Search,
  i18n: Search,
  privacy: Shield,
};

const auditLabels: Record<AuditType, string> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
  mobile: 'Mobile',
  links: 'Links',
  i18n: 'i18n',
  privacy: 'Privacy',
};

const scanningMessages = [
  'Analyzing page structure...',
  'Checking elements...',
  'Evaluating compliance...',
  'Detecting issues...',
  'Generating report...',
];

export default function ScanProgress({
  currentAuditType,
  currentAuditIndex,
  totalAudits,
}: ScanProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % scanningMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const Icon = currentAuditType ? auditIcons[currentAuditType] : Eye;
  const label = currentAuditType ? auditLabels[currentAuditType] : 'Accessibility';
  const progress = totalAudits > 0 ? ((currentAuditIndex + 1) / totalAudits) * 100 : 0;
  const isMultiScan = totalAudits > 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      {/* Main scanner visualization */}
      <div className="relative mb-8">
        {/* Outer ring - pulsing */}
        <div
          className="absolute inset-0 rounded-full bg-primary/10 animate-ping"
          style={{ animationDuration: '2s' }}
        />

        {/* Middle ring */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {/* Rotating scanner line */}
          <div
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary"
            style={{ animation: 'spin 1.5s linear infinite' }}
          />

          {/* Inner content */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon className="w-8 h-8 text-primary animate-pulse" />
          </div>

          {/* Scan line effect */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              style={{
                animation: 'scan-vertical 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* Audit type label */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Scanning {label}</h3>
        <p className="text-sm text-muted-foreground h-5">
          {scanningMessages[messageIndex]}
          {dots}
        </p>
      </div>

      {/* Progress bar for multi-scan */}
      {isMultiScan && (
        <div className="w-full max-w-xs mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              Audit {currentAuditIndex + 1} of {totalAudits}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Scanning indicators */}
      <div className="flex items-center gap-3 mt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn('w-2 h-2 rounded-full bg-primary/60', 'animate-bounce')}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>

      {/* Skeleton preview of results */}
      <div className="w-full max-w-sm mt-10 space-y-3 opacity-40">
        <div className="h-3 bg-muted/30 rounded-full w-3/4 animate-pulse" />
        <div
          className="h-3 bg-muted/30 rounded-full w-full animate-pulse"
          style={{ animationDelay: '0.1s' }}
        />
        <div
          className="h-3 bg-muted/30 rounded-full w-5/6 animate-pulse"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="h-3 bg-muted/30 rounded-full w-2/3 animate-pulse"
          style={{ animationDelay: '0.3s' }}
        />
      </div>
    </div>
  );
}
