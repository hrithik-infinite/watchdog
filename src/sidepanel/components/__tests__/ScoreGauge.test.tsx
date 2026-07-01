import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScoreResult } from '@/shared/scoring';
import ScoreGauge from '../ScoreGauge';

const mockScoreResult: ScoreResult = {
  score: 82,
  grade: 'B',
  color: '#64DD17',
  label: 'Good',
};

describe('ScoreGauge Accessibility', () => {
  it('exposes the gauge as an image with an accessible name', () => {
    render(<ScoreGauge scoreResult={mockScoreResult} animate={false} />);

    const gauge = screen.getByRole('img');
    expect(gauge).toBeInTheDocument();
  });

  it('includes the numeric score and label in the aria-label', () => {
    render(<ScoreGauge scoreResult={mockScoreResult} animate={false} />);

    const gauge = screen.getByRole('img');
    const label = gauge.getAttribute('aria-label') ?? '';

    expect(label).toContain('82');
    expect(label).toContain('out of 100');
    expect(label).toContain('Good');
  });

  it('uses the actual score (not the animated value) for the accessible name', () => {
    // Even with animation enabled the announced score should be the final value.
    render(<ScoreGauge scoreResult={mockScoreResult} animate />);

    const gauge = screen.getByRole('img');
    expect(gauge).toHaveAttribute('aria-label', 'Score: 82 out of 100, Good');
  });
});
