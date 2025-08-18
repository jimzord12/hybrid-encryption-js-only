import { defineConfig } from 'tsdown';

const serverConfig = defineConfig({
  entry: {
    server: 'src/server/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  exports: true,
  platform: 'node',
  outDir: 'dist/server',
  external: ['node:fs/promises', 'node:path', 'node:process', 'node:crypto'],
});

const clientConfig = defineConfig({
  entry: {
    client: 'src/client/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  exports: true,
  outDir: 'dist/client',
  
  platform: 'browser',
});

const utilsConfig = defineConfig({
  entry: {
    utils: 'src/core/utils/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist/utils',
  platform: 'browser',
});

const coreConfig = defineConfig({
  entry: {
    core: 'src/core/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  platform: 'node',
  outDir: 'dist/core',
  external: ['node:fs/promises', 'node:path', 'node:process', 'node:crypto'],
});

export default [serverConfig, clientConfig, utilsConfig, coreConfig];
