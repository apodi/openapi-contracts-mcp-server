import { describe, it, expect } from '@jest/globals';
import { normalizeSpec } from '../../utils/normalize.js';

describe('normalizeSpec', () => {
  it('should return primitive values unchanged', () => {
    expect(normalizeSpec(null)).toBe(null);
    expect(normalizeSpec(undefined)).toBe(undefined);
    expect(normalizeSpec(42)).toBe(42);
    expect(normalizeSpec('test')).toBe('test');
    expect(normalizeSpec(true)).toBe(true);
  });

  it('should sort object keys alphabetically', () => {
    const input = {
      zebra: 1,
      apple: 2,
      middle: 3,
    };

    const result = normalizeSpec(input);
    const keys = Object.keys(result);

    expect(keys).toEqual(['apple', 'middle', 'zebra']);
    expect(result.apple).toBe(2);
    expect(result.middle).toBe(3);
    expect(result.zebra).toBe(1);
  });

  it('should sort nested object keys recursively', () => {
    const input = {
      z: {
        nested_z: 1,
        nested_a: 2,
      },
      a: {
        deep_z: 3,
        deep_a: 4,
      },
    };

    const result = normalizeSpec(input);
    const topKeys = Object.keys(result);
    const nestedAKeys = Object.keys(result.a);
    const nestedZKeys = Object.keys(result.z);

    expect(topKeys).toEqual(['a', 'z']);
    expect(nestedAKeys).toEqual(['deep_a', 'deep_z']);
    expect(nestedZKeys).toEqual(['nested_a', 'nested_z']);
  });

  it('should preserve array order', () => {
    const input = ['zebra', 'apple', 'middle'];
    const result = normalizeSpec(input);

    expect(result).toEqual(['zebra', 'apple', 'middle']);
  });

  it('should normalize objects within arrays', () => {
    const input = [
      { z: 1, a: 2 },
      { y: 3, b: 4 },
    ];

    const result = normalizeSpec(input);

    expect(Object.keys(result[0])).toEqual(['a', 'z']);
    expect(Object.keys(result[1])).toEqual(['b', 'y']);
  });

  it('should handle complex nested structures', () => {
    const input = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          post: { operationId: 'createUser' },
          get: { operationId: 'listUsers' },
        },
        '/accounts': {
          get: { operationId: 'listAccounts' },
        },
      },
      components: {
        schemas: {
          User: { type: 'object' },
          Account: { type: 'object' },
        },
      },
    };

    const result = normalizeSpec(input);

    // Top level keys should be sorted
    expect(Object.keys(result)).toEqual(['components', 'openapi', 'paths']);

    // Paths should be sorted
    expect(Object.keys(result.paths)).toEqual(['/accounts', '/users']);

    // Methods within paths should be sorted
    expect(Object.keys(result.paths['/users'])).toEqual(['get', 'post']);

    // Schemas should be sorted
    expect(Object.keys(result.components.schemas)).toEqual(['Account', 'User']);
  });

  it('should handle empty objects and arrays', () => {
    expect(normalizeSpec({})).toEqual({});
    expect(normalizeSpec([])).toEqual([]);
  });

  it('should handle OpenAPI spec example', () => {
    const input = {
      info: { title: 'API', version: '1.0.0' },
      openapi: '3.0.0',
      paths: {},
    };

    const result = normalizeSpec(input);
    const keys = Object.keys(result);

    expect(keys).toEqual(['info', 'openapi', 'paths']);
    expect(Object.keys(result.info)).toEqual(['title', 'version']);
  });
});
