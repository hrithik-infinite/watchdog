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
  // The single most useful piece of context — which page is being audited — was
  // never shown. Surface the host under the title when there are results.
  let host = '';
  if (scanResult?.url) {
    try {
      host = new URL(scanResult.url).host;
    } catch {
      host = scanResult.url;
    }
  }

  return (
    <header className="flex items-center justify-between gap-2 p-2 bg-background border-b border-border">
      <div className="flex items-center gap-2 min-w-0">
        {showBackButton && onBackClick ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            aria-label="Back to audit selector"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <WatchDogLogo />
        )}
        <div className="min-w-0 leading-tight">
          <h1 className="text-h2 text-foreground">WatchDog</h1>
          {host && <p className="text-xs text-muted-foreground truncate">{host}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
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
