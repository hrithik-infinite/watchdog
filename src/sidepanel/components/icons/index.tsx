import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// WatchDog Logo - Main branding icon
export function WatchDogLogo(props: IconProps) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <circle cx="16" cy="16" r="14" fill="#007AFF" fillOpacity="0.2" />
      <ellipse cx="16" cy="16" rx="12" ry="8" fill="#66B2FF" />
      <circle cx="16" cy="16" r="5" fill="#007AFF" />
      <circle cx="16" cy="16" r="2" fill="#1C1C1E" />
      <circle cx="22" cy="20" r="4" stroke="#66B2FF" strokeWidth="2" fill="none" />
      <line
        x1="25"
        y1="23"
        x2="28"
        y2="26"
        stroke="#66B2FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Large Eye Icon for Empty State
export function EyeIcon(props: IconProps) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" {...props}>
      <ellipse cx="60" cy="60" rx="50" ry="35" fill="#007AFF" fillOpacity="0.1" />
      <ellipse cx="60" cy="60" rx="45" ry="30" fill="#66B2FF" />
      <circle cx="60" cy="60" r="20" fill="#007AFF" />
      <circle cx="60" cy="60" r="8" fill="#1C1C1E" />
      <circle cx="55" cy="55" r="4" fill="white" fillOpacity="0.6" />
      <circle cx="85" cy="80" r="15" stroke="#66B2FF" strokeWidth="4" fill="#1C1C1E" />
      <line
        x1="96"
        y1="91"
        x2="108"
        y2="103"
        stroke="#66B2FF"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Large Check Icon for Success State
export function CheckCircleIcon(props: IconProps) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" {...props}>
      <circle cx="60" cy="60" r="50" fill="#00C7BE" fillOpacity="0.2" />
      <circle cx="60" cy="60" r="40" fill="#00C7BE" fillOpacity="0.3" />
      <path
        d="M45 60L55 70L75 50"
        stroke="#00C7BE"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Large Error Icon for Error State
export function ErrorCircleIcon(props: IconProps) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" {...props}>
      <circle cx="60" cy="60" r="50" fill="#FF3B30" fillOpacity="0.2" />
      <circle cx="60" cy="60" r="40" fill="#FF3B30" fillOpacity="0.3" />
      <path d="M60 40V65" stroke="#FF3B30" strokeWidth="6" strokeLinecap="round" />
      <circle cx="60" cy="80" r="4" fill="#FF3B30" />
    </svg>
  );
}

// Settings Gear Icon
export function SettingsIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
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
  );
}

// Chevron Left Icon (Back Arrow)
export function ChevronLeftIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

// Chevron Right Icon (Next Arrow)
export function ChevronRightIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Chevron Down Icon (Dropdown Arrow)
export function ChevronDownIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Search Icon (Magnifier)
export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

// Spinner Icon (Loading)
export function SpinnerIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Refresh Icon (Rescan)
export function RefreshIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

// Warning Triangle Icon
export function WarningIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

// Check Icon (Small checkmark)
export function CheckIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Copy Icon
export function CopyIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

// Info Circle Icon
export function InfoIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// Eye View Icon (Highlight)
export function EyeViewIcon({ className, ...props }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
