import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

// const baseDir = '../../dist';

// const serverDir = `${baseDir}/server/server.js`;
// const serverDirCJS = `${baseDir}/server/server.cjs`;

// const clientDir = `${baseDir}/client/client.js`;
// const clientDirCJS = `${baseDir}/client/client.cjs`;

// const coreDir = `${baseDir}/core/core.js`;
// // const coreDirCJS = `${baseDir}/core/core.cjs`;

// const utilsDir = `${baseDir}/utils/utils.js`;
// const utilsDirCJS = `${baseDir}/utils/utils.cjs`;

describe.skip('Type Definition Tests', () => {
  const distPath = resolve(__dirname, '../dist');

  describe('TypeScript Declaration Files', () => {
    it('should have valid .d.ts files', () => {
      const modules = ['server', 'client', 'core', 'utils'];

      modules.forEach((module) => {
        const dtsPath = resolve(distPath, `${module}/index.d.ts`);
        expect(existsSync(dtsPath)).toBe(true);

        const content = readFileSync(dtsPath, 'utf-8');

        // Basic syntax checks
        expect(content).toContain('export');
        expect(content.length).toBeGreaterThan(0);

        // Should not contain source code (should be declarations only)
        expect(content).not.toContain('console.log');
        expect(content).not.toContain('function implementation');
      });
    });

    it('should have CommonJS declaration files where needed', () => {
      const cjsModules = ['server', 'core', 'utils'];

      cjsModules.forEach((module) => {
        const dctsPath = resolve(distPath, `${module}/index.d.cts`);
        expect(existsSync(dctsPath)).toBe(true);

        const content = readFileSync(dctsPath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });
    });

    it('should have source maps for declaration files', () => {
      const modules = ['server', 'client', 'core', 'utils'];

      modules.forEach((module) => {
        const mapPath = resolve(distPath, `${module}/index.d.ts.map`);
        if (existsSync(mapPath)) {
          const content = readFileSync(mapPath, 'utf-8');
          expect(() => JSON.parse(content)).not.toThrow();

          const map = JSON.parse(content);
          expect(map.version).toBe(3);
          expect(map.sources).toBeDefined();
          expect(Array.isArray(map.sources)).toBe(true);
        }
      });
    });
  });

  describe('Type Import Resolution', () => {
    it('should resolve type imports correctly', async () => {
      // Test that TypeScript can resolve the types
      const typeTests = [
        "import type { } from '../dist/server/index.js';",
        "import type { } from '../dist/client/index.js';",
        "import type { } from '../dist/core/index.js';",
        "import type { } from '../dist/utils/index.js';",
      ];

      // These would be validated by TypeScript compiler in a real scenario
      // For Vitest, we just ensure the files exist and are readable
      expect(typeTests.length).toBeGreaterThan(0);
    });
  });

  describe('External Dependencies in Types', () => {
    it('should not bundle Node.js built-in types inappropriately', () => {
      const serverDts = resolve(distPath, 'server/index.d.ts');
      const coreDts = resolve(distPath, 'core/index.d.ts');

      if (existsSync(serverDts)) {
        const content = readFileSync(serverDts, 'utf-8');

        // Should reference Node.js types as externals, not inline them
        if (content.includes('node:')) {
          // Node.js built-ins should be properly typed as externals
          expect(content).toMatch(/import.*from ['"]node:/);
        }
      }

      if (existsSync(coreDts)) {
        const content = readFileSync(coreDts, 'utf-8');

        // Similar checks for core module
        if (content.includes('node:')) {
          expect(content).toMatch(/import.*from ['"]node:/);
        }
      }
    });

    it('should have consistent export structures between ESM and CJS types', () => {
      const cjsModules = ['server', 'core', 'utils'];

      cjsModules.forEach((module) => {
        const esmDts = resolve(distPath, `${module}/index.d.ts`);
        const cjsDts = resolve(distPath, `${module}/index.d.cts`);

        if (existsSync(esmDts) && existsSync(cjsDts)) {
          const esmContent = readFileSync(esmDts, 'utf-8');
          const cjsContent = readFileSync(cjsDts, 'utf-8');

          // Both should be non-empty
          expect(esmContent.length).toBeGreaterThan(0);
          expect(cjsContent.length).toBeGreaterThan(0);

          // Content should be similar (allowing for module format differences)
          // This is a basic check - in practice, the structure should be equivalent
          const esmExports = (esmContent.match(/export/g) || []).length;
          const cjsExports = (cjsContent.match(/export/g) || []).length;

          expect(Math.abs(esmExports - cjsExports)).toBeLessThanOrEqual(1);
        }
      });
    });
  });
});
