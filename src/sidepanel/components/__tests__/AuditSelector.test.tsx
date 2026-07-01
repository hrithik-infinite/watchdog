import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, MVP_RULES } from '@/shared/constants';
import { AUDIT_ONE_LINERS } from '@/sidepanel/lib/persona';
import { useScanStore } from '@/sidepanel/store';
import AuditSelector from '../AuditSelector';

function renderSelector({ isScanning = false } = {}) {
  return render(
    <AuditSelector onStartScan={vi.fn()} onStartMultipleScan={vi.fn()} isScanning={isScanning} />
  );
}

// The settings store defaults to the site-owner persona; reset to it before each
// test so persona-sensitive behaviour starts from a known baseline.
beforeEach(() => {
  useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

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

  it('renders the per-audit info control as a focusable button outside the card', async () => {
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

    // It is genuinely keyboard-reachable. Focusing the trigger opens its Radix
    // tooltip, which fires async Presence/Popper positioning updates — do it
    // inside act and wait for the tooltip to finish opening so none of that
    // state settles after the test.
    await act(async () => {
      infoButton.focus();
    });
    expect(infoButton).toHaveFocus();
    await screen.findByRole('tooltip');
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

describe('AuditSelector default selection (ux-public-9)', () => {
  it('selects all six audits by default in site-owner mode', () => {
    renderSelector();

    const cards = screen.getAllByRole('checkbox');
    // All six audits start selected so a site owner gets a broad health check.
    expect(cards).toHaveLength(6);
    expect(cards.every((card) => card.getAttribute('aria-checked') === 'true')).toBe(true);
  });

  it('selects accessibility only by default in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderSelector();

    const cards = screen.getAllByRole('checkbox');
    const checked = cards.filter((card) => card.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName(/Accessibility audit/);
  });
});

describe('AuditSelector persona copy (ux-public-8)', () => {
  it('leads with the plain benefit one-liner in site-owner mode', () => {
    renderSelector();

    // Plain one-liner replaces the jargon description on the card face.
    expect(screen.getByText(AUDIT_ONE_LINERS.accessibility)).toBeInTheDocument();
    expect(screen.queryByText('WCAG compliance & screen reader support')).not.toBeInTheDocument();
  });

  it('keeps the jargon description on the card in developer mode', () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
    renderSelector();

    expect(screen.getByText('WCAG compliance & screen reader support')).toBeInTheDocument();
    expect(screen.queryByText(AUDIT_ONE_LINERS.accessibility)).not.toBeInTheDocument();
  });
});
