import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';

interface ScanButtonProps {
  isScanning: boolean;
  onScan: () => void;
  hasResults?: boolean;
}

export default function ScanButton({ isScanning, onScan, hasResults = false }: ScanButtonProps) {
  return (
    <Button onClick={() => onScan()} disabled={isScanning} className="w-full font-semibold">
      {isScanning ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning...
        </>
      ) : (
        <>
          {hasResults && <RefreshCw className="h-4 w-4" />}
          {hasResults ? 'Rescan Page' : 'Start Scan'}
        </>
      )}
    </Button>
  );
}
