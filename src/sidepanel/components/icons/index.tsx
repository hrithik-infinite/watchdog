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
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" {...props}>
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
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" {...props}>
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
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" {...props}>
      <circle cx="60" cy="60" r="50" fill="#FF3B30" fillOpacity="0.2" />
      <circle cx="60" cy="60" r="40" fill="#FF3B30" fillOpacity="0.3" />
      <path d="M60 40V65" stroke="#FF3B30" strokeWidth="6" strokeLinecap="round" />
      <circle cx="60" cy="80" r="4" fill="#FF3B30" />
    </svg>
  );
}
