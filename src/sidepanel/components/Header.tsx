import { WatchDogLogo, SettingsIcon } from './icons';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1C1C1E]">
      <div className="flex items-center gap-2">
        <WatchDogLogo />
        <h1 className="text-lg font-semibold text-white">WatchDog</h1>
      </div>

      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="p-2 text-[#8E8E93] hover:text-white hover:bg-[#3A3A3C] rounded-lg transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      )}
    </header>
  );
}
