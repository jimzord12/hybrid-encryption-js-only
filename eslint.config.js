import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // Added this for type information
        tsconfigRootDir: import.meta.dirname, // Added this for correct path resolution
      },
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^error$', // Allow unused 'error' variables
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for this project
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for this project
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'warn', // Allow require in specific cases,
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error', // Added this complementary rule

      // General code quality rules
      'no-console': 'off', // Allow console.log for cryptographic operations logging
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript rule
      'no-undef': 'error',
      'no-empty': 'warn',

      // Security rules for cryptographic code
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Formatting rules (some will be handled by Prettier)
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'no-restricted-globals': [
        'error',
        {
          name: 'btoa',
          message: 'Use Buffer.from(data).toString("base64") or modern Web APIs instead of btoa',
        },
        {
          name: 'atob',
          message: 'Use Buffer.from(data, "base64").toString() or modern Web APIs instead of atob',
        },
        {
          name: 'escape',
          message: 'Use encodeURIComponent instead of the deprecated escape function',
        },
        {
          name: 'unescape',
          message: 'Use decodeURIComponent instead of the deprecated unescape function',
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: typescriptParser, // Added parser for test files
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // Added project for test files too
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        performance: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript, // Added plugins for test files
    },
    rules: {
      // More lenient rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Disable strict boolean expressions in tests for flexibility
      'no-unused-expressions': 'off', // Allow chai/expect expressions
      'no-empty': 'off', // Allow empty catch blocks in tests
    },
  },
  {
    files: ['vitest.config.ts', 'eslint.config.js', '**/*.config.ts', '**/*.config.js'],
    languageOptions: {
      parser: typescriptParser, // Added parser for config files
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Don't require project for config files to avoid circular dependencies
      },
    },
    plugins: {
      '@typescript-eslint': typescript, // Added plugins for config files
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Disable for config files
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '.vscode/**',
      '.github/**',
      'config/certs/**',
      'demo-certs-*/**',
      'examples/**', // Ignore examples as they may not be in tsconfig
    ],
  },
];
