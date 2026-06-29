/**
 * First-run onboarding (ux-public-1 / cws-5).
 *
 * Shown once, gated on `settings.hasSeenOnboarding`, before the first scan. Its
 * jobs: a one-sentence pitch, a privacy reassurance (everything is local), a
 * persona choice that seeds the Site-owner vs Developer experience, and a single
 * primary CTA. Built as an accessible radiogroup because WatchDog must pass the
 * audit it ships.
 */

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ShieldCheck, Store, Code2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';
import type { Persona } from '@/shared/types';

interface OnboardingProps {
  /** Called with the chosen persona when the user finishes the tour. */
  onComplete: (persona: Persona) => void;
}

interface PersonaOption {
  value: Persona;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    value: 'site-owner',
    label: 'I own or manage a website',
    description: 'Plain-language results and fixes, no jargon.',
    icon: Store,
  },
  {
    value: 'developer',
    label: "I'm a developer",
    description: 'Full technical detail, code fixes, and dev exports.',
    icon: Code2,
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  // Site-owner is preselected so the primary CTA works without a forced choice,
  // matching the chosen default persona.
  const [selected, setSelected] = useState<Persona>('site-owner');
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = PERSONA_OPTIONS.findIndex((o) => o.value === selected);

  // Roving tabindex + arrow-key navigation for the persona radiogroup.
  const handleRadioKeyDown = (event: ReactKeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % PERSONA_OPTIONS.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + PERSONA_OPTIONS.length) % PERSONA_OPTIONS.length;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    setSelected(PERSONA_OPTIONS[nextIndex].value);
    radioRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="h-screen flex flex-col bg-bg-dark">
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col">
        {/* Pitch */}
        <div className="text-center mb-6">
          <h1 className="text-h1 text-foreground mb-2">Welcome to WatchDog</h1>
          <p className="text-body text-muted-foreground max-w-xs mx-auto">
            Check any web page for accessibility, performance, SEO, security, and more — in one
            click.
          </p>
        </div>

        {/* Privacy reassurance */}
        <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 text-left">
            Everything runs in your browser. Nothing about the pages you scan is uploaded.
          </p>
        </div>

        {/* Persona choice */}
        <div className="mb-2">
          <p id="onboarding-persona-label" className="text-h3 text-foreground mb-1">
            How should we show results?
          </p>
          <p className="text-sm text-muted-foreground mb-3">You can change this anytime in Settings.</p>

          <div role="radiogroup" aria-labelledby="onboarding-persona-label" className="space-y-2.5">
            {PERSONA_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isSelected = selected === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={index === activeIndex ? 0 : -1}
                  ref={(el) => {
                    radioRefs.current[index] = el;
                  }}
                  onClick={() => setSelected(option.value)}
                  onKeyDown={(event) => handleRadioKeyDown(event, index)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3.5 py-3 rounded-lg border-2 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-border hover:bg-muted/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 mt-0.5',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground block">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="px-5 py-4 border-t border-border bg-card/50">
        <Button
          onClick={() => onComplete(selected)}
          className="w-full py-3 text-base font-semibold rounded-lg gap-2"
        >
          Start checking
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
