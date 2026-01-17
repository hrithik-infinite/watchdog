/**
 * Development-only logger utility
 * All logs are stripped out in production builds by Vite
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

function createLogger(level: LogLevel) {
  return (...args: unknown[]) => {
    if (isDev) {
      const prefix = `[WatchDog]`;
      console[level](prefix, ...args);
    }
  };
}

export const logger = {
  log: createLogger('log'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  debug: createLogger('debug'),

  // Group logs together
  group: (label: string) => {
    if (isDev) console.group(`[WatchDog] ${label}`);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },

  // Time measurements
  time: (label: string) => {
    if (isDev) console.time(`[WatchDog] ${label}`);
  },
  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(`[WatchDog] ${label}`);
  },

  // Table for structured data
  table: (data: unknown) => {
    if (isDev) console.table(data);
  },
};

export default logger;
