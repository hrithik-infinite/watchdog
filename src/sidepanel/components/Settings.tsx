import type { Settings as SettingsType, WCAGLevel } from '@/shared/types';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: Partial<SettingsType>) => void;
  onClose: () => void;
}

export default function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  const wcagLevels: WCAGLevel[] = ['A', 'AA', 'AAA'];

  return (
    <div className="h-full flex flex-col bg-[#1C1C1E]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#3A3A3C]">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[#007AFF] hover:text-[#66B2FF] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
      </div>

      <div className="px-4 py-4 border-b border-[#3A3A3C]">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* WCAG Level */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            WCAG Conformance Level
          </label>
          <p className="text-xs text-[#8E8E93] mb-3">
            Filter issues based on WCAG conformance level requirements.
          </p>
          <div className="flex gap-2">
            {wcagLevels.map((level) => (
              <button
                key={level}
                onClick={() => onUpdate({ wcagLevel: level })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  settings.wcagLevel === level
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C] hover:text-white'
                }`}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>

        {/* Show Incomplete */}
        <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-lg">
          <div>
            <label className="block text-sm font-medium text-white">
              Show Incomplete Issues
            </label>
            <p className="text-xs text-[#8E8E93] mt-1">
              Include issues that need manual review.
            </p>
          </div>
          <button
            onClick={() => onUpdate({ showIncomplete: !settings.showIncomplete })}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              settings.showIncomplete ? 'bg-[#007AFF]' : 'bg-[#3A3A3C]'
            }`}
            role="switch"
            aria-checked={settings.showIncomplete}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.showIncomplete ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Auto Highlight */}
        <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-lg">
          <div>
            <label className="block text-sm font-medium text-white">
              Auto-highlight on Hover
            </label>
            <p className="text-xs text-[#8E8E93] mt-1">
              Highlight elements when hovering over issues.
            </p>
          </div>
          <button
            onClick={() => onUpdate({ autoHighlight: !settings.autoHighlight })}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              settings.autoHighlight ? 'bg-[#007AFF]' : 'bg-[#3A3A3C]'
            }`}
            role="switch"
            aria-checked={settings.autoHighlight}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.autoHighlight ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#3A3A3C]">
        <p className="text-xs text-[#8E8E93] text-center">
          WatchDog v1.0.0
        </p>
      </div>
    </div>
  );
}
