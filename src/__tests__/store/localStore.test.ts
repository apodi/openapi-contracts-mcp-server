import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createLocalStore, type LocalStore } from '../../store/localStore.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('LocalStore', () => {
  let tempDir: string;
  let store: LocalStore;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localstore-test-'));
    store = createLocalStore(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('list', () => {
    it('should return empty array when directory does not exist', async () => {
      const result = await store.list('provider');
      expect(result).toEqual([]);
    });

    it('should list JSON files in provider directory', async () => {
      const providerDir = path.join(tempDir, 'provider');
      await fs.mkdir(providerDir, { recursive: true });
      await fs.writeFile(path.join(providerDir, 'api-v1.json'), '{}');
      await fs.writeFile(path.join(providerDir, 'api-v2.json'), '{}');
      await fs.writeFile(path.join(providerDir, 'readme.txt'), 'not json');

      const result = await store.list('provider');

      expect(result).toEqual(['api-v1.json', 'api-v2.json']);
    });

    it('should list JSON files in consumer directory', async () => {
      const consumerDir = path.join(tempDir, 'consumer');
      await fs.mkdir(consumerDir, { recursive: true });
      await fs.writeFile(path.join(consumerDir, 'mobile-app.json'), '{}');
      await fs.writeFile(path.join(consumerDir, 'web-app.json'), '{}');

      const result = await store.list('consumer');

      expect(result).toEqual(['mobile-app.json', 'web-app.json']);
    });

    it('should return sorted file list', async () => {
      const providerDir = path.join(tempDir, 'provider');
      await fs.mkdir(providerDir, { recursive: true });
      await fs.writeFile(path.join(providerDir, 'zebra.json'), '{}');
      await fs.writeFile(path.join(providerDir, 'apple.json'), '{}');
      await fs.writeFile(path.join(providerDir, 'middle.json'), '{}');

      const result = await store.list('provider');

      expect(result).toEqual(['apple.json', 'middle.json', 'zebra.json']);
    });

    it('should only include .json files', async () => {
      const providerDir = path.join(tempDir, 'provider');
      await fs.mkdir(providerDir, { recursive: true });
      await fs.writeFile(path.join(providerDir, 'spec.json'), '{}');
      await fs.writeFile(path.join(providerDir, 'spec.yaml'), 'yaml content');
      await fs.writeFile(path.join(providerDir, 'readme.md'), 'markdown');

      const result = await store.list('provider');

      expect(result).toEqual(['spec.json']);
    });
  });

  describe('load', () => {
    it('should load JSON file from provider directory', async () => {
      const providerDir = path.join(tempDir, 'provider');
      await fs.mkdir(providerDir, { recursive: true });
      const spec = { openapi: '3.0.0', info: { title: 'Test API', version: '1.0.0' } };
      await fs.writeFile(path.join(providerDir, 'api-v1.json'), JSON.stringify(spec));

      const result = await store.load('provider', 'api-v1.json');

      expect(result).toEqual(spec);
    });

    it('should load JSON file from consumer directory', async () => {
      const consumerDir = path.join(tempDir, 'consumer');
      await fs.mkdir(consumerDir, { recursive: true });
      const spec = { openapi: '3.0.0', paths: {} };
      await fs.writeFile(path.join(consumerDir, 'mobile.json'), JSON.stringify(spec));

      const result = await store.load('consumer', 'mobile.json');

      expect(result).toEqual(spec);
    });

    it('should throw error if file does not have .json extension', async () => {
      await expect(store.load('provider', 'api-v1.yaml')).rejects.toThrow(
        'Contract must be .json: api-v1.yaml'
      );
    });

    it('should throw error if file does not exist', async () => {
      await expect(store.load('provider', 'nonexistent.json')).rejects.toThrow();
    });

    it('should parse complex JSON correctly', async () => {
      const providerDir = path.join(tempDir, 'provider');
      await fs.mkdir(providerDir, { recursive: true });
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Banking API', version: '2.0.0' },
        paths: {
          '/accounts': {
            get: {
              operationId: 'listAccounts',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: { type: 'array' },
                    },
                  },
                },
              },
            },
          },
        },
      };
      await fs.writeFile(path.join(providerDir, 'banking.json'), JSON.stringify(spec, null, 2));

      const result = await store.load('provider', 'banking.json');

      expect(result).toEqual(spec);
      expect(result.paths['/accounts'].get.operationId).toBe('listAccounts');
    });

    it('should fallback to root directory if kind directory does not exist', async () => {
      const spec = { openapi: '3.0.0' };
      await fs.writeFile(path.join(tempDir, 'legacy.json'), JSON.stringify(spec));

      const result = await store.load('provider', 'legacy.json');

      expect(result).toEqual(spec);
    });
  });

  describe('integration', () => {
    it('should list and load multiple contracts', async () => {
      const providerDir = path.join(tempDir, 'provider');
      await fs.mkdir(providerDir, { recursive: true });
      await fs.writeFile(
        path.join(providerDir, 'api-v1.json'),
        JSON.stringify({ version: '1.0' })
      );
      await fs.writeFile(
        path.join(providerDir, 'api-v2.json'),
        JSON.stringify({ version: '2.0' })
      );

      const consumerDir = path.join(tempDir, 'consumer');
      await fs.mkdir(consumerDir, { recursive: true });
      await fs.writeFile(
        path.join(consumerDir, 'mobile.json'),
        JSON.stringify({ client: 'mobile' })
      );

      const providers = await store.list('provider');
      expect(providers).toHaveLength(2);
      expect(providers).toContain('api-v1.json');
      expect(providers).toContain('api-v2.json');

      const consumers = await store.list('consumer');
      expect(consumers).toHaveLength(1);
      expect(consumers).toContain('mobile.json');

      const v1 = await store.load('provider', 'api-v1.json');
      expect(v1.version).toBe('1.0');

      const mobile = await store.load('consumer', 'mobile.json');
      expect(mobile.client).toBe('mobile');
    });
  });
});
