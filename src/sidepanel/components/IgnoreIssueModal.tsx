/**
 * IgnoreIssueModal component
 * Allows users to mark an issue as known/ignored with a reason
 */

import { Ban, Check, X } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { IGNORE_REASON_LABELS, type IgnoreReason, ignoreIssue } from '@/shared/storage';
import type { Issue } from '@/shared/types';
import { Button } from '@/sidepanel/components/ui/button';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import { cn } from '@/sidepanel/lib/utils';

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

// Plain-language reason wording for the Site-owner audience (ux-public-15). Kept
// local to the component so the developer-facing IGNORE_REASON_LABELS in
// shared/storage stays the canonical, persisted vocabulary.
const SITE_OWNER_REASON_LABELS: Record<IgnoreReason, string> = {
  'false-positive': 'Not actually a problem',
  'third-party': "It's from another company's code",
  'design-decision': "It's intentional",
  'will-fix-later': "I'll fix it later",
  other: 'Other reason',
};

// Elements that can receive keyboard focus inside the dialog.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]',
].join(',');

export default function IgnoreIssueModal({
  issue,
  url,
  onClose,
  onIgnored,
}: IgnoreIssueModalProps) {
  const [selectedReason, setSelectedReason] = useState<IgnoreReason | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Site-owner mode swaps the developer jargon ("Mark as Known Issue") for plain
  // wording. The stored reason value is unchanged — only the displayed copy.
  const isSiteOwner = useIsSiteOwner();
  const reasonLabels = isSiteOwner ? SITE_OWNER_REASON_LABELS : IGNORE_REASON_LABELS;
  const dialogTitle = isSiteOwner ? 'Hide this issue' : 'Mark as Known Issue';
  const submitLabel = isSiteOwner ? 'Hide' : 'Mark as Known';

  const dialogRef = useRef<HTMLDivElement>(null);
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Keep the latest onClose without re-running the focus-trap effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const titleId = useId();
  const reasonLabelId = useId();

  // Roving tabindex: the selected radio is tabbable; if none is selected, the
  // first radio is the tab stop for the group.
  const activeRadioIndex = selectedReason ? REASON_OPTIONS.indexOf(selectedReason) : 0;

  // On open, focus the first focusable element and trap Tab/Shift+Tab focus
  // inside the dialog. Close on Escape. Restore focus on unmount.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getAttribute('tabindex') !== '-1'
      );

    getFocusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleRadioKeyDown = (event: ReactKeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % REASON_OPTIONS.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + REASON_OPTIONS.length) % REASON_OPTIONS.length;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedReason(REASON_OPTIONS[nextIndex]);
    radioRefs.current[nextIndex]?.focus();
  };

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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm bg-card border border-border rounded-xl shadow-[var(--shadow-elev-overlay)] animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-muted-foreground" />
            <h2 id={titleId} className="font-semibold text-foreground">
              {dialogTitle}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Issue Preview */}
        <div className="px-4 py-3 border-b border-border bg-muted">
          <p className="text-xs text-muted-foreground line-clamp-2">{issue.message}</p>
        </div>

        {/* Reason Selection */}
        <div className="px-4 py-3">
          <p id={reasonLabelId} className="text-xs font-medium text-muted-foreground mb-3">
            Why are you ignoring this issue?
          </p>

          <div role="radiogroup" aria-labelledby={reasonLabelId} className="space-y-2">
            {REASON_OPTIONS.map((reason, index) => (
              // biome-ignore lint/a11y/useSemanticElements: custom radio — a styled button with roving tabindex + aria-checked that a native input can't replicate
              <button
                key={reason}
                type="button"
                role="radio"
                aria-checked={selectedReason === reason}
                tabIndex={index === activeRadioIndex ? 0 : -1}
                ref={(el) => {
                  radioRefs.current[index] = el;
                }}
                onClick={() => setSelectedReason(reason)}
                onKeyDown={(event) => handleRadioKeyDown(event, index)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left',
                  selectedReason === reason
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedReason === reason ? 'border-primary bg-primary' : 'border-border'
                  )}
                >
                  {selectedReason === reason && (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  )}
                </div>
                <span className="text-sm">{reasonLabels[reason]}</span>
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
                aria-label="Additional note"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-input resize-none placeholder:text-muted-foreground"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted">
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
                <div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
