import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings as SettingsType } from '@/shared/types';
import { axe } from '@/test/a11y';
import Settings from '../Settings';

const baseSettings: SettingsType = {
  persona: 'site-owner',
  hasSeenOnboarding: true,
  wcagLevel: 'AA',
  showIncomplete: false,
  autoHighlight: true,
  visionMode: 'none',
  showFocusOrder: false,
};

function renderSettings(overrides: Partial<SettingsType> = {}) {
  const onUpdate = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <Settings settings={{ ...baseSettings, ...overrides }} onUpdate={onUpdate} onClose={onClose} />
  );
  return { onUpdate, onClose, ...utils };
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regression guard for the a11y fix: the three Switch controls and the two
  // Select triggers render as buttons; their visible <Label> is now associated
  // via aria-labelledby, so every control has a discernible accessible name and
  // the whole Settings tree is violation-free. (Before the fix this reported a
  // critical `button-name` violation — see Settings.tsx.)
  it('has no accessibility violations across the whole settings view', async () => {
    const { container } = renderSettings();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('gives every switch and select an accessible name via its visible label', () => {
    renderSettings();
    expect(screen.getByRole('switch', { name: /show incomplete issues/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /auto-highlight on hover/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /focus order visualization/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /color vision deficiency/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /low vision \(blur\)/i })).toBeInTheDocument();
  });

  it('renders the title and version footer', () => {
    renderSettings();
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/watchdog v1\.0\.1/i)).toBeInTheDocument();
  });

  describe('persona (Experience)', () => {
    it('marks the active persona as pressed and shows its description', () => {
      renderSettings({ persona: 'site-owner' });
      const siteOwner = screen.getByRole('button', { name: 'Site owner' });
      const developer = screen.getByRole('button', { name: 'Developer' });
      expect(siteOwner).toHaveAttribute('aria-pressed', 'true');
      expect(developer).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText(/plain-language results/i)).toBeInTheDocument();
    });

    it('keeps the Experience consequence line when developer is active', () => {
      renderSettings({ persona: 'developer' });
      expect(screen.getByRole('button', { name: 'Developer' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByText(/switch to developer/i)).toBeInTheDocument();
    });

    it('fires onUpdate with the chosen persona', () => {
      const { onUpdate } = renderSettings({ persona: 'site-owner' });
      fireEvent.click(screen.getByRole('button', { name: 'Developer' }));
      expect(onUpdate).toHaveBeenCalledWith({ persona: 'developer' });
    });
  });

  describe('WCAG level', () => {
    it('marks the active level as pressed', () => {
      renderSettings({ wcagLevel: 'AA' });
      // The segmented control renders A / AA / AAA; the active level is pressed.
      expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'AAA' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'AA' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('fires onUpdate for each level selection', () => {
      const { onUpdate } = renderSettings({ wcagLevel: 'AA' });
      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      expect(onUpdate).toHaveBeenCalledWith({ wcagLevel: 'A' });

      fireEvent.click(screen.getByRole('button', { name: 'AAA' }));
      expect(onUpdate).toHaveBeenCalledWith({ wcagLevel: 'AAA' });
    });
  });

  describe('toggle switches', () => {
    // DOM order: [showIncomplete, autoHighlight, showFocusOrder]
    it('reflects the checked state from settings', () => {
      renderSettings({ showIncomplete: true, autoHighlight: false, showFocusOrder: true });
      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toBeChecked(); // showIncomplete
      expect(switches[1]).not.toBeChecked(); // autoHighlight
      expect(switches[2]).toBeChecked(); // showFocusOrder
    });

    it('fires onUpdate when toggling Show Incomplete', () => {
      const { onUpdate } = renderSettings({ showIncomplete: false });
      fireEvent.click(screen.getAllByRole('switch')[0]);
      expect(onUpdate).toHaveBeenCalledWith({ showIncomplete: true });
    });

    it('fires onUpdate when toggling Auto-highlight', () => {
      const { onUpdate } = renderSettings({ autoHighlight: true });
      fireEvent.click(screen.getAllByRole('switch')[1]);
      expect(onUpdate).toHaveBeenCalledWith({ autoHighlight: false });
    });

    it('persists focus-order via the page-overlay hook (not the onUpdate prop)', () => {
      const { onUpdate } = renderSettings({ showFocusOrder: false });
      fireEvent.click(screen.getAllByRole('switch')[2]);
      // showFocusOrder is routed through usePageOverlays -> persist, which messages
      // the background to save the preference rather than calling onUpdate.
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { showFocusOrder: true },
      });
      expect(onUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ showFocusOrder: expect.anything() })
      );
    });
  });

  describe('vision-mode selects', () => {
    it('shows None for both selects when visionMode is none', () => {
      renderSettings({ visionMode: 'none' });
      expect(screen.getAllByText('None').length).toBeGreaterThanOrEqual(2);
    });

    it('reflects an active color-vision mode in the colorblind select', () => {
      renderSettings({ visionMode: 'protanopia' });
      expect(screen.getByText('Protanopia')).toBeInTheDocument();
    });

    it('reflects an active blur mode in the blur select', () => {
      renderSettings({ visionMode: 'blur-high' });
      expect(screen.getByText('Severe Blur')).toBeInTheDocument();
    });
  });

  describe('navigation actions', () => {
    it('calls onClose when the Back button is clicked', () => {
      const { onClose } = renderSettings();
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('replays the welcome tour by resetting onboarding and closing', () => {
      const { onUpdate, onClose } = renderSettings();
      fireEvent.click(screen.getByRole('button', { name: /replay welcome tour/i }));
      expect(onUpdate).toHaveBeenCalledWith({ hasSeenOnboarding: false });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
