import { describe, it, expect } from 'vitest';
import { ERROR_CODES, ErrorDetails, getErrorDetails, formatError } from '../errors';

describe('Errors - Custom error classes and error details', () => {
  describe('ERROR_CODES constants', () => {
    it('should define E001 for no active tab', () => {
      const error = ERROR_CODES.E001;

      expect(error.code).toBe('E001');
      expect(error.title).toBe('No Active Tab');
      expect(error.message).toContain('active browser tab');
      expect(error.suggestion).toContain('webpage');
    });

    it('should define E002 for restricted pages', () => {
      const error = ERROR_CODES.E002;

      expect(error.code).toBe('E002');
      expect(error.title).toBe('Restricted Page');
      expect(error.message).toContain('internal pages');
      expect(error.suggestion).toContain('http');
    });

    it('should define E003 for content script not loaded', () => {
      const error = ERROR_CODES.E003;

      expect(error.code).toBe('E003');
      expect(error.title).toBe('Content Script Not Loaded');
      expect(error.message).toContain('scanner is not loaded');
      expect(error.suggestion).toContain('Refresh');
    });

    it('should define E004 for scan timeout', () => {
      const error = ERROR_CODES.E004;

      expect(error.code).toBe('E004');
      expect(error.title).toBe('Scan Timeout');
      expect(error.message).toContain('took too long');
      expect(error.suggestion).toContain('large or complex');
    });

    it('should define E005 for generic scan failure', () => {
      const error = ERROR_CODES.E005;

      expect(error.code).toBe('E005');
      expect(error.title).toBe('Scan Failed');
      expect(error.message).toContain('unexpected error');
      expect(error.suggestion).toContain('console');
    });

    it('should define E006 for unsupported audits', () => {
      const error = ERROR_CODES.E006;

      expect(error.code).toBe('E006');
      expect(error.title).toBe('Audit Not Supported');
      expect(error.message).toContain('not yet fully implemented');
      expect(error.suggestion).toContain('coming soon');
    });

    it('should define E007 for partial scan failures', () => {
      const error = ERROR_CODES.E007;

      expect(error.code).toBe('E007');
      expect(error.title).toBe('Partial Scan Failure');
      expect(error.message).toContain('Some audit types failed');
      expect(error.suggestion).toContain('results');
    });

    it('should define E008 for network errors', () => {
      const error = ERROR_CODES.E008;

      expect(error.code).toBe('E008');
      expect(error.title).toBe('Network Error');
      expect(error.message).toContain('communicate');
      expect(error.suggestion).toContain('internet connection');
    });

    it('should have all required properties in each error', () => {
      Object.values(ERROR_CODES).forEach((error) => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('title');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('suggestion');
        expect(typeof error.code).toBe('string');
        expect(typeof error.title).toBe('string');
        expect(typeof error.message).toBe('string');
        expect(typeof error.suggestion).toBe('string');
      });
    });

    it('should have non-empty message and suggestion', () => {
      Object.values(ERROR_CODES).forEach((error) => {
        expect(error.message.length).toBeGreaterThan(0);
        expect(error.suggestion.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getErrorDetails with Error object', () => {
    it('should match E001 for no active tab error', () => {
      const error = new Error('No active tab found');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E001');
      expect(details.title).toBe('No Active Tab');
    });

    it('should match E002 for internal pages error', () => {
      const error = new Error('Cannot scan internal pages');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E002');
      expect(details.title).toBe('Restricted Page');
    });

    it('should match E002 for restricted page error', () => {
      const error = new Error('This page is restricted');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E002');
    });

    it('should match E003 for content script error', () => {
      const error = new Error('Content script not available');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E003');
      expect(details.title).toBe('Content Script Not Loaded');
    });

    it('should match E003 for refresh error', () => {
      const error = new Error('Please refresh the page');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E003');
    });

    it('should match E004 for timeout error', () => {
      const error = new Error('Scan timeout exceeded');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E004');
      expect(details.title).toBe('Scan Timeout');
    });

    it('should match E004 for too long error', () => {
      const error = new Error('Scan took too long to complete');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E004');
    });

    it('should match E006 for not implemented error', () => {
      const error = new Error('This feature is not yet implemented');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E006');
      expect(details.title).toBe('Audit Not Supported');
    });

    it('should match E006 for not supported error', () => {
      const error = new Error('Audit type not supported');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E006');
    });

    it('should match E007 for partial failure error', () => {
      const error = new Error('Some audits failed during scan');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E007');
      expect(details.title).toBe('Partial Scan Failure');
    });

    it('should preserve message in E007', () => {
      const customMessage = 'Some audits failed during scan';
      const error = new Error(customMessage);
      const details = getErrorDetails(error);

      expect(details.message).toBe(customMessage);
    });

    it('should match E007 for partial error', () => {
      const error = new Error('Partial failure occurred');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E007');
    });

    it('should match E008 for network error', () => {
      const error = new Error('Network connection failed');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E008');
      expect(details.title).toBe('Network Error');
    });

    it('should match E008 for connection error', () => {
      const error = new Error('Connection refused');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E008');
    });

    it('should return E005 as default for unknown errors', () => {
      const error = new Error('Unknown error occurred');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E005');
      expect(details.title).toBe('Scan Failed');
    });

    it('should preserve original message in default error', () => {
      const message = 'Something unexpected happened';
      const error = new Error(message);
      const details = getErrorDetails(error);

      expect(details.message).toBe(message);
    });

    it('should be case insensitive for error matching', () => {
      const error = new Error('NO ACTIVE TAB FOUND');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E001');
    });

    it('should match multiple keywords in error message', () => {
      const error = new Error('Scan timeout occurred');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E004');
    });
  });

  describe('getErrorDetails with string', () => {
    it('should handle string input for no active tab', () => {
      const details = getErrorDetails('No active tab');

      expect(details.code).toBe('E001');
    });

    it('should handle string input for network error', () => {
      const details = getErrorDetails('Network error');

      expect(details.code).toBe('E008');
    });

    it('should handle string input for timeout', () => {
      const details = getErrorDetails('timeout');

      expect(details.code).toBe('E004');
    });

    it('should handle string input for unknown error', () => {
      const details = getErrorDetails('something went wrong');

      expect(details.code).toBe('E005');
    });

    it('should be case insensitive with string input', () => {
      const details = getErrorDetails('NETWORK');

      expect(details.code).toBe('E008');
    });

    it('should handle empty string', () => {
      const details = getErrorDetails('');

      expect(details.code).toBe('E005');
      // Empty message may be replaced with default message
      expect(typeof details.message).toBe('string');
    });
  });

  describe('getErrorDetails edge cases', () => {
    it('should handle error with empty message', () => {
      const error = new Error('');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E005');
    });

    it('should handle null-like values gracefully', () => {
      const error = new Error();
      const details = getErrorDetails(error);

      expect(details).toBeDefined();
      expect(details.code).toBe('E005');
    });

    it('should match first applicable error code', () => {
      // "timeout" matches E004, not other codes
      const error = new Error('Scan timeout');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E004');
    });

    it('should handle complex error messages', () => {
      const error = new Error('Error: Network request timeout after 30000ms');
      const details = getErrorDetails(error);

      expect(details.code).toBe('E004');
    });

    it('should prioritize exact matches', () => {
      // "timeout" in message
      const error1 = new Error('Scan timeout');
      expect(getErrorDetails(error1).code).toBe('E004');

      // "network" in message
      const error2 = new Error('Network unavailable');
      expect(getErrorDetails(error2).code).toBe('E008');
    });
  });

  describe('formatError', () => {
    it('should format error with Error object', () => {
      const error = new Error('No active tab');
      const formatted = formatError(error);

      expect(formatted).toContain('No Active Tab');
      expect(formatted).toContain('Could not find an active browser tab');
    });

    it('should format error with string', () => {
      const formatted = formatError('Network error occurred');

      expect(formatted).toContain('Network Error');
      expect(formatted).toContain('Could not communicate');
    });

    it('should use title and message from ERROR_CODES', () => {
      const error = new Error('timeout');
      const formatted = formatError(error);

      expect(formatted).toContain('Scan Timeout');
      expect(formatted).toContain('took too long');
    });

    it('should include colon separator', () => {
      const error = new Error('No active tab');
      const formatted = formatError(error);

      expect(formatted).toMatch(/^.*:.*$/);
    });

    it('should start with title', () => {
      const error = new Error('timeout');
      const formatted = formatError(error);

      expect(formatted.startsWith('Scan Timeout')).toBe(true);
    });

    it('should format all error codes', () => {
      Object.values(ERROR_CODES).forEach((errorCode) => {
        const error = new Error(errorCode.message);
        const formatted = formatError(error);

        expect(formatted).toContain(':');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });

    it('should handle default error formatting', () => {
      const error = new Error('Unknown issue');
      const formatted = formatError(error);

      expect(formatted).toContain('Scan Failed');
      expect(formatted).toContain('Unknown issue');
    });

    it('should preserve custom message for partial failure', () => {
      const customMsg = 'Some audits failed during scan';
      const error = new Error(customMsg);
      const formatted = formatError(error);

      expect(formatted).toContain('Partial Scan Failure');
      expect(formatted).toContain(customMsg);
    });
  });

  describe('Error matching patterns', () => {
    it('should match error patterns in any case', () => {
      const patterns = [
        { input: 'NO ACTIVE TAB', code: 'E001' },
        { input: 'TIMEOUT', code: 'E004' },
        { input: 'NETWORK', code: 'E008' },
        { input: 'Refresh the page', code: 'E003' },
      ];

      patterns.forEach(({ input, code }) => {
        const details = getErrorDetails(input);
        expect(details.code).toBe(code);
      });
    });

    it('should handle partial keyword matches', () => {
      // "Tab is not active" doesn't match "no active tab" pattern
      const error1 = new Error('No active tab issue');
      expect(getErrorDetails(error1).code).toBe('E001');

      const error2 = new Error('Timeout error');
      expect(getErrorDetails(error2).code).toBe('E004');

      const error3 = new Error('Network unavailable');
      expect(getErrorDetails(error3).code).toBe('E008');
    });
  });

  describe('ErrorDetails interface', () => {
    it('should return proper ErrorDetails object', () => {
      const details = getErrorDetails('Network error');

      expect(details).toHaveProperty('code');
      expect(details).toHaveProperty('title');
      expect(details).toHaveProperty('message');
      expect(details).toHaveProperty('suggestion');

      const typedDetails: ErrorDetails = details;
      expect(typedDetails.code).toBe('E008');
    });

    it('should optionally include helpUrl', () => {
      const details = ERROR_CODES.E001;

      // helpUrl is optional per interface
      if (details.helpUrl) {
        expect(typeof details.helpUrl).toBe('string');
      }
    });
  });

  describe('Error recovery suggestions', () => {
    it('should provide actionable suggestions', () => {
      const codes = Object.values(ERROR_CODES);

      codes.forEach((code) => {
        expect(code.suggestion).toMatch(/^[A-Z]/); // Starts with capital
        expect(code.suggestion.length).toBeGreaterThan(5);
      });
    });

    it('should suggest page refresh for most errors', () => {
      const refreshSuggestions = [ERROR_CODES.E003, ERROR_CODES.E005];

      refreshSuggestions.forEach((error) => {
        expect(error.suggestion.toLowerCase()).toContain('refresh');
      });
    });
  });
});
