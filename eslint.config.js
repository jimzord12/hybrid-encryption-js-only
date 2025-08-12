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
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        NodeJS: 'readonly',
        require: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn', // Changed from 'error' to 'warn'
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^error$', // Allow unused 'error' variables
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for this project
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for this project
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'warn', // Allow require in specific cases

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
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    languageOptions: {
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
    rules: {
      // More lenient rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-unused-expressions': 'off', // Allow chai/expect expressions
      'no-empty': 'off', // Allow empty catch blocks in tests
    },
  },
  {
    files: ['vitest.config.ts', 'eslint.config.js', '**/*.config.ts', '**/*.config.js'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Don't require project for config files
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
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
