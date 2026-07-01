/**
 * First-run onboarding (ux-public-1 / cws-5).
 *
 * Shown once, gated on `settings.hasSeenOnboarding`, before the first scan. Its
 * jobs: a one-sentence pitch, a privacy reassurance (everything is local), a
 * persona choice that seeds the Site-owner vs Developer experience, and a single
 * primary CTA. Built as an accessible radiogroup because WatchDog must pass the
 * audit it ships.
 */

import { Check, Code2, ShieldCheck, Store } from 'lucide-react';
import { type KeyboardEvent as ReactKeyboardEvent, useRef, useState } from 'react';
import type { Persona } from '@/shared/types';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';

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
    description: 'Plain-language results and step-by-step fixes. Audits everything by default.',
    icon: Store,
  },
  {
    value: 'developer',
    label: "I'm a developer",
    description:
      'Full technical detail, code previews and developer exports. Starts with Accessibility.',
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
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col">
        {/* Pitch */}
        <div className="mb-6">
          <h1 className="text-h1 text-foreground mb-2">Audit any site, right where you work.</h1>
          <p className="text-body text-muted-foreground">
            Check accessibility, performance, SEO, security and more — and get plain-language steps
            to fix what it finds.
          </p>
        </div>

        {/* Privacy reassurance */}
        <div className="flex items-start gap-3 bg-muted border border-border rounded-xl p-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="text-caption uppercase text-muted-foreground">Private by design</p>
            <p className="text-sm text-foreground">
              Everything runs in your browser. Nothing about the pages you scan is uploaded.
            </p>
          </div>
        </div>

        {/* Persona choice */}
        <div className="mb-2">
          <p id="onboarding-persona-label" className="text-h3 text-foreground mb-3">
            How should WatchDog talk to you?
          </p>

          <div role="radiogroup" aria-labelledby="onboarding-persona-label" className="space-y-2">
            {PERSONA_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isSelected = selected === option.value;
              return (
                // biome-ignore lint/a11y/useSemanticElements: custom radio — a styled button with roving tabindex + aria-checked that a native input can't replicate
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
                    'w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  )}
                >
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-muted shrink-0">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground block">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="px-5 py-4 border-t border-border bg-card">
        <Button
          onClick={() => onComplete(selected)}
          className="w-full py-3 text-base font-semibold rounded-lg gap-2"
        >
          Continue
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          You can change this any time in Settings.
        </p>
      </div>
    </div>
  );
}
