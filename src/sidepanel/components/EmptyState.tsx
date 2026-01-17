import { RefreshCw, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { EyeIcon, CheckCircleIcon, ErrorCircleIcon } from './icons';
import { getErrorDetails } from '@/shared/errors';

interface EmptyStateProps {
  type: 'initial' | 'no-issues' | 'error';
  error?: string;
  onScan?: () => void;
}

export default function EmptyState({ type, error, onScan }: EmptyStateProps) {
  if (type === 'error') {
    const errorDetails = getErrorDetails(error || '');

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center animate-fade-in bg-background">
        <ErrorCircleIcon />

        {/* Error Code Badge */}
        <div className="mt-4 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-mono">
            <AlertTriangle className="h-3 w-3" />
            {errorDetails.code}
          </span>
        </div>

        {/* Error Title */}
        <h2 className="text-h1 text-foreground mb-2">{errorDetails.title}</h2>

        {/* Error Message */}
        <p className="text-body text-muted-foreground max-w-xs mb-3">{errorDetails.message}</p>

        {/* Suggestion Box */}
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 max-w-xs">
          <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 text-left">{errorDetails.suggestion}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onScan && (
            <Button onClick={onScan} className="rounded-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'no-issues') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center animate-fade-in bg-background">
        <CheckCircleIcon />
        <h2 className="text-h1 text-foreground mt-4 mb-2">No Issues Found!</h2>
        <p className="text-body text-muted-foreground max-w-xs mb-4">
          This page passed all accessibility checks. Great job!
        </p>
        {onScan && (
          <Button variant="secondary" onClick={onScan} className="rounded-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Scan Again
          </Button>
        )}
      </div>
    );
  }

  // Initial state
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <EyeIcon />
      <h2 className="text-h1 text-foreground mt-2 mb-2">Ready to Scan</h2>
      <p className="text-body text-muted-foreground max-w-xs">
        Scan your page to find and fix accessibility issues
      </p>
    </div>
  );
}
