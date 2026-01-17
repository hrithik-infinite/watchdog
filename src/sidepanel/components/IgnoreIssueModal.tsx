/**
 * IgnoreIssueModal component
 * Allows users to mark an issue as known/ignored with a reason
 */

import { useState } from 'react';
import { X, Ban, Check } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';
import { ignoreIssue, type IgnoreReason, IGNORE_REASON_LABELS } from '@/shared/storage';
import type { Issue } from '@/shared/types';

interface IgnoreIssueModalProps {
  issue: Issue;
  url: string;
  onClose: () => void;
  onIgnored: () => void;
}

const REASON_OPTIONS: IgnoreReason[] = [
  'third-party',
  'design-decision',
  'false-positive',
  'will-fix-later',
  'other',
];

export default function IgnoreIssueModal({
  issue,
  url,
  onClose,
  onIgnored,
}: IgnoreIssueModalProps) {
  const [selectedReason, setSelectedReason] = useState<IgnoreReason | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await ignoreIssue(
        url,
        issue.element.selector,
        issue.ruleId,
        issue.message,
        selectedReason,
        selectedReason === 'other' ? customNote : undefined
      );
      // Close modal first, then trigger the callback
      // This prevents double state updates causing flicker
      onClose();
      // Small delay to let modal close animation complete
      setTimeout(() => {
        onIgnored();
      }, 50);
    } catch (error) {
      console.error('Failed to ignore issue:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Mark as Known Issue</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Issue Preview */}
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground line-clamp-2">{issue.message}</p>
        </div>

        {/* Reason Selection */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Why are you ignoring this issue?
          </p>

          <div className="space-y-2">
            {REASON_OPTIONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all',
                  selectedReason === reason
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-border hover:bg-muted/30'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedReason === reason
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {selectedReason === reason && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="text-sm">{IGNORE_REASON_LABELS[reason]}</span>
              </button>
            ))}
          </div>

          {/* Custom Note for "Other" */}
          {selectedReason === 'other' && (
            <div className="mt-3">
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                Mark as Known
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
