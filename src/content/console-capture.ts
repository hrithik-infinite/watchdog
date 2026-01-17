/**
 * Console Capture Script
 * This script captures console errors and warnings for analysis.
 * It should be injected as early as possible into the page.
 */

export {}; // Make this a module

interface CapturedConsoleData {
  errors: string[];
  warnings: string[];
}

// Initialize capture data on window
declare global {
  interface Window {
    __watchdog_console?: CapturedConsoleData;
  }
}

(function () {
  // Don't run if already initialized
  if (window.__watchdog_console) {
    return;
  }

  const captureData: CapturedConsoleData = {
    errors: [],
    warnings: [],
  };

  // Store on window for access by content script
  window.__watchdog_console = captureData;

  // Maximum entries to capture (prevent memory issues)
  const MAX_ENTRIES = 100;

  // Capture console.error
  const originalError = console.error;
  console.error = function (...args: unknown[]) {
    if (captureData.errors.length < MAX_ENTRIES) {
      const message = args
        .map((arg) => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}`;
          }
          return String(arg);
        })
        .join(' ');
      captureData.errors.push(message);
    }
    return originalError.apply(console, args);
  };

  // Capture console.warn
  const originalWarn = console.warn;
  console.warn = function (...args: unknown[]) {
    if (captureData.warnings.length < MAX_ENTRIES) {
      const message = args.map((arg) => String(arg)).join(' ');
      captureData.warnings.push(message);
    }
    return originalWarn.apply(console, args);
  };

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    if (captureData.errors.length < MAX_ENTRIES) {
      const message = `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      captureData.errors.push(message);
    }
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (captureData.errors.length < MAX_ENTRIES) {
      const reason =
        event.reason instanceof Error
          ? `${event.reason.name}: ${event.reason.message}`
          : String(event.reason);
      const message = `Unhandled Promise Rejection: ${reason}`;
      captureData.errors.push(message);
    }
  });
})();
