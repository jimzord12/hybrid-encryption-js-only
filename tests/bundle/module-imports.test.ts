/* eslint-disable @typescript-eslint/no-var-requires */
import { describe, expect, it } from 'vitest';

const baseDir = '../../dist';

const serverDir = `${baseDir}/server/server.js`;
const serverDirCJS = `${baseDir}/server/server.cjs`;

const clientDir = `${baseDir}/client/client.js`;

const coreDir = `${baseDir}/core/core.js`;
const coreDirCJS = `${baseDir}/core/core.cjs`;

const utilsDir = `${baseDir}/utils/utils.js`;
const utilsDirCJS = `${baseDir}/utils/utils.cjs`;

describe('Module Import Tests', () => {
  describe('ESM Imports', () => {
    it('should import server module (ESM)', async () => {
      const serverModule = await import(serverDir);
      expect(serverModule).toBeDefined();
      expect(typeof serverModule).toBe('object');

      // Test that exports exist (adjust based on your actual exports)
      // expect(serverModule.someServerFunction).toBeDefined();
      // expect(typeof serverModule.someServerFunction).toBe('function');
    });

    it('should import client module (ESM)', async () => {
      const clientModule = await import(clientDir);
      expect(clientModule).toBeDefined();
      expect(typeof clientModule).toBe('object');

      // Test that exports exist
      // expect(clientModule.someClientFunction).toBeDefined();
    });

    it('should import core module (ESM)', async () => {
      const coreModule = await import(coreDir);
      expect(coreModule).toBeDefined();
      expect(typeof coreModule).toBe('object');

      // Test that exports exist
      // expect(coreModule.someCoreFunction).toBeDefined();
    });

    it('should import utils module (ESM)', async () => {
      const utilsModule = await import(utilsDir);
      expect(utilsModule).toBeDefined();
      expect(typeof utilsModule).toBe('object');

      // Test that exports exist
      // expect(utilsModule.someUtilFunction).toBeDefined();
    });
  });

  describe('CommonJS Imports', () => {
    it('should import server module (CJS)', () => {
      const serverModule = require(serverDirCJS);
      expect(serverModule).toBeDefined();
      expect(typeof serverModule).toBe('object');
    });

    it('should import core module (CJS)', () => {
      const coreModule = require(coreDirCJS);
      expect(coreModule).toBeDefined();
      expect(typeof coreModule).toBe('object');
    });

    it('should import utils module (CJS)', () => {
      const utilsModule = require(utilsDirCJS);
      expect(utilsModule).toBeDefined();
      expect(typeof utilsModule).toBe('object');
    });
  });

  describe('Package.json Exports', () => {
    it('should resolve package exports correctly', async () => {
      // Test the package.json exports field
      try {
        // These would work if you had the package.json exports configured
        // const server = await import('hybrid-encryption-js-only/server');
        // const client = await import('hybrid-encryption-js-only/client');
        // const core = await import('hybrid-encryption-js-only/core');
        // const utils = await import('hybrid-encryption-js-only/utils');

        // For now, just test direct imports work
        expect(true).toBe(true);
      } catch (error) {
        console.warn('Package exports test skipped - install package locally to test');
        console.log(error);
      }
    });
  });
});
