import { SpinnerIcon, RefreshIcon } from './icons';

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
          <SpinnerIcon className="w-5 h-5 animate-spin" />
          Scanning...
        </>
      ) : (
        <>
          {hasResults && <RefreshIcon className="w-5 h-5" />}
          {hasResults ? 'Rescan Page' : 'Start Scan'}
        </>
      )}
    </button>
  );
}
