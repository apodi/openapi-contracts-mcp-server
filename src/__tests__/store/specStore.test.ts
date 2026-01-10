import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createSpecStore, type SpecStore } from '../../store/specStore.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('SpecStore', () => {
  let tempDir: string;
  let store: SpecStore;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'specstore-test-'));

    const providerDir = path.join(tempDir, 'provider');
    const consumerDir = path.join(tempDir, 'consumer');
    await fs.mkdir(providerDir, { recursive: true });
    await fs.mkdir(consumerDir, { recursive: true });
    await fs.writeFile(
      path.join(providerDir, 'api-v1.json'),
      JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/users': {
            get: { operationId: 'getUsers' },
          },
        },
      })
    );

    await fs.writeFile(
      path.join(consumerDir, 'mobile.json'),
      JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Mobile Consumer', version: '1.0.0' },
        paths: {
          '/users': {
            get: { operationId: 'getUsers' },
          },
        },
      })
    );

    store = createSpecStore({ localContractsDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('isS3Enabled', () => {
    it('should return false when S3 is not configured', () => {
      const storeWithoutS3 = createSpecStore({ localContractsDir: tempDir });
      expect(storeWithoutS3.isS3Enabled()).toBe(false);
    });

    it('should return true when S3 is configured', () => {
      const storeWithS3 = createSpecStore({
        localContractsDir: tempDir,
        s3: { region: 'us-east-1', bucket: 'test-bucket', prefix: 'contracts' },
      });
      expect(storeWithS3.isS3Enabled()).toBe(true);
    });
  });

  describe('listContracts', () => {
    it('should list local provider contracts', async () => {
      const contracts = await store.listContracts('local', 'provider');
      expect(contracts).toContain('api-v1.json');
    });

    it('should list local consumer contracts', async () => {
      const contracts = await store.listContracts('local', 'consumer');
      expect(contracts).toContain('mobile.json');
    });

    it('should throw error for S3 when not enabled', async () => {
      await expect(store.listContracts('s3', 'provider')).rejects.toThrow('S3 is not enabled');
    });

    it('should throw error for unknown source', async () => {
      await expect(store.listContracts('unknown' as any, 'provider')).rejects.toThrow(
        'Unknown source'
      );
    });
  });

  describe('loadSpec', () => {
    it('should load and normalize local spec', async () => {
      const spec = await store.loadSpec('local', 'provider', 'api-v1.json');

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('API');

      const topKeys = Object.keys(spec);
      expect(topKeys[0]).toBe('info');
    });

    it('should cache loaded specs', async () => {
      const spec1 = await store.loadSpec('local', 'provider', 'api-v1.json');
      const spec2 = await store.loadSpec('local', 'provider', 'api-v1.json');

      expect(spec1).toBe(spec2);
    });

    it('should cache specs with unique keys per source/kind/name', async () => {
      const providerSpec = await store.loadSpec('local', 'provider', 'api-v1.json');
      const consumerSpec = await store.loadSpec('local', 'consumer', 'mobile.json');

      expect(providerSpec).not.toBe(consumerSpec);
      expect(providerSpec.info.title).toBe('API');
      expect(consumerSpec.info.title).toBe('Mobile Consumer');
    });

    it('should throw error when loading non-existent spec', async () => {
      await expect(store.loadSpec('local', 'provider', 'nonexistent.json')).rejects.toThrow();
    });

    it('should throw error for S3 when not enabled', async () => {
      await expect(store.loadSpec('s3', 'provider', 'api-v1.json')).rejects.toThrow(
        'S3 is not enabled'
      );
    });
  });

  describe('getSafeInfo', () => {
    it('should return safe config without S3', () => {
      const info = store.getSafeInfo();

      expect(info.localContractsDir).toBe(tempDir);
      expect(info.s3Enabled).toBe(false);
      expect(info.s3).toBeUndefined();
    });

    it('should return safe config with S3', () => {
      const storeWithS3 = createSpecStore({
        localContractsDir: tempDir,
        s3: { region: 'us-west-2', bucket: 'my-bucket', prefix: 'specs' },
      });

      const info = storeWithS3.getSafeInfo();

      expect(info.localContractsDir).toBe(tempDir);
      expect(info.s3Enabled).toBe(true);
      expect(info.s3).toEqual({
        region: 'us-west-2',
        bucket: 'my-bucket',
        prefix: 'specs',
      });
    });
  });

  describe('normalization', () => {
    it('should normalize complex OpenAPI spec', async () => {
      const complexDir = path.join(tempDir, 'provider');
      await fs.writeFile(
        path.join(complexDir, 'complex.json'),
        JSON.stringify({
          paths: {
            '/users': {
              post: { operationId: 'createUser' },
              get: { operationId: 'listUsers' },
            },
          },
          openapi: '3.0.0',
          info: { version: '1.0.0', title: 'Complex API' },
          components: {
            schemas: {
              User: { type: 'object' },
              Account: { type: 'object' },
            },
          },
        })
      );

      const spec = await store.loadSpec('local', 'provider', 'complex.json');

      // Verify top-level keys are sorted
      const topKeys = Object.keys(spec);
      expect(topKeys).toEqual(['components', 'info', 'openapi', 'paths']);

      // Verify nested keys are sorted
      expect(Object.keys(spec.components.schemas)).toEqual(['Account', 'User']);
      expect(Object.keys(spec.paths['/users'])).toEqual(['get', 'post']);
    });
  });
});
