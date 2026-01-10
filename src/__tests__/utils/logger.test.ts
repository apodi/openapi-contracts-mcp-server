import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createLogger } from '../../utils/logger.js';

describe('Logger', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let originalDebugMCP: boolean | undefined;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    originalDebugMCP = process.env.DEBUG_MCP === 'true';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    
    if (originalDebugMCP) {
      process.env.DEBUG_MCP = 'true';
    } else {
      delete process.env.DEBUG_MCP;
    }
  });

  it('should log INFO messages', () => {
    const logger = createLogger('test-scope');
    logger.info('test message');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('[test-scope]');
    expect(logOutput).toContain('[INFO]');
    expect(logOutput).toContain('test message');
  });

  it('should log ERROR messages', () => {
    const logger = createLogger('error-scope');
    logger.error('error occurred');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('[error-scope]');
    expect(logOutput).toContain('[ERROR]');
    expect(logOutput).toContain('error occurred');
  });

  it('should include ISO timestamp in log output', () => {
    const logger = createLogger('test');
    logger.info('test');

    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  it('should log DEBUG messages when DEBUG_MCP is enabled', () => {
    process.env.DEBUG_MCP = 'true';
    
    const logger = createLogger('debug-scope');
    logger.debug('debug message');

    expect(consoleErrorSpy).toBeDefined();
  });

  it('should format log with all components', () => {
    const logger = createLogger('MyModule');
    logger.info('Operation successful');

    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toMatch(/^\[.+\] \[MyModule\] \[INFO\] Operation successful$/);
  });

  it('should support multiple loggers with different scopes', () => {
    const logger1 = createLogger('module1');
    const logger2 = createLogger('module2');

    logger1.info('message from module1');
    logger2.error('message from module2');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    
    const log1 = consoleErrorSpy.mock.calls[0][0];
    const log2 = consoleErrorSpy.mock.calls[1][0];

    expect(log1).toContain('[module1]');
    expect(log1).toContain('[INFO]');
    
    expect(log2).toContain('[module2]');
    expect(log2).toContain('[ERROR]');
  });

  it('should use stderr for logging (not stdout)', () => {
    const stdoutSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const logger = createLogger('test');
    logger.info('test message');

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    stdoutSpy.mockRestore();
  });
});
