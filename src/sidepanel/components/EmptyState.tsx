interface EmptyStateProps {
  type: 'initial' | 'no-issues' | 'error';
  error?: string;
  onScan?: () => void;
}

export default function EmptyState({ type, error, onScan }: EmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center animate-fade-in">
        <div>
          <svg
            className="w-16 h-16 mx-auto text-red-300 dark:text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Scan Failed</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || 'An error occurred while scanning'}</p>
          {onScan && (
            <button
              onClick={onScan}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'no-issues') {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center animate-fade-in">
        <div>
          <svg
            className="w-16 h-16 mx-auto text-green-300 dark:text-green-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Issues Found!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This page passed all accessibility checks.
          </p>
        </div>
      </div>
    );
  }

  // Initial state
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-fade-in">
      <div>
        <svg
          className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Scan</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click the button above to scan this page for accessibility issues.
        </p>
      </div>
    </div>
  );
}
