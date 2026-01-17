import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  const consoleSpy: { [key: string]: ReturnType<typeof vi.spyOn> } = {};

  beforeEach(() => {
    // Spy on all console methods
    consoleSpy.log = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleSpy.info = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleSpy.warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleSpy.error = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleSpy.debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleSpy.group = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleSpy.groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    consoleSpy.time = vi.spyOn(console, 'time').mockImplementation(() => {});
    consoleSpy.timeEnd = vi.spyOn(console, 'timeEnd').mockImplementation(() => {});
    consoleSpy.table = vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore all console methods
    Object.values(consoleSpy).forEach((spy) => {
      if (spy && typeof spy.mockRestore === 'function') {
        spy.mockRestore();
      }
    });
  });

  describe('logger.log', () => {
    it('should call console.log with prefix in dev mode', () => {
      logger.log('test message');
      expect(consoleSpy.log).toHaveBeenCalledWith('[WatchDog]', 'test message');
    });

    it('should call console.log with multiple arguments', () => {
      logger.log('message', 'arg1', { data: 'value' });
      expect(consoleSpy.log).toHaveBeenCalledWith('[WatchDog]', 'message', 'arg1', {
        data: 'value',
      });
    });
  });

  describe('logger.info', () => {
    it('should call console.info with prefix in dev mode', () => {
      logger.info('info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[WatchDog]', 'info message');
    });

    it('should call console.info with multiple arguments', () => {
      logger.info('info', 123, true);
      expect(consoleSpy.info).toHaveBeenCalledWith('[WatchDog]', 'info', 123, true);
    });
  });

  describe('logger.warn', () => {
    it('should call console.warn with prefix in dev mode', () => {
      logger.warn('warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WatchDog]', 'warning message');
    });

    it('should call console.warn with multiple arguments', () => {
      logger.warn('warn', 'dangerous operation');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WatchDog]', 'warn', 'dangerous operation');
    });
  });

  describe('logger.error', () => {
    it('should call console.error with prefix in dev mode', () => {
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[WatchDog]', 'error message');
    });

    it('should call console.error with Error object', () => {
      const error = new Error('test error');
      logger.error(error);
      expect(consoleSpy.error).toHaveBeenCalledWith('[WatchDog]', error);
    });
  });

  describe('logger.debug', () => {
    it('should call console.debug with prefix in dev mode', () => {
      logger.debug('debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[WatchDog]', 'debug message');
    });

    it('should call console.debug with object argument', () => {
      const debugObj = { key: 'value', nested: { data: 123 } };
      logger.debug(debugObj);
      expect(consoleSpy.debug).toHaveBeenCalledWith('[WatchDog]', debugObj);
    });
  });

  describe('logger.group', () => {
    it('should call console.group with prefixed label in dev mode', () => {
      logger.group('Group Name');
      expect(consoleSpy.group).toHaveBeenCalledWith('[WatchDog] Group Name');
    });

    it('should call console.group with different labels', () => {
      logger.group('Section A');
      expect(consoleSpy.group).toHaveBeenCalledWith('[WatchDog] Section A');

      consoleSpy.group.mockClear();

      logger.group('Section B');
      expect(consoleSpy.group).toHaveBeenCalledWith('[WatchDog] Section B');
    });
  });

  describe('logger.groupEnd', () => {
    it('should call console.groupEnd in dev mode', () => {
      logger.groupEnd();
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('should call console.groupEnd without arguments', () => {
      logger.group('test');
      logger.groupEnd();
      logger.groupEnd();

      expect(consoleSpy.groupEnd).toHaveBeenCalledTimes(2);
    });
  });

  describe('logger.time', () => {
    it('should call console.time with prefixed label in dev mode', () => {
      logger.time('operation');
      expect(consoleSpy.time).toHaveBeenCalledWith('[WatchDog] operation');
    });

    it('should call console.time with different timer names', () => {
      logger.time('timer1');
      expect(consoleSpy.time).toHaveBeenCalledWith('[WatchDog] timer1');

      consoleSpy.time.mockClear();

      logger.time('timer2');
      expect(consoleSpy.time).toHaveBeenCalledWith('[WatchDog] timer2');
    });
  });

  describe('logger.timeEnd', () => {
    it('should call console.timeEnd with prefixed label in dev mode', () => {
      logger.timeEnd('operation');
      expect(consoleSpy.timeEnd).toHaveBeenCalledWith('[WatchDog] operation');
    });

    it('should call console.timeEnd with different timer names', () => {
      logger.timeEnd('timer1');
      expect(consoleSpy.timeEnd).toHaveBeenCalledWith('[WatchDog] timer1');

      consoleSpy.timeEnd.mockClear();

      logger.timeEnd('timer2');
      expect(consoleSpy.timeEnd).toHaveBeenCalledWith('[WatchDog] timer2');
    });
  });

  describe('logger.table', () => {
    it('should call console.table with data in dev mode', () => {
      const tableData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      logger.table(tableData);
      expect(consoleSpy.table).toHaveBeenCalledWith(tableData);
    });

    it('should call console.table with simple array', () => {
      const simpleArray = ['a', 'b', 'c'];
      logger.table(simpleArray);
      expect(consoleSpy.table).toHaveBeenCalledWith(simpleArray);
    });

    it('should call console.table with object', () => {
      const tableObj = {
        key1: 'value1',
        key2: 'value2',
      };
      logger.table(tableObj);
      expect(consoleSpy.table).toHaveBeenCalledWith(tableObj);
    });

    it('should call console.table with complex nested data', () => {
      const complexData = [
        { id: 1, details: { category: 'A', score: 95 }, active: true },
        { id: 2, details: { category: 'B', score: 87 }, active: false },
      ];
      logger.table(complexData);
      expect(consoleSpy.table).toHaveBeenCalledWith(complexData);
    });

    it('should handle empty array', () => {
      logger.table([]);
      expect(consoleSpy.table).toHaveBeenCalledWith([]);
    });

    it('should handle null data', () => {
      logger.table(null);
      expect(consoleSpy.table).toHaveBeenCalledWith(null);
    });

    it('should handle undefined data', () => {
      logger.table(undefined);
      expect(consoleSpy.table).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Integration', () => {
    it('should support chained operations', () => {
      logger.group('Test Group');
      logger.log('message 1');
      logger.info('message 2');
      logger.warn('message 3');
      logger.groupEnd();

      expect(consoleSpy.group).toHaveBeenCalledWith('[WatchDog] Test Group');
      expect(consoleSpy.log).toHaveBeenCalledWith('[WatchDog]', 'message 1');
      expect(consoleSpy.info).toHaveBeenCalledWith('[WatchDog]', 'message 2');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WatchDog]', 'message 3');
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('should support timing with group', () => {
      logger.group('Performance Metrics');
      logger.time('scan');
      // Simulating some work
      logger.timeEnd('scan');
      logger.groupEnd();

      expect(consoleSpy.group).toHaveBeenCalledWith('[WatchDog] Performance Metrics');
      expect(consoleSpy.time).toHaveBeenCalledWith('[WatchDog] scan');
      expect(consoleSpy.timeEnd).toHaveBeenCalledWith('[WatchDog] scan');
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('should support logging with table', () => {
      logger.group('Data Report');
      const report = [{ name: 'Item1', value: 100 }];
      logger.table(report);
      logger.groupEnd();

      expect(consoleSpy.group).toHaveBeenCalledWith('[WatchDog] Data Report');
      expect(consoleSpy.table).toHaveBeenCalledWith(report);
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('should support multiple error logs', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      logger.error('Error 3');

      expect(consoleSpy.error).toHaveBeenCalledTimes(3);
      expect(consoleSpy.error).toHaveBeenNthCalledWith(1, '[WatchDog]', 'Error 1');
      expect(consoleSpy.error).toHaveBeenNthCalledWith(2, '[WatchDog]', 'Error 2');
      expect(consoleSpy.error).toHaveBeenNthCalledWith(3, '[WatchDog]', 'Error 3');
    });

    it('should support different argument types', () => {
      logger.log('string', 123, true, { obj: 'value' }, ['array']);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[WatchDog]',
        'string',
        123,
        true,
        { obj: 'value' },
        ['array']
      );
    });
  });
});
