import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import logger from '@/shared/logger';

// A child that throws on render until `shouldThrow` is flipped off. Module-level
// mutable state lets the reset/try-again path re-render it without throwing.
let shouldThrow = true;
function MaybeThrow() {
  if (shouldThrow) {
    throw new Error('child boom');
  }
  return <div>Recovered child</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React logs caught render errors to console.error; silence the noise so the
    // test output stays readable without asserting on React's internal logging.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('render-path errors (testing-8)', () => {
    it('renders the default fallback when a child throws during render', () => {
      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      // The thrown error message is surfaced to the user.
      expect(screen.getByText('child boom')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('renders a custom fallback when provided instead of the default UI', () => {
      render(
        <ErrorBoundary fallback={<div>custom fallback</div>}>
          <MaybeThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('custom fallback')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('recovers via the Try Again reset path once the child stops throwing', () => {
      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      // Boundary tripped.
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // The underlying failure is resolved before the user retries.
      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // Reset clears hasError and re-renders the (now healthy) children.
      expect(screen.getByText('Recovered child')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('global async errors (err-9)', () => {
    it('logs unhandled promise rejections that escape the React render path', () => {
      const errorSpy = vi.spyOn(logger, 'error');
      shouldThrow = false;

      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      // Previously such a rejection was silently swallowed (no boundary, no log).
      const event = new Event('unhandledrejection') as PromiseRejectionEvent;
      Object.defineProperty(event, 'reason', { value: new Error('async boom') });
      window.dispatchEvent(event);

      expect(errorSpy).toHaveBeenCalledWith(
        'Unhandled promise rejection',
        expect.objectContaining({ message: 'async boom' })
      );
    });

    it('coerces a non-Error rejection reason into a logged message', () => {
      const errorSpy = vi.spyOn(logger, 'error');
      shouldThrow = false;

      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      const event = new Event('unhandledrejection') as PromiseRejectionEvent;
      Object.defineProperty(event, 'reason', { value: 'string rejection' });
      window.dispatchEvent(event);

      expect(errorSpy).toHaveBeenCalledWith(
        'Unhandled promise rejection',
        expect.objectContaining({ message: 'string rejection' })
      );
    });

    it('logs uncaught window errors', () => {
      const errorSpy = vi.spyOn(logger, 'error');
      shouldThrow = false;

      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      const event = new Event('error') as ErrorEvent;
      Object.defineProperty(event, 'error', { value: new Error('uncaught boom') });
      Object.defineProperty(event, 'message', { value: 'uncaught boom' });
      window.dispatchEvent(event);

      expect(errorSpy).toHaveBeenCalledWith(
        'Uncaught error',
        expect.objectContaining({ message: 'uncaught boom' })
      );
    });

    it('removes the window listeners on unmount (no leak after teardown)', () => {
      const errorSpy = vi.spyOn(logger, 'error');
      shouldThrow = false;

      const { unmount } = render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      unmount();
      errorSpy.mockClear();

      const event = new Event('unhandledrejection') as PromiseRejectionEvent;
      Object.defineProperty(event, 'reason', { value: new Error('after unmount') });
      window.dispatchEvent(event);

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
