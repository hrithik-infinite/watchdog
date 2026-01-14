import { EyeIcon, CheckCircleIcon, ErrorCircleIcon, RefreshIcon } from './icons';

interface EmptyStateProps {
  type: 'initial' | 'no-issues' | 'error';
  error?: string;
  onScan?: () => void;
}

export default function EmptyState({ type, error, onScan }: EmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#1C1C1E]">
        <ErrorCircleIcon />
        <h2 className="text-h1 text-white mt-6 mb-2">Scan Failed</h2>
        <p className="text-body text-[#8E8E93] max-w-xs mb-6">
          {error || 'An error occurred while scanning the page'}
        </p>
        {onScan && (
          <button
            onClick={onScan}
            className="px-6 py-3 bg-[#007AFF] hover:bg-[#0056B3] text-white font-medium rounded-full transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (type === 'no-issues') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#1C1C1E]">
        <CheckCircleIcon />
        <h2 className="text-h1 text-white mt-6 mb-2">No Issues Found!</h2>
        <p className="text-body text-[#8E8E93] max-w-xs mb-6">
          This page passed all accessibility checks. Great job!
        </p>
        {onScan && (
          <button
            onClick={onScan}
            className="px-6 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#007AFF] font-medium rounded-full transition-colors flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Scan Again
          </button>
        )}
      </div>
    );
  }

  // Initial state
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <EyeIcon />
      <h2 className="text-h1 text-white mt-6 mb-2">Ready to Scan</h2>
      <p className="text-body text-[#8E8E93] max-w-xs">
        Scan your page to find and fix accessibility issues
      </p>
    </div>
  );
}
