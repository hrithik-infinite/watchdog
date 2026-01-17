/**
 * ScoreGauge component
 * Displays a circular score gauge similar to Lighthouse
 */

import { useEffect, useState } from 'react';
import type { ScoreResult } from '@/shared/scoring';
import { cn } from '@/sidepanel/lib/utils';

interface ScoreGaugeProps {
  scoreResult: ScoreResult;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
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
    labelSize: 'text-[10px]',
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
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : scoreResult.score);
  const config = SIZE_CONFIG[size];

  // Animate score on mount
  useEffect(() => {
    if (!animate) {
      setDisplayScore(scoreResult.score);
      return;
    }

    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startScore = 0;
    const endScore = scoreResult.score;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (endScore - startScore) * eased);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [scoreResult.score, animate]);

  // Calculate SVG circle properties
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Determine viewBox based on size
  const viewBoxSize = (config.radius + config.strokeWidth) * 2;
  const center = viewBoxSize / 2;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative', config.container)}>
        <svg
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
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={config.radius}
            fill="none"
            stroke={scoreResult.color}
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
            className={cn('font-bold tabular-nums', config.fontSize)}
            style={{ color: scoreResult.color }}
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
