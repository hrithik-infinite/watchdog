import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatchDogLogo } from './icons';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-background border-b border-primary/10">
      <div className="flex items-center gap-2">
        <WatchDogLogo />
        <h1 className="text-h2 text-foreground">WatchDog</h1>
      </div>

      {onSettingsClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          aria-label="Settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}
    </header>
  );
}
