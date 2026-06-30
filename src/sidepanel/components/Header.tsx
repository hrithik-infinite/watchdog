import { ArrowLeft, Settings } from 'lucide-react';
import type { ScanResult } from '@/shared/types';
import { Button } from '@/sidepanel/components/ui/button';
import ExportButton from './ExportButton';
import { WatchDogLogo } from './icons';

interface HeaderProps {
  onSettingsClick?: () => void;
  onBackClick?: () => void;
  scanResult?: ScanResult | null;
  showBackButton?: boolean;
}

export default function Header({
  onSettingsClick,
  onBackClick,
  scanResult,
  showBackButton = false,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-2 bg-background border-b border-primary/10">
      <div className="flex items-center gap-2">
        {showBackButton && onBackClick ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            aria-label="Back to audit selector"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <WatchDogLogo />
        )}
        <h1 className="text-h2 text-foreground">WatchDog</h1>
      </div>

      <div className="flex items-center gap-1">
        {scanResult && <ExportButton scanResult={scanResult} />}
        {onSettingsClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            aria-label="Settings"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
