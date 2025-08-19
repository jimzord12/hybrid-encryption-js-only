import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const baseDir = '../../dist';

const serverDir = `${baseDir}/server/server.js`;
// const serverDirCJS = `${baseDir}/server/server.cjs`;

const clientDir = `${baseDir}/client/client.js`;

const coreDir = `${baseDir}/core/core.js`;
// const coreDirCJS = `${baseDir}/core/core.cjs`;

const utilsDir = `${baseDir}/utils/utils.js`;
const utilsDirCJS = `${baseDir}/utils/utils.cjs`;

describe('Functionality Tests', () => {
  describe('Server Module', () => {
    it('should work with Node.js built-ins', async () => {
      const serverModule = await import(serverDir);

      // Test that Node.js built-ins are properly externalized
      // This should not throw errors about missing modules
      expect(serverModule).toBeDefined();

      // If you have specific server functions, test them here:
      // if (serverModule.someEncryptionFunction) {
      //   const result = await serverModule.someEncryptionFunction('test data');
      //   expect(result).toBeDefined();
      // }
    });
  });

  describe('Client Module', () => {
    it('should work in browser-like environment', async () => {
      const clientModule = await import(clientDir);

      // Test browser-specific functionality
      expect(clientModule).toBeDefined();

      // Test that no Node.js built-ins are included by reading the actual bundle
      const clientBundlePath = join(__dirname, clientDir);
      const moduleString = readFileSync(clientBundlePath, 'utf-8');
      expect(moduleString).not.toContain('node:fs');
      expect(moduleString).not.toContain('node:path');
    });
  });

  describe('Core Module', () => {
    it('should handle platform-specific features correctly', async () => {
      const coreModule = await import(coreDir);

      expect(coreModule).toBeDefined();

      // Test that Node.js modules are externalized, not bundled
      // This means they should be imported at runtime, not included in bundle
    });
  });

  describe('Utils Module', () => {
    it('should provide platform-neutral utilities', async () => {
      const utilsModule = await import(utilsDir);

      expect(utilsModule).toBeDefined();

      // Test platform-neutral functionality
      // if (utilsModule.someUtilityFunction) {
      //   const result = utilsModule.someUtilityFunction('test');
      //   expect(result).toBeDefined();
      // }
    });

    it('should work in both Node.js and browser environments', async () => {
      const utilsESM = await import(utilsDir);
      const utilsCJS = await import(utilsDirCJS);

      expect(utilsESM).toBeDefined();
      expect(utilsCJS).toBeDefined();

      // Both should export the same core functionality (ignoring ESM/CJS differences)
      // ESM modules may have named exports, CJS modules may have default exports
      const esmKeys = Object.keys(utilsESM).filter((key) => key !== 'default');
      const cjsKeys = Object.keys(utilsCJS).filter((key) => key !== 'default');

      // Check that we have exports in both formats
      expect(esmKeys.length).toBeGreaterThan(0);
      expect(cjsKeys.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-module Integration', () => {
    it('should allow modules to work together', async () => {
      const coreModule = await import(coreDir);
      const utilsModule = await import(utilsDir);
      const serverModule = await import(serverDir);

      // Test that modules can be used together
      expect(coreModule).toBeDefined();
      expect(utilsModule).toBeDefined();
      expect(serverModule).toBeDefined();

      // Add integration tests based on your actual module interactions
    });
  });
});
