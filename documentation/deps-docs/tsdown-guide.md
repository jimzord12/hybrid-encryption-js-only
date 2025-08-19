# tsdown: The Modern TypeScript Library Bundler

**tsdown is the official successor to tsup, built on Rust-powered Rolldown for
blazing-fast TypeScript library bundling.** This next-generation tool offers 49%
faster build times, ESM-first architecture, and native support for modern
TypeScript features like isolated declarations. With official endorsement from
both the tsup maintainer and the Vite ecosystem, tsdown represents the future of
TypeScript library bundling.

The bundler addresses critical gaps in existing tools by providing unified
transpilation and type generation, superior ESM support, and purpose-built
library optimization. Unlike application bundlers, tsdown is specifically
designed for library authors who need reliable, fast builds with multiple output
formats and sophisticated dependency management.

## Understanding tsdown's foundation and advantages

tsdown positions itself as "The Elegant Library Bundler," leveraging
**Rolldown's Rust-based engine** with the Oxc transformer for exceptional
performance. Built by Kevin Deng (sxzz), tsup's second-highest contributor, the
tool maintains high compatibility with tsup while addressing its fundamental
limitations.

The architecture delivers significant advantages over esbuild-based solutions.
**Performance benchmarks show 49% improvement** in build times for complex
monorepos, while the ESM-first approach eliminates common module system
complications. Native support for TypeScript 5.5+ isolated declarations provides
faster type generation than both tsup and traditional TypeScript compiler
workflows.

Key differentiators include powerful ecosystem support spanning Rollup,
Rolldown, unplugin, and selected Vite plugins. The tool's **preconfigured
sensible defaults** eliminate extensive setup while maintaining flexibility for
complex scenarios. Unlike general-purpose bundlers, tsdown optimizes
specifically for library distribution patterns.

## Installation and project setup

Getting started requires **Node.js 20.19 or higher**, with experimental support
for Deno and Bun runtimes. Installation follows standard package manager
patterns:

```bash
# Choose your package manager
npm install -D tsdown
pnpm add -D tsdown
yarn add -D tsdown
bun add -D tsdown
```

For projects not using isolated declarations, also install TypeScript:

```bash
npm install -D typescript
```

**Quick project initialization** uses the create command:

```bash
npm create tsdown@latest
```

This generates optimized starter templates with proper configuration for modern
TypeScript development, including isolated declarations setup and recommended
project structure.

## Configuration architecture and options

tsdown searches for configuration files in priority order: `tsdown.config.ts`,
`.mts`, `.cts`, `.js`, `.mjs`, `.cjs`, `.json`, and finally the `tsdown` field
in package.json. This flexible approach accommodates various project structures
and preferences.

**Basic configuration** leverages TypeScript for type safety:

```typescript
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  platform: 'neutral',
});
```

**Advanced multi-configuration** supports different build targets:

```typescript
export default [
  defineConfig({
    entry: 'src/node.ts',
    platform: 'node',
    format: ['esm', 'cjs'],
  }),
  defineConfig({
    entry: 'src/browser.ts',
    platform: 'browser',
    format: ['esm', 'iife'],
  }),
];
```

Core configuration options include entry point specification (string, array, or
object), output formats (esm, cjs, iife, umd), platform targeting (node,
browser, neutral), and comprehensive dependency management through
external/noExternal arrays. **TypeScript declaration generation** supports both
traditional and isolated approaches with fine-grained control over bundling
behavior.

## Multi-module library bundling mastery

tsdown excels at complex library architectures through sophisticated entry point
management and output strategies. **Multi-entry configuration** supports various
patterns:

```typescript
export default defineConfig({
  entry: {
    main: 'src/index.ts',
    utils: 'src/utils.ts',
    client: 'src/client/index.ts',
    server: 'src/server/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
});
```

**Glob pattern support** enables automatic entry point discovery:

```typescript
export default defineConfig({
  entry: 'src/**/*.ts',
  unbundle: true, // Preserve module structure
  format: ['esm'],
});
```

For sophisticated architectures, **multiple configuration arrays** provide
targeted builds:

```typescript
export default [
  // Core library
  defineConfig({
    entry: 'src/core/index.ts',
    platform: 'neutral',
    outDir: 'dist/core',
    external: ['lodash'],
  }),

  // Browser client
  defineConfig({
    entry: 'src/client/index.ts',
    platform: 'browser',
    format: ['esm', 'iife'],
    outDir: 'dist/client',
  }),

  // Node.js server
  defineConfig({
    entry: 'src/server/index.ts',
    platform: 'node',
    outDir: 'dist/server',
    external: ['fs', 'path', 'http'],
  }),
];
```

## Best practices for complex library architectures

**Unbundle mode** proves essential for libraries requiring granular module
access. This mode maintains one-to-one file mapping, allowing consumers to
import specific modules without loading entire bundles:

```typescript
export default defineConfig({
  entry: 'src/index.ts',
  unbundle: true,
  format: ['esm'],
  treeshake: true,
});
```

**Dependency management strategy** requires careful consideration of what to
bundle versus externalize. Dependencies and peerDependencies default to
external, while devDependencies only bundle when imported. Strategic external
configuration keeps bundles lightweight:

```typescript
export default defineConfig({
  external: ['lodash', /^@my-scope\//], // External patterns
  noExternal: ['shared-utils'], // Force bundling
  dts: {
    resolve: ['utility-types'], // Bundle types selectively
  },
});
```

**Performance optimization** leverages isolated declarations for dramatically
faster builds:

```json
// tsconfig.json
{
  "compilerOptions": {
    "isolatedDeclarations": true
  }
}
```

This TypeScript 5.5+ feature enables **native type generation** that outperforms
both tsup's experimental approach and traditional TypeScript compilation.

## Configuration examples for production libraries

**Complete library setup** with multiple distribution formats:

```typescript
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    '.': 'src/index.ts',
    utils: 'src/utils.ts',
    types: 'src/types.ts',
  },
  format: ['esm', 'cjs', 'umd'],
  globalName: 'MyLibrary', // Required for UMD
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  exports: true, // Auto-generate package.json exports
  clean: true,
});
```

**Monorepo workspace configuration** handles complex dependency relationships:

```typescript
// packages/core/tsdown.config.ts
export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  external: ['@workspace/shared'],
  dts: true,
});

// packages/ui/tsdown.config.ts
export default defineConfig({
  entry: 'src/index.ts',
  platform: 'browser',
  noExternal: ['@workspace/core'], // Bundle workspace deps
  format: ['esm', 'cjs'],
});
```

**Environment-specific builds** enable targeted optimization:

```typescript
export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  env: { NODE_ENV: 'production' },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  shims: true, // Node.js compatibility shims
  minify: process.env.NODE_ENV === 'production',
});
```

## Command line usage and workflow integration

**Essential CLI commands** provide comprehensive control:

```bash
# Basic building
npx tsdown                    # Use config file
npx tsdown src/index.ts       # Specific entry point
npx tsdown --watch           # Development mode

# Format and output control
npx tsdown --format esm,cjs  # Multiple formats
npx tsdown --platform node   # Target platform
npx tsdown --dts             # Generate declarations

# Advanced options
npx tsdown --unbundle        # Preserve module structure
npx tsdown --exports         # Auto-generate package.json exports
npx tsdown --on-success "echo Build complete!"
```

**Development workflow integration** supports modern practices:

```json
// package.json scripts
{
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "build:prod": "tsdown --minify --clean",
    "type-check": "tsc --noEmit"
  }
}
```

**Migration from tsup** utilizes dedicated automation:

```bash
# Automatic migration
npx tsdown migrate
npx tsdown migrate --dry-run  # Preview changes
npx tsdown migrate --cwd ./packages/my-lib
```

The migration tool handles configuration conversion, including `bundle: false`
to `unbundle: true` transformation and script consolidation.

## Package.json integration and distribution

**Modern package.json setup** leverages tsdown's export generation capabilities:

```json
{
  "name": "my-library",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.js",
      "require": "./dist/utils.cjs",
      "types": "./dist/utils.d.ts"
    }
  },
  "files": ["dist"],
  "engines": {
    "node": ">=16"
  }
}
```

**Automatic export generation** eliminates manual maintenance:

```bash
tsdown --exports  # Generates exports field based on entry points
```

This feature **analyzes build outputs** and creates appropriate export maps
supporting both ESM and CommonJS consumers with proper type declarations.

## Modern TypeScript development features

tsdown provides **cutting-edge TypeScript support** through several advanced
features. Native isolated declarations support delivers dramatically faster type
generation than traditional approaches. The ESM-first architecture ensures
proper file extensions and module resolution.

**Advanced dependency handling** includes the innovative `nodeProtocol` option
controlling Node.js built-in imports:

```typescript
export default defineConfig({
  nodeProtocol: true, // fs → node:fs
  // or 'strip'           // node:fs → fs
  // or false             // Keep as-is
});
```

**Plugin ecosystem integration** spans multiple bundler ecosystems:

```typescript
import { defineConfig } from 'tsdown';
import someRollupPlugin from 'rollup-plugin-example';
import unpluginExample from 'unplugin-example';

export default defineConfig({
  plugins: [
    someRollupPlugin(),
    unpluginExample(),
    // Supports Rolldown, Rollup, unplugin, some Vite plugins
  ],
});
```

**Experimental Vite integration** enables configuration reuse:

```bash
tsdown --from-vite        # Use existing vite.config.*
tsdown --from-vite vitest # Use vitest configuration
```

## Migration strategy and practical implementation

**Migration assessment** should consider project complexity and stability
requirements. tsdown offers excellent compatibility with tsup's main features
while providing significant improvements in performance and ESM support.
Projects requiring maximum stability might wait for 1.0 release, though many
teams successfully use tsdown in production.

**Step-by-step migration process**:

1. **Enable isolated declarations** in tsconfig.json
2. **Fix export annotations** to satisfy TypeScript's strict requirements
3. **Run automated migration**: `npx tsdown migrate --dry-run`
4. **Update build scripts** to consolidate tsup + tsc workflows
5. **Validate output** using tools like `@arethetypeswrong/cli`
6. **Test thoroughly** before production deployment

**Critical validation** requires comparing tsup and tsdown outputs, implementing
automated tests for transpiled files, and considering major version bumps to
avoid subtle compatibility issues.

## Community resources and ecosystem maturity

**Current adoption** shows 105,670 weekly downloads with growing ecosystem
integration. The tool enjoys official Rolldown project status and endorsement
from Evan You (Vite creator). Notable projects including unplugin ecosystem
tools demonstrate production readiness.

**Documentation quality** provides comprehensive official resources at
tsdown.dev, including interactive StackBlitz playground and detailed migration
guides. However, **community content remains limited** with minimal presence on
tutorial platforms, Stack Overflow, or video content.

**Development velocity** shows active maintenance with rapid bug fixes and
regular updates. Primary maintainer sxzz provides responsive support, though the
relatively small community means fewer third-party resources compared to
established tools.

## Conclusion

tsdown represents a significant evolution in TypeScript library bundling,
offering substantial improvements over tsup while maintaining compatibility and
ease of use. The combination of Rust-powered performance, ESM-first
architecture, and modern TypeScript features makes it an compelling choice for
library authors. While still in beta, active development and growing ecosystem
support position tsdown as the definitive solution for TypeScript library
bundling, especially for teams requiring sophisticated multi-module
architectures and cutting-edge tooling integration.
