/**
 * Error codes and messages for WatchDog
 * Provides user-friendly error messages with actionable suggestions
 */

export interface ErrorDetails {
  code: string;
  title: string;
  message: string;
  suggestion: string;
  helpUrl?: string;
}

export const ERROR_CODES: Record<string, ErrorDetails> = {
  E001: {
    code: 'E001',
    title: 'No Active Tab',
    message: 'Could not find an active browser tab to scan.',
    suggestion: 'Make sure you have a webpage open and try again.',
  },
  E002: {
    code: 'E002',
    title: 'Restricted Page',
    message: 'Cannot scan browser internal pages (chrome://, about:, etc.)',
    suggestion: 'Navigate to a regular webpage (http:// or https://) to scan.',
  },
  E003: {
    code: 'E003',
    title: 'Content Script Not Loaded',
    message: 'The scanner is not loaded on this page.',
    suggestion:
      'Refresh the page and try again. If the problem persists, try reloading the extension.',
  },
  E004: {
    code: 'E004',
    title: 'Scan Timeout',
    message: 'The scan took too long to complete.',
    suggestion: 'The page may be too large or complex. Try refreshing and scanning again.',
  },
  E005: {
    code: 'E005',
    title: 'Scan Failed',
    message: 'An unexpected error occurred during the scan.',
    suggestion:
      'Try refreshing the page. If the problem continues, check the browser console for details.',
  },
  E006: {
    code: 'E006',
    title: 'Audit Not Supported',
    message: 'This audit type is not yet fully implemented.',
    suggestion: 'This feature is coming soon. Try a different audit type for now.',
  },
  E007: {
    code: 'E007',
    title: 'Partial Scan Failure',
    message: 'Some audit types failed while others succeeded.',
    suggestion: 'Check the results for successful audits. Try running failed audits individually.',
  },
  E008: {
    code: 'E008',
    title: 'Network Error',
    message: 'Could not communicate with the page.',
    suggestion: 'Check your internet connection and refresh the page.',
  },
};

/**
 * Get detailed error information from an error message
 */
export function getErrorDetails(error: Error | string): ErrorDetails {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // Match error patterns to error codes
  if (lowerMessage.includes('no active tab')) {
    return ERROR_CODES.E001;
  }
  if (lowerMessage.includes('internal pages') || lowerMessage.includes('restricted')) {
    return ERROR_CODES.E002;
  }
  if (lowerMessage.includes('refresh the page') || lowerMessage.includes('content script')) {
    return ERROR_CODES.E003;
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('too long')) {
    return ERROR_CODES.E004;
  }
  if (lowerMessage.includes('not yet implemented') || lowerMessage.includes('not supported')) {
    return ERROR_CODES.E006;
  }
  if (lowerMessage.includes('some audits failed') || lowerMessage.includes('partial')) {
    return { ...ERROR_CODES.E007, message };
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return ERROR_CODES.E008;
  }

  // Default to generic error with original message
  return {
    ...ERROR_CODES.E005,
    message: message || ERROR_CODES.E005.message,
  };
}

/**
 * Format error for display
 */
export function formatError(error: Error | string): string {
  const details = getErrorDetails(error);
  return `${details.title}: ${details.message}`;
}
