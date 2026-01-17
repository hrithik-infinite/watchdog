import { RefreshCw } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { EyeIcon, CheckCircleIcon, ErrorCircleIcon } from './icons';

interface EmptyStateProps {
  type: 'initial' | 'no-issues' | 'error';
  error?: string;
  onScan?: () => void;
}

export default function EmptyState({ type, error, onScan }: EmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-background">
        <ErrorCircleIcon />
        <h2 className="text-h1 text-foreground mt-6 mb-2">Scan Failed</h2>
        <p className="text-body text-muted-foreground max-w-xs mb-6">
          {error || 'An error occurred while scanning the page'}
        </p>
        {onScan && (
          <Button onClick={onScan} className="rounded-full">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (type === 'no-issues') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-background">
        <CheckCircleIcon />
        <h2 className="text-h1 text-foreground mt-6 mb-2">No Issues Found!</h2>
        <p className="text-body text-muted-foreground max-w-xs mb-6">
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
      <h2 className="text-h1 text-foreground mt-6 mb-2">Ready to Scan</h2>
      <p className="text-body text-muted-foreground max-w-xs">
        Scan your page to find and fix accessibility issues
      </p>
    </div>
  );
}
