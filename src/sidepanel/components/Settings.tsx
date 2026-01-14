import type { Settings as SettingsType, WCAGLevel } from '@/shared/types';
import { useTheme } from '../hooks/useTheme';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: Partial<SettingsType>) => void;
  onClose: () => void;
}

type Theme = 'light' | 'dark' | 'system';

export default function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  const wcagLevels: WCAGLevel[] = ['A', 'AA', 'AAA'];
  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Choose your preferred color scheme.
          </p>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  theme === t.value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* WCAG Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            WCAG Conformance Level
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Filter issues based on WCAG conformance level requirements.
          </p>
          <div className="flex gap-2">
            {wcagLevels.map((level) => (
              <button
                key={level}
                onClick={() => onUpdate({ wcagLevel: level })}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  settings.wcagLevel === level
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>

        {/* Show Incomplete */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Incomplete Issues
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Include issues that need manual review.
            </p>
          </div>
          <button
            onClick={() => onUpdate({ showIncomplete: !settings.showIncomplete })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.showIncomplete ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={settings.showIncomplete}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.showIncomplete ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Auto Highlight */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-highlight on Hover
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Highlight elements when hovering over issues.
            </p>
          </div>
          <button
            onClick={() => onUpdate({ autoHighlight: !settings.autoHighlight })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.autoHighlight ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={settings.autoHighlight}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.autoHighlight ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          WatchDog v1.0.0
        </p>
      </div>
    </div>
  );
}
