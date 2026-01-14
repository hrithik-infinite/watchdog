interface ScanButtonProps {
  isScanning: boolean;
  onScan: () => void;
  hasResults?: boolean;
}

export default function ScanButton({ isScanning, onScan, hasResults = false }: ScanButtonProps) {
  return (
    <button
      onClick={onScan}
      disabled={isScanning}
      className="w-full py-4 px-6 bg-[#007AFF] hover:bg-[#0056B3] disabled:bg-[#007AFF]/50 text-white text-lg font-semibold rounded-full transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#007AFF]/25"
    >
      {isScanning ? (
        <>
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Scanning...
        </>
      ) : (
        <>
          {hasResults && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          {hasResults ? 'Rescan Page' : 'Start Scan'}
        </>
      )}
    </button>
  );
}
