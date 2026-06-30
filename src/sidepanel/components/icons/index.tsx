import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// WatchDog brand mark — "icon 2b" from the Claude Design logo notebook: a solid
// front-facing hound silhouette with cut-out eyes and nose (one evenodd path so
// the eyes/nose are true holes). Rendered in the brand accent for the header
// lockup; the same path drives the install icons (scripts/generate-icons.js).
const HOUND_2B =
  'M6.5 8.8 L4.5 3.1 L10.2 6.1 L13.8 6.1 L19.5 3.1 L17.5 8.8 C18.7 11 18.6 13.9 16.9 16.1 C15.5 17.9 13.9 19.2 12 19.2 C10.1 19.2 8.5 17.9 7.1 16.1 C5.4 13.9 5.3 11 6.5 8.8 Z M8.45 12.4 a1.15 1.15 0 1 0 2.3 0 a1.15 1.15 0 1 0 -2.3 0 Z M13.25 12.4 a1.15 1.15 0 1 0 2.3 0 a1.15 1.15 0 1 0 -2.3 0 Z M10.65 15.2 a1.35 1.35 0 1 0 2.7 0 a1.35 1.35 0 1 0 -2.7 0 Z';

export function WatchDogLogo(props: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#3D9BFF" aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d={HOUND_2B} />
    </svg>
  );
}

// Large Eye Icon for Empty State
export function EyeIcon(props: IconProps) {
  return (
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" aria-hidden="true" {...props}>
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
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" aria-hidden="true" {...props}>
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
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" aria-hidden="true" {...props}>
      <circle cx="60" cy="60" r="50" fill="#FF3B30" fillOpacity="0.2" />
      <circle cx="60" cy="60" r="40" fill="#FF3B30" fillOpacity="0.3" />
      <path d="M60 40V65" stroke="#FF3B30" strokeWidth="6" strokeLinecap="round" />
      <circle cx="60" cy="80" r="4" fill="#FF3B30" />
    </svg>
  );
}

// GitHub mark. lucide-react 1.0 removed all trademarked brand icons, so we ship
// the mark ourselves as a filled, currentColor SVG that sizes via className
// (e.g. `h-4 w-4`) — a drop-in for the lucide icon it replaces.
export function GithubIcon(props: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
