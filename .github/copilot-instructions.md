# GitHub Copilot Instructions

## Project Overview

This is a **Hybrid Encryption TypeScript Library** that implements secure encryption using a combination of RSA (asymmetric) and AES-GCM (symmetric) cryptography. The library provides production-ready encryption/decryption capabilities with automatic key management, rotation, and enterprise-level security features.

### Key Features
- **Hybrid Encryption**: RSA + AES-GCM for optimal security and performance
- **Automatic Key Management**: Singleton-based key manager with rotation support
- **Strategy Pattern Architecture**: Algorithm-agnostic design for future cryptographic algorithm support
- **Production Ready**: Comprehensive error handling, logging, and monitoring
- **Cross-Platform**: Works in Node.js environments with filesystem operations
- **TypeScript First**: Full type safety and IntelliSense support

## Architecture & Design Patterns

### Core Modules
- **`src/core/`**: Core encryption and key management logic
- **`src/client/`**: Client-side utilities and round-trip testing
- **`src/server/`**: Server-side middleware, routes, and cron jobs
- **`src/types/`**: Shared TypeScript type definitions

### Design Patterns Applied
1. **Strategy Pattern**: For algorithm-agnostic key providers (`KeyProvider` interface)
2. **Singleton Pattern**: For `KeyManager` instance management
3. **Factory Pattern**: For creating appropriate key providers (`KeyProviderFactory`)
4. **Repository Pattern**: For key storage and serialization

## Technology Stack

### Runtime & Language
- **Node.js** (ES Modules)
- **TypeScript** with strict type checking
- **ESLint** for code quality
- **Prettier** for code formatting

### Cryptography Libraries
- **`node-forge`**: RSA key generation and RSA encryption/decryption
- **`@noble/ciphers`**: Modern AES-GCM implementation for symmetric encryption

### Testing & Development
- **Vitest**: Unit testing framework with fast execution
- **@vitest/spy**: Mocking and spying utilities
- **@vitest/ui**: Visual testing interface
- **tsx**: TypeScript execution for development
- **nodemon**: Hot reloading during development

### File System & Storage
- **fs/promises**: Async file operations for key storage
- **path**: Cross-platform path handling

## Repository Structure Guidelines

### Maintain This Exact Structure
```
src/
├── client/           # Client-side utilities
│   ├── encrypt.ts    # Client encryption utilities
│   ├── index.ts      # Client exports
│   └── utils.ts      # Client helper functions
├── core/             # Core cryptographic logic
│   ├── constants.ts  # Global constants
│   ├── index.ts      # Core exports
│   ├── encryption/   # Encryption implementations
│   ├── key-rotation/ # Key management (Strategy Pattern)
│   ├── providers/    # Key provider implementations
│   ├── types/        # Core type definitions
│   └── utils/        # Core utilities
├── server/           # Server-side components
│   ├── index.ts      # Server exports
│   ├── cron/         # Scheduled tasks
│   ├── middleware/   # Express middleware
│   ├── routes/       # API endpoints
│   └── storage/      # Storage abstractions
└── types/            # Shared type definitions

tests/                # Test files mirror src/ structure
├── core/
├── setup/
└── vitest/

documentation/        # Technical documentation
examples/            # Usage examples and demos
config/              # Configuration files and certificates
```

### File Naming Conventions
- **kebab-case** for files: `key-management.test.ts`
- **PascalCase** for classes: `KeyManager`, `RSAKeyProvider`
- **camelCase** for functions and variables: `generateKeyPair`, `isKeyPairExpired`
- **UPPER_SNAKE_CASE** for constants: `DEFAULT_KEY_SIZE`, `MIN_KEY_SIZE`

## Coding Standards & Best Practices

### TypeScript Guidelines
```typescript
// ✅ Always use explicit return types for public APIs
export function generateKeyPair(keySize: number): RSAKeyPair {
  // implementation
}

// ✅ Use proper interface definitions
interface KeyManagerConfig {
  certPath?: string;
  algorithm?: 'rsa' | 'ecc' | 'ed25519';
  keySize?: number;
}

// ✅ Use type guards for runtime validation
function isValidKeyPair(obj: unknown): obj is RSAKeyPair {
  return typeof obj === 'object' && obj !== null &&
         'publicKey' in obj && 'privateKey' in obj;
}

// ✅ Use generic types for reusable functions
function decrypt<T = any>(data: EncryptedData, privateKey: string): T {
  // implementation
}
```

### Error Handling Patterns
```typescript
// ✅ Always wrap async operations in try-catch
try {
  const result = await cryptographicOperation();
  return result;
} catch (error) {
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// ✅ Use custom error types for specific scenarios
class KeyRotationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'KeyRotationError';
  }
}
```

### Testing Requirements
```typescript
// ✅ Every public function must have unit tests
describe('KeyManager', () => {
  beforeEach(() => {
    KeyManager.resetInstance(); // Clean state for each test
  });

  it('should generate valid key pairs', async () => {
    const manager = KeyManager.getInstance();
    await manager.initialize();
    const keyPair = await manager.getKeyPair();

    expect(keyPair).toBeDefined();
    expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
  });
});

// ✅ Test error conditions
it('should throw when invalid config provided', () => {
  expect(() => {
    new KeyManager({ keySize: 1024 }); // Too small
  }).toThrow('Key size must be at least 2048 bits');
});
```

### Logging and Monitoring
```typescript
// ✅ Use descriptive console logs with emojis for readability
console.log('🔑 Generating new RSA key pair...');
console.log('✅ Key rotation completed successfully');
console.warn('⚠️ Failed to backup expired keys:', error);
console.error('❌ Key validation failed:', errors);

// ✅ Include context in error messages
throw new Error(`Key generation failed for algorithm ${algorithm}: ${error.message}`);
```

## Strategy Pattern Implementation

### Key Provider Interface
When implementing new cryptographic algorithms, always follow this pattern:

```typescript
export class NewAlgorithmKeyProvider implements KeyProvider {
  getAlgorithm(): 'new-algorithm' { return 'new-algorithm'; }

  generateKeyPair(config: KeyGenerationConfig): CryptoKeyPair {
    // Algorithm-specific implementation
  }

  validateKeyPair(keyPair: CryptoKeyPair): boolean {
    // Algorithm-specific validation
  }

  // ... implement all required methods
}

// Register with factory
KeyProviderFactory.registerProvider('new-algorithm', () => new NewAlgorithmKeyProvider());
```

### Backward Compatibility Rules
- **NEVER** break existing RSA functionality
- **ALWAYS** maintain file format compatibility
- **ENSURE** all existing tests continue to pass
- **PROVIDE** migration paths for configuration changes

## Security Requirements

### Cryptographic Standards
- **RSA**: Minimum 2048-bit keys (default), support up to 4096-bit
- **AES**: Use AES-GCM with 256-bit keys (configurable: 128, 192, 256)
- **Random Generation**: Use cryptographically secure random number generation
- **Key Storage**: Private keys stored with 0o600 permissions (owner read/write only)

### Input Validation
```typescript
// ✅ Always validate cryptographic inputs
function encrypt(data: any, publicKey: string): EncryptedData {
  if (!publicKey) {
    throw new Error('Public key is required for encryption');
  }

  if (data == null) {
    throw new Error('Invalid data: Data must be a non-null object');
  }

  // ... proceed with encryption
}
```

### Key Management Security
- **Automatic Rotation**: Keys expire and rotate automatically
- **Grace Period**: Support old keys during rotation for zero-downtime
- **Backup Strategy**: Secure backup of expired keys
- **Version Tracking**: Track key versions and rotation history

## Performance Guidelines

### Async Operations
```typescript
// ✅ Use Promise.all for parallel operations
const [publicKey, privateKey, metadata] = await Promise.all([
  fs.readFile(publicKeyPath, 'utf8'),
  fs.readFile(privateKeyPath, 'utf8'),
  fs.readFile(metadataPath, 'utf8')
]);

// ✅ Implement proper caching
private keyCache = new Map<string, CryptoKeyPair>();

public async getKeyPair(): Promise<CryptoKeyPair> {
  const cached = this.keyCache.get('current');
  if (cached && !this.needsRotation()) {
    return cached;
  }
  // ... load and cache
}
```

### Memory Management
- **Singleton Usage**: Use `KeyManager.getInstance()` properly
- **Cleanup**: Always call `KeyManager.resetInstance()` in tests
- **Timers**: Clear all timers and intervals in cleanup methods

## Integration Guidelines

### Express.js Middleware
```typescript
// ✅ Proper middleware implementation
export function encryptionMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keyManager = KeyManager.getInstance();
      req.publicKey = await keyManager.getPublicKey();
      next();
    } catch (error) {
      next(error); // Pass errors to error handler
    }
  };
}
```

### Error Boundaries
- **Graceful Degradation**: System should handle key rotation failures
- **Retry Logic**: Implement exponential backoff for transient failures
- **Circuit Breaker**: Fail fast when key operations consistently fail

## Documentation Requirements

### JSDoc Comments
```typescript
/**
 * Encrypts data using hybrid RSA + AES-GCM encryption
 * @param data - The data to encrypt (will be JSON stringified)
 * @param publicKeyPem - RSA public key in PEM format
 * @param options - Encryption options (key size, padding)
 * @returns Encrypted data structure with all necessary components
 * @throws {Error} When encryption fails or invalid inputs provided
 * @example
 * ```typescript
 * const encrypted = HybridEncryption.encrypt(
 *   { user: 'john', balance: 1000 },
 *   publicKey,
 *   { keySize: 256 }
 * );
 * ```
 */
```

### README Updates
- **Always** update examples when APIs change
- **Include** migration guides for breaking changes
- **Provide** performance benchmarks for crypto operations

## Contribution Guidelines

### Before Making Changes
1. **Run Tests**: `npm test` - ensure all tests pass
2. **Type Check**: `npm run build` - verify TypeScript compilation
3. **Code Style**: Follow existing patterns and ESLint rules

### When Adding Features
1. **Strategy Pattern**: Use providers for algorithm-specific code
2. **Backward Compatibility**: Never break existing RSA functionality
3. **Test Coverage**: Add comprehensive unit tests
4. **Documentation**: Update relevant documentation files

### When Fixing Bugs
1. **Root Cause**: Identify the underlying issue
2. **Test Case**: Add test that reproduces the bug
3. **Minimal Fix**: Make smallest change that fixes the issue
4. **Regression Test**: Ensure fix doesn't break other functionality

## Quality Checklist

Before submitting any code changes, verify:

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No console errors or warnings in test output
- [ ] Code follows established patterns and conventions
- [ ] Public APIs have proper TypeScript types
- [ ] Error handling is comprehensive and informative
- [ ] Performance-sensitive operations are optimized
- [ ] Security best practices are followed
- [ ] Documentation is updated for API changes
- [ ] Backward compatibility is maintained

## Remember
This library handles sensitive cryptographic operations. **Security, reliability, and maintainability** are the top priorities. When in doubt, favor explicit code over clever optimizations, and comprehensive error handling over assumptions about input validity.
