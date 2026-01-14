interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4 bg-[#1C1C1E] border-b border-[#2C2C2E]">
      <div className="flex items-center gap-3">
        {/* WatchDog Eye Logo */}
        <div className="relative">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="drop-shadow-[0_0_8px_rgba(0,122,255,0.5)]">
            <circle cx="16" cy="16" r="14" fill="#007AFF" fillOpacity="0.15" />
            <ellipse cx="16" cy="16" rx="12" ry="8" fill="#4099FF" />
            <circle cx="16" cy="16" r="5" fill="#007AFF" />
            <circle cx="16" cy="16" r="2" fill="#1C1C1E" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">WatchDog</h1>
      </div>

      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="p-2 text-[#8E8E93] hover:text-white hover:bg-[#3A3A3C] rounded-lg transition-colors"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}
    </header>
  );
}
