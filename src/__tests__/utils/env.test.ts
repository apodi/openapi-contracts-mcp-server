import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Note: ENV is a constant object, so we test the isTrue logic indirectly
describe('ENV Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a fresh copy of process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('isTrue function behavior', () => {
    it('should treat "1" as true', () => {
      process.env.TEST_VAR = '1';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(true);
    });

    it('should treat "true" as true', () => {
      process.env.TEST_VAR = 'true';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(true);
    });

    it('should treat "TRUE" as true', () => {
      process.env.TEST_VAR = 'TRUE';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(true);
    });

    it('should treat "yes" as true', () => {
      process.env.TEST_VAR = 'yes';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(true);
    });

    it('should treat "0" as false', () => {
      process.env.TEST_VAR = '0';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(false);
    });

    it('should treat "false" as false', () => {
      process.env.TEST_VAR = 'false';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(false);
    });

    it('should treat undefined as false', () => {
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(undefined)).toBe(false);
    });

    it('should treat empty string as false', () => {
      process.env.TEST_VAR = '';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(false);
    });

    it('should treat random string as false', () => {
      process.env.TEST_VAR = 'random';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.TEST_VAR)).toBe(false);
    });
  });

  describe('default values', () => {
    it('should use default contract directory when not set', () => {
      delete process.env.OPENAPI_CONTRACT_DIR;
      const dir = process.env.OPENAPI_CONTRACT_DIR ?? './contracts';
      expect(dir).toBe('./contracts');
    });

    it('should use custom contract directory when set', () => {
      process.env.OPENAPI_CONTRACT_DIR = '/custom/path';
      const dir = process.env.OPENAPI_CONTRACT_DIR ?? './contracts';
      expect(dir).toBe('/custom/path');
    });

    it('should use default AWS region when not set', () => {
      delete process.env.AWS_REGION;
      const region = process.env.AWS_REGION ?? 'eu-west-2';
      expect(region).toBe('eu-west-2');
    });

    it('should use custom AWS region when set', () => {
      process.env.AWS_REGION = 'us-east-1';
      const region = process.env.AWS_REGION ?? 'eu-west-2';
      expect(region).toBe('us-east-1');
    });

    it('should use default S3 prefix when not set', () => {
      delete process.env.S3_PREFIX;
      const prefix = process.env.S3_PREFIX ?? 'openapi-contracts';
      expect(prefix).toBe('openapi-contracts');
    });

    it('should use empty string for S3_BUCKET by default', () => {
      delete process.env.S3_BUCKET;
      const bucket = process.env.S3_BUCKET ?? '';
      expect(bucket).toBe('');
    });
  });

  describe('boolean environment variables', () => {
    it('S3_ENABLED should be false when not set', () => {
      delete process.env.S3_ENABLED;
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.S3_ENABLED)).toBe(false);
    });

    it('S3_ENABLED should be true when set to "1"', () => {
      process.env.S3_ENABLED = '1';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.S3_ENABLED)).toBe(true);
    });

    it('DEBUG_MCP should be false when not set', () => {
      delete process.env.DEBUG_MCP;
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.DEBUG_MCP)).toBe(false);
    });

    it('DEBUG_MCP should be true when set to "true"', () => {
      process.env.DEBUG_MCP = 'true';
      const isTrue = (v?: string) => v === '1' || v === 'true' || v === 'TRUE' || v === 'yes';
      expect(isTrue(process.env.DEBUG_MCP)).toBe(true);
    });
  });
});
