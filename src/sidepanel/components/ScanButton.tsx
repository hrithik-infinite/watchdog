import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';

interface ScanButtonProps {
  isScanning: boolean;
  onScan: () => void;
  hasResults?: boolean;
}

export default function ScanButton({ isScanning, onScan, hasResults = false }: ScanButtonProps) {
  return (
    <Button
      onClick={onScan}
      disabled={isScanning}
      size="lg"
      className="w-full py-6 text-lg font-semibold rounded-full shadow-lg shadow-primary/25"
    >
      {isScanning ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Scanning...
        </>
      ) : (
        <>
          {hasResults && <RefreshCw className="h-5 w-5" />}
          {hasResults ? 'Rescan Page' : 'Start Scan'}
        </>
      )}
    </Button>
  );
}
