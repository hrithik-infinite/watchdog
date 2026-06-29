import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import AuditSelector from '../AuditSelector';
import { MVP_RULES } from '@/shared/constants';

function renderSelector({ isScanning = false } = {}) {
  return render(
    <AuditSelector onStartScan={vi.fn()} onStartMultipleScan={vi.fn()} isScanning={isScanning} />
  );
}

describe('AuditSelector accessibility roles', () => {
  it('groups the audit cards under a labelled group', () => {
    renderSelector();

    const group = screen.getByRole('group', { name: 'Audit types' });
    expect(group).toBeInTheDocument();
    // Every audit card lives inside the group.
    expect(within(group).getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('exposes cards as checkboxes with aria-checked and without conflicting aria-pressed', () => {
    renderSelector();

    const cards = screen.getAllByRole('checkbox');
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(card).toHaveAttribute('aria-checked');
      expect(card).not.toHaveAttribute('aria-pressed');
    }
  });

  it('renders the per-audit info control as a focusable button outside the card', () => {
    renderSelector();

    const infoButton = screen.getByRole('button', {
      name: 'What the Accessibility audit checks and does not check',
    });
    expect(infoButton.tagName).toBe('BUTTON');
    expect(infoButton).not.toHaveAttribute('tabindex', '-1');

    // The info control must not be nested inside the card checkbox (invalid +
    // keyboard-unreachable). It is a sibling, so no checkbox contains it.
    const accessibilityCard = screen.getByRole('checkbox', {
      name: /Accessibility audit/,
    });
    expect(accessibilityCard.contains(infoButton)).toBe(false);

    // It is genuinely keyboard-reachable.
    infoButton.focus();
    expect(infoButton).toHaveFocus();
  });
});

describe('AuditSelector live rule count', () => {
  it('derives the accessibility check count from MVP_RULES instead of a stale literal', () => {
    renderSelector();

    expect(screen.getByText(`${MVP_RULES.length} checks`)).toBeInTheDocument();
    // Guard against a regression back to the old hard-coded "15 checks" value.
    expect(MVP_RULES.length).not.toBe(15);
  });
});
