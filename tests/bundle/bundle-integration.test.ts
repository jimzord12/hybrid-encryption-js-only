import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Bundle Integration Tests', () => {
  // const distPath = getDirnameESM('../../dist');
  const distPath = resolve(process.cwd(), 'dist');
  console.log(distPath);

  beforeAll(() => {
    // Ensure dist directory exists
    expect(existsSync(distPath)).toBe(true);
  });

  describe('File Structure', () => {
    it('should have all module directories', () => {
      const expectedDirs = ['server', 'client', 'core', 'utils'];

      expectedDirs.forEach((dir) => {
        const dirPath = resolve(distPath, dir);
        expect(existsSync(dirPath)).toBe(true);
        expect(statSync(dirPath).isDirectory()).toBe(true);
      });
    });

    it('should have correct file extensions for each module', () => {
      // Server: ESM + CJS
      expect(existsSync(resolve(distPath, 'server/server.js'))).toBe(true);
      expect(existsSync(resolve(distPath, 'server/server.cjs'))).toBe(true);
      expect(existsSync(resolve(distPath, 'server/server.d.ts'))).toBe(true);
      expect(existsSync(resolve(distPath, 'server/server.d.cts'))).toBe(true);

      // Client: ESM only
      expect(existsSync(resolve(distPath, 'client/client.js'))).toBe(true);
      expect(existsSync(resolve(distPath, 'client/client.d.ts'))).toBe(true);
      expect(existsSync(resolve(distPath, 'client/client.cjs'))).toBe(false);

      // Core: ESM + CJS
      expect(existsSync(resolve(distPath, 'core/core.js'))).toBe(true);
      expect(existsSync(resolve(distPath, 'core/core.cjs'))).toBe(true);
      expect(existsSync(resolve(distPath, 'core/core.d.ts'))).toBe(true);

      // Utils: ESM + CJS
      expect(existsSync(resolve(distPath, 'utils/utils.js'))).toBe(true);
      expect(existsSync(resolve(distPath, 'utils/utils.cjs'))).toBe(true);
      expect(existsSync(resolve(distPath, 'utils/utils.d.ts'))).toBe(true);
    });

    it('should have source maps', () => {
      expect(existsSync(resolve(distPath, 'server/server.js.map'))).toBe(true);
      expect(existsSync(resolve(distPath, 'server/server.cjs.map'))).toBe(true);
      expect(existsSync(resolve(distPath, 'client/client.js.map'))).toBe(true);
      expect(existsSync(resolve(distPath, 'core/core.js.map'))).toBe(true);
      expect(existsSync(resolve(distPath, 'utils/utils.js.map'))).toBe(true);
    });
  });

  describe('File Sizes', () => {
    it('should have reasonable bundle sizes', () => {
      const checkFileSize = (filePath: string, maxSizeKB: number) => {
        const fullPath = resolve(distPath, filePath);
        if (existsSync(fullPath)) {
          const stats = statSync(fullPath);
          const sizeKB = stats.size / 1024;
          expect(sizeKB).toBeLessThan(maxSizeKB);
        }
      };

      // Set reasonable size limits (adjust based on your actual bundle sizes)
      checkFileSize('server/server.js', 120); // 120KB limit
      checkFileSize('client/client.js', 60); // 60KB limit
      checkFileSize('core/core.js', 100); // 100KB limit
      checkFileSize('utils/utils.js', 50); // 50KB limit
    });
  });
});
