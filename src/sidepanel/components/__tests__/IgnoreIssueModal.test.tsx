import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IgnoreIssueModal from '../IgnoreIssueModal';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Issue } from '@/shared/types';

// Keep the real reason labels, but stub the storage write so submitting does
// not hit chrome.storage during tests.
vi.mock('@/shared/storage', async (importActual) => {
  const actual = await importActual<typeof import('@/shared/storage')>();
  return {
    ...actual,
    ignoreIssue: vi.fn().mockResolvedValue(undefined),
  };
});

const mockIssue: Issue = {
  id: 'issue-1',
  ruleId: 'button-name',
  severity: 'serious',
  category: 'interactive',
  message: 'Button has no accessible name',
  description: 'Buttons must have discernible text',
  helpUrl: 'https://example.com/help',
  wcag: { id: '4.1.2', level: 'A', name: 'Name, Role, Value', description: '' },
  element: { selector: 'button.cta', html: '<button class="cta"></button>' },
  fix: { description: 'Add a label', code: '', learnMoreUrl: '' },
};

function renderModal(overrides: { onClose?: () => void; onIgnored?: () => void } = {}) {
  const onClose = overrides.onClose ?? vi.fn();
  const onIgnored = overrides.onIgnored ?? vi.fn();
  render(
    <IgnoreIssueModal
      issue={mockIssue}
      url="https://example.com"
      onClose={onClose}
      onIgnored={onIgnored}
    />
  );
  return { onClose, onIgnored };
}

describe('IgnoreIssueModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Store defaults to the Site-owner persona (DEFAULT_SETTINGS); reset it so
    // each test starts from a known persona.
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  describe('Dialog semantics', () => {
    it('exposes an accessible modal dialog', () => {
      renderModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('labels the dialog via aria-labelledby pointing at the title', () => {
      renderModal();

      // Accessible name is resolved from the referenced <h2> title. Site-owner is
      // the default persona, so the plain title is shown.
      expect(screen.getByRole('dialog', { name: 'Hide this issue' })).toBeInTheDocument();
    });

    it('gives the close control an accessible name', () => {
      renderModal();

      const close = screen.getByRole('button', { name: 'Close' });
      expect(close).toBeInTheDocument();
    });
  });

  describe('Keyboard behavior', () => {
    it('calls onClose when Escape is pressed', () => {
      const { onClose } = renderModal();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('focuses the first focusable element (close control) on open', () => {
      renderModal();

      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    });

    it('traps Tab focus inside the dialog', () => {
      renderModal();

      const dialog = screen.getByRole('dialog');
      const cancel = screen.getByRole('button', { name: 'Cancel' });

      // Move focus to the last focusable element, then Tab should wrap to first.
      cancel.focus();
      fireEvent.keyDown(dialog, { key: 'Tab' });

      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    });
  });

  describe('Reason radio group', () => {
    it('renders the reasons as a radio group', () => {
      renderModal();

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(5);
    });

    it('marks the chosen reason as checked', () => {
      renderModal();

      // Site-owner default: reasons use the plain-language wording.
      const falsePositive = screen.getByRole('radio', { name: 'Not actually a problem' });
      expect(falsePositive).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(falsePositive);

      expect(falsePositive).toHaveAttribute('aria-checked', 'true');
    });

    it('disables the submit button until a reason is chosen', () => {
      renderModal();

      expect(screen.getByRole('button', { name: 'Hide' })).toBeDisabled();

      fireEvent.click(screen.getByRole('radio', { name: 'Not actually a problem' }));

      expect(screen.getByRole('button', { name: 'Hide' })).toBeEnabled();
    });
  });

  describe('Persona-aware copy (ux-public-15)', () => {
    it('uses plain-language title, reasons and submit label in Site-owner mode', () => {
      // Site-owner is the default persona.
      renderModal();

      expect(screen.getByRole('dialog', { name: 'Hide this issue' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: "It's from another company's code" })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
    });

    it('keeps the developer vocabulary in developer mode', () => {
      useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, persona: 'developer' } });
      renderModal();

      expect(screen.getByRole('dialog', { name: 'Mark as Known Issue' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'False positive' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: "Third-party code (can't modify)" })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as known/i })).toBeInTheDocument();
    });
  });
});
