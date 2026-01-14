interface ScanButtonProps {
  isScanning: boolean;
  onScan: () => void;
}

export default function ScanButton({ isScanning, onScan }: ScanButtonProps) {
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
        'Start Scan'
      )}
    </button>
  );
}
