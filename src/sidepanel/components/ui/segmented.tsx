import { cn } from '@/sidepanel/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group (e.g. "Experience mode"). */
  ariaLabel?: string;
  className?: string;
}

/**
 * Segmented control — a single inset track holding 2–3 mutually-exclusive
 * segments, the active one raised. Used for the persona and WCAG-level pickers
 * in Settings. Built as an aria-pressed button group; focus uses the global
 * outline. Active state reads by raised surface + accent text (not color alone —
 * the raised fill is the primary signal).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: toggle-button group (aria-pressed), not a radiogroup — values are applied immediately
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border bg-input p-1',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 h-8 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-primary shadow-[var(--shadow-elev-1)]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
