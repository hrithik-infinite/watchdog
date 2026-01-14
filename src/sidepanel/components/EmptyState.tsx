interface EmptyStateProps {
  type: 'initial' | 'no-issues' | 'error';
  error?: string;
  onScan?: () => void;
}

function EyeIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {/* Outer glow */}
      <ellipse cx="60" cy="60" rx="50" ry="35" fill="#007AFF" fillOpacity="0.1" />
      {/* Eye shape */}
      <ellipse cx="60" cy="60" rx="45" ry="30" fill="#66B2FF" />
      {/* Iris */}
      <circle cx="60" cy="60" r="20" fill="#007AFF" />
      {/* Pupil */}
      <circle cx="60" cy="60" r="8" fill="#1C1C1E" />
      {/* Highlight */}
      <circle cx="55" cy="55" r="4" fill="white" fillOpacity="0.6" />
      {/* Magnifier */}
      <circle cx="85" cy="80" r="15" stroke="#66B2FF" strokeWidth="4" fill="#1C1C1E" />
      <line x1="96" y1="91" x2="108" y2="103" stroke="#66B2FF" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="#00C7BE" fillOpacity="0.2" />
      <circle cx="60" cy="60" r="40" fill="#00C7BE" fillOpacity="0.3" />
      <path
        d="M45 60L55 70L75 50"
        stroke="#00C7BE"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="#FF3B30" fillOpacity="0.2" />
      <circle cx="60" cy="60" r="40" fill="#FF3B30" fillOpacity="0.3" />
      <path
        d="M60 40V65"
        stroke="#FF3B30"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="60" cy="80" r="4" fill="#FF3B30" />
    </svg>
  );
}

export default function EmptyState({ type, error, onScan }: EmptyStateProps) {
  if (type === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#1C1C1E]">
        <ErrorIcon />
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
        <CheckIcon />
        <h2 className="text-h1 text-white mt-6 mb-2">No Issues Found!</h2>
        <p className="text-body text-[#8E8E93] max-w-xs mb-6">
          This page passed all accessibility checks. Great job!
        </p>
        {onScan && (
          <button
            onClick={onScan}
            className="px-6 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#007AFF] font-medium rounded-full transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
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
