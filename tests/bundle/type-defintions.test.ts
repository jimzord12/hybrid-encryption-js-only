import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('Type Definition Tests', () => {
  // const distPath = resolve(__dirname, '../dist');
  const distPath = resolve(process.cwd(), 'dist');
  const moduleNames = ['server', 'client', 'core', 'utils'];
  const moduleNamesCJS = ['server', 'core', 'utils'];
  const modulePathTemplate = '###/###.d.ts';
  const modulePathTemplateCJS = '###/###.d.cts';
  const moduleDirs = moduleNames.map((module) =>
    resolve(distPath, modulePathTemplate.replace(/###/g, module)),
  );
  const moduleDirsCJS = moduleNamesCJS.map((module) =>
    resolve(distPath, modulePathTemplateCJS.replace(/###/g, module)),
  );

  describe('TypeScript Declaration Files', () => {
    it('should have valid .d.ts files', () => {
      moduleDirs.forEach((modDir) => {
        const splitted = modDir.split('/');
        const name = splitted[splitted.length - 2];
        console.log(`Checking ESM module: ${name}`);
        expect(existsSync(modDir)).toBe(true);

        const content = readFileSync(modDir, 'utf-8');

        // Basic syntax checks
        expect(content).toContain('export');
        expect(content.length).toBeGreaterThan(0);

        // Should not contain source code (should be declarations only)
        if (name === 'utils') {
          // Convert the iterator to an array to see the results
          const totalConsoleLogs = content.match(/console\.log/g);
          if (totalConsoleLogs != null) expect(totalConsoleLogs?.length).toBeLessThanOrEqual(3);
        } else {
          expect(content).not.toContain('console.log');
        }
        expect(content).not.toContain('function implementation');
      });
    });

    it('should have CommonJS declaration files where needed', () => {
      moduleDirsCJS.forEach((modDir) => {
        console.log(`Checking CJS module: ${modDir}`);
        expect(existsSync(modDir)).toBe(true);

        const content = readFileSync(modDir, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });
    });

    it('should have source maps for declaration files', () => {
      moduleDirs.forEach((modDir) => {
        // Check for the corresponding .d.ts.map file
        const mapFile = modDir + '.map';
        if (existsSync(mapFile)) {
          const content = readFileSync(mapFile, 'utf-8');
          expect(() => JSON.parse(content)).not.toThrow();

          const map = JSON.parse(content);
          expect(map.version).toBe(3);
          expect(map.sources).toBeDefined();
          expect(Array.isArray(map.sources)).toBe(true);
        }
      });
    });
  });

  describe('External Dependencies in Types', () => {
    it('should not bundle Node.js built-in types inappropriately', () => {
      const serverDts = moduleDirs.find((dir) => dir.includes('server'));
      const coreDts = moduleDirs.find((dir) => dir.includes('core'));

      if (serverDts && existsSync(serverDts)) {
        const content = readFileSync(serverDts, 'utf-8');

        // Should reference Node.js types as externals, not inline them
        if (content.includes('node:')) {
          // Node.js built-ins should be properly typed as externals
          expect(content).toMatch(/import.*from ['"]node:/);
        }
      }

      if (coreDts && existsSync(coreDts)) {
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
          const esmExports = (esmContent.match(/export/g) ?? []).length;
          const cjsExports = (cjsContent.match(/export/g) ?? []).length;

          expect(Math.abs(esmExports - cjsExports)).toBeLessThanOrEqual(1);
        }
      });
    });
  });
});
