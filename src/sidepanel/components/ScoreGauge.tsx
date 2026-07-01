/**
 * ScoreGauge component
 * Displays a circular score gauge similar to Lighthouse
 */

import { useEffect, useRef, useState } from 'react';
import type { ScoreResult } from '@/shared/scoring';
import { cn } from '@/sidepanel/lib/utils';

interface ScoreGaugeProps {
  scoreResult: ScoreResult;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
  // 'score' colors the ring/number by grade (Lighthouse-style). 'neutral'
  // renders a grey ring + neutral number — the verdict is then carried by an
  // adjacent word, so the score isn't communicated by color alone.
  tone?: 'score' | 'neutral';
}

const SIZE_CONFIG = {
  sm: {
    container: 'w-16 h-16',
    strokeWidth: 4,
    radius: 28,
    fontSize: 'text-lg',
    labelSize: 'text-[8px]',
  },
  md: {
    container: 'w-24 h-24',
    strokeWidth: 5,
    radius: 42,
    fontSize: 'text-2xl',
    labelSize: 'text-xs',
  },
  lg: {
    container: 'w-32 h-32',
    strokeWidth: 6,
    radius: 56,
    fontSize: 'text-4xl',
    labelSize: 'text-xs',
  },
};

export default function ScoreGauge({
  scoreResult,
  size = 'md',
  showLabel = true,
  animate = true,
  className,
  tone = 'score',
}: ScoreGaugeProps) {
  const ringColor = tone === 'neutral' ? 'var(--color-muted-foreground)' : scoreResult.color;
  const [animatedScore, setAnimatedScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const config = SIZE_CONFIG[size];

  // Determine the score to display: animated value or actual score
  const displayScore = animate ? animatedScore : scoreResult.score;

  // Animate score on mount (only when animate is true)
  useEffect(() => {
    if (!animate) {
      return;
    }

    // Respect reduced-motion: the global CSS reduced-motion block cannot reach
    // this requestAnimationFrame loop, so gate it explicitly and render the
    // final score instantly. (WCAG 2.2.2 / 2.3.3 — the tool must not animate
    // when the user asked it not to.)
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimatedScore(scoreResult.score);
      return;
    }

    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startScore = 0;
    const endScore = scoreResult.score;

    const runAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - (1 - progress) ** 3;
      const currentScore = Math.round(startScore + (endScore - startScore) * eased);

      setAnimatedScore(currentScore);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(runAnimation);
      }
    };

    animationRef.current = requestAnimationFrame(runAnimation);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scoreResult.score, animate]);

  // Calculate SVG circle properties
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Determine viewBox based on size
  const viewBoxSize = (config.radius + config.strokeWidth) * 2;
  const center = viewBoxSize / 2;

  // Accessible name describing the gauge. Uses the actual (non-animated) score
  // so the announced value stays stable, plus the human-readable label/grade.
  const ariaLabel = `Score: ${scoreResult.score} out of 100, ${scoreResult.label}`;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative', config.container)}>
        <svg
          role="img"
          aria-label={ariaLabel}
          className="transform -rotate-90 w-full h-full"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-border"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={config.radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: animate ? 'none' : 'stroke-dashoffset 0.5s ease-out',
            }}
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              config.fontSize,
              tone === 'neutral' && 'text-foreground'
            )}
            style={tone === 'neutral' ? undefined : { color: scoreResult.color }}
          >
            {displayScore}
          </span>
        </div>
      </div>

      {/* Label below gauge */}
      {showLabel && (
        <span
          className={cn('font-medium uppercase tracking-wider', config.labelSize)}
          style={{ color: scoreResult.color }}
        >
          {scoreResult.label}
        </span>
      )}
    </div>
  );
}
