import { logError, logWarning, logInfo, startTimer } from './logger';

describe('Logger', () => {
  let consoleSpy: { error: ReturnType<typeof jest.spyOn>; warn: ReturnType<typeof jest.spyOn>; log: ReturnType<typeof jest.spyOn> };

  beforeEach(() => {
    consoleSpy = {
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      log: jest.spyOn(console, 'log').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logError', () => {
    test('logs Error objects with severity ERROR', () => {
      const error = new Error('Test error');
      logError('Something failed', error, { endpoint: 'test' });

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(logged.severity).toBe('ERROR');
      expect(logged.message).toBe('Something failed');
      expect(logged.error.type).toBe('Error');
      expect(logged.error.message).toBe('Test error');
      expect(logged.context.endpoint).toBe('test');
    });

    test('truncates long error messages to 200 chars', () => {
      const error = new Error('a'.repeat(300));
      logError('overflow', error);

      const logged = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(logged.error.message.length).toBe(200);
    });

    test('handles string errors', () => {
      logError('string error', 'raw string');

      const logged = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(logged.error.type).toBe('StringError');
      expect(logged.error.message).toBe('raw string');
    });

    test('handles unknown error types', () => {
      logError('unknown', { something: true });

      const logged = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(logged.error.type).toBe('UnknownError');
    });

    test('preserves error code if present', () => {
      const error = new Error('file not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      logError('fs error', error);

      const logged = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(logged.error.code).toBe('ENOENT');
    });
  });

  describe('logWarning', () => {
    test('logs with severity WARNING via console.warn', () => {
      logWarning('caution', { endpoint: 'test' });

      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
      expect(logged.severity).toBe('WARNING');
      expect(logged.message).toBe('caution');
    });
  });

  describe('logInfo', () => {
    test('logs with severity INFO via console.log', () => {
      logInfo('all good', { endpoint: 'test' });

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.severity).toBe('INFO');
    });
  });

  describe('IP sanitization', () => {
    test('masks IPv4 addresses', () => {
      logInfo('request', { ip: '192.168.1.100' });

      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.context.ip).toBe('***.***.***.100');
    });

    test('masks non-IPv4 addresses completely', () => {
      logInfo('request', { ip: '::1' });

      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.context.ip).toBe('***');
    });
  });

  describe('context sanitization', () => {
    test('includes endpoint and durationMs', () => {
      logInfo('done', { endpoint: 'getAssets', durationMs: 150 });

      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.context.endpoint).toBe('getAssets');
      expect(logged.context.durationMs).toBe(150);
    });

    test('does not include sensitive fields', () => {
      logInfo('test', { endpoint: 'test', password: 'secret', token: 'abc' } as any);

      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.context.password).toBeUndefined();
      expect(logged.context.token).toBeUndefined();
    });

    test('returns empty context for empty input', () => {
      logInfo('test', {});

      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(Object.keys(logged.context).length).toBe(0);
    });
  });

  describe('startTimer', () => {
    test('logs duration on done()', () => {
      const timer = startTimer('testEndpoint');

      // Simulate some time passing
      timer.done();

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.severity).toBe('INFO');
      expect(logged.message).toBe('testEndpoint completed');
      expect(logged.context.endpoint).toBe('testEndpoint');
      expect(typeof logged.context.durationMs).toBe('number');
      expect(logged.context.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('merges additional context on done()', () => {
      const timer = startTimer('getAssets');
      timer.done({ ip: '10.0.0.1' });

      const logged = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(logged.context.ip).toBe('***.***.***.1');
      expect(logged.context.endpoint).toBe('getAssets');
    });
  });
});
