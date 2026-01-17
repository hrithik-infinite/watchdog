import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import type { AuditType } from './AuditSelector';

interface PostScanReminderProps {
  completedAuditType: AuditType;
  onRunRemaining?: () => void;
  onDismiss?: () => void;
}

// Map of audit types to their labels
const AUDIT_LABELS: Record<AuditType, string> = {
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

// All implemented audit types
const IMPLEMENTED_AUDITS: AuditType[] = [
  'accessibility',
  'performance',
  'seo',
  'security',
  'best-practices',
  'pwa',
];

const STORAGE_KEY = 'watchdog_dismiss_post_scan_reminder';

export default function PostScanReminder({
  completedAuditType,
  onRunRemaining,
  onDismiss,
}: PostScanReminderProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden until we check storage
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check if user has previously dismissed permanently
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY).then((result) => {
      if (result[STORAGE_KEY]) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    });
  }, []);

  // Get remaining audit types
  const remainingAudits = IMPLEMENTED_AUDITS.filter((a) => a !== completedAuditType);

  const handleDismiss = () => {
    if (dontShowAgain) {
      chrome.storage.local.set({ [STORAGE_KEY]: true });
    }
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="mx-4 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              ✓ {AUDIT_LABELS[completedAuditType]} scan complete
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            For complete coverage, also run:{' '}
            <span className="text-foreground/80">
              {remainingAudits
                .slice(0, 3)
                .map((a) => AUDIT_LABELS[a])
                .join(', ')}
              {remainingAudits.length > 3 && ` +${remainingAudits.length - 3} more`}
            </span>
          </p>

          <div className="flex items-center gap-3">
            {onRunRemaining && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRunRemaining}
                className="h-7 text-xs gap-1 bg-primary/10 border-primary/30 hover:bg-primary/20"
              >
                Run Remaining
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-3 w-3 rounded border-border"
              />
              Don't show again
            </label>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Helper to reset the reminder preference (for testing)
export function resetPostScanReminderPreference() {
  chrome.storage.local.remove(STORAGE_KEY);
}
