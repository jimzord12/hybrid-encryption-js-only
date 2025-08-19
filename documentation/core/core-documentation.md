# Core Module Documentation

The **Core Module** (`src/core/`) is the foundation of the hybrid encryption
library, providing essential cryptographic operations, key management, and
utility functions. It implements a modern post-quantum secure hybrid encryption
approach using ML-KEM (asymmetric) and AES-GCM (symmetric) algorithms.

## 🔑 Key Features

- **🛡️ Post-Quantum Security**: ML-KEM (Machine Learning Key Encapsulation
  Mechanism) for quantum-resistant encryption
- **⚡ Hybrid Encryption**: Combines asymmetric and symmetric encryption for
  optimal security and performance
- **🔄 Automatic Key Management**: Singleton-based KeyManager with automatic
  rotation and grace period support
- **🎯 Type Safety**: Full TypeScript support with strict typing and branded
  types
- **🏗️ Strategy Pattern**: Algorithm-agnostic providers for extensibility
- **📊 Multiple Security Presets**: `NORMAL` and `HIGH_SECURITY` configurations
- **🧪 Comprehensive Testing**: Unit and integration tests with 100% coverage

## 📁 Module Structure

```
src/core/
├── index.ts                    # Main exports
├── common/                     # Shared types, interfaces, and utilities
│   ├── enums/                  # Security presets and configuration enums
│   ├── errors/                 # Custom error classes with context
│   ├── guards/                 # Runtime validation functions
│   ├── interfaces/             # Core type definitions
│   └── types/                  # Branded types and utilities
├── encryption/                 # Hybrid encryption implementation
│   ├── hybrid-encryption.ts    # Main HybridEncryption class
│   ├── asymmetric/            # ML-KEM asymmetric algorithms
│   ├── symmetric/             # AES-GCM symmetric algorithms
│   ├── constants/             # Encryption constants and defaults
│   └── interfaces/            # Algorithm interfaces
├── key-management/            # Comprehensive key management
│   ├── key-manager.ts         # Main KeyManager singleton
│   ├── services/              # Key lifecycle services
│   ├── constants/             # Key management defaults
│   ├── interfaces/            # Key management interfaces
│   └── types/                 # Key management types
├── providers/                 # Algorithm providers (Strategy Pattern)
│   ├── ml-kem-provider.ts     # ML-KEM key provider
│   └── interfaces/            # Provider interfaces
└── utils/                     # Core utility functions
    ├── buffer.utils.ts        # Binary data operations
    ├── comparison.utils.ts    # Deep comparison utilities
    ├── key-derivation.utils.ts # Key derivation functions
    └── serialization.utils.ts # Data serialization/deserialization
```

## 🏗️ Architecture Overview

### Hybrid Encryption Design

The core module implements a **KEM + AEAD (Authenticated Encryption with
Associated Data)** approach:

1. **Key Encapsulation Mechanism (KEM)**: ML-KEM for post-quantum security
2. **Authenticated Encryption**: AES-GCM for fast symmetric encryption
3. **Key Derivation**: HKDF for deriving symmetric keys from shared secrets

```typescript
// High-level flow
const encryption = new HybridEncryption(Preset.NORMAL);

// Encryption: data + public key → encrypted data
const encrypted = encryption.encrypt(data, publicKey);

// Decryption: encrypted data + secret key → original data
const decrypted = encryption.decrypt(encrypted, secretKey);
```

### Design Patterns

#### 1. Strategy Pattern

Algorithm implementations are abstracted through interfaces:

```typescript
interface AsymmetricAlgorithm {
  createSharedSecret(publicKey: Uint8Array): {
    sharedSecret: Uint8Array;
    cipherText: Uint8Array;
  };
  recoverSharedSecret(
    cipherText: Uint8Array,
    secretKey: Uint8Array,
  ): Uint8Array;
}

interface SymmetricAlgorithm {
  encrypt(data: Uint8Array, keyMaterial: AEADParams): EncryptionResult;
  decrypt(
    preset: Preset,
    data: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
  ): Uint8Array;
}
```

#### 2. Singleton Pattern

KeyManager ensures single instance management:

```typescript
const keyManager = KeyManager.getInstance(config);
```

#### 3. Repository Pattern

Storage abstraction for key persistence:

```typescript
interface KeyStorage {
  saveKeys(keys: KeyPair): Promise<void>;
  loadKeys(): Promise<KeyPair | null>;
}
```

## 🚀 Core Components

### 1. HybridEncryption

The main encryption class that orchestrates the hybrid encryption process.

**Key Methods:**

- `encrypt(data: any, publicKey: Uint8Array): EncryptedData`
- `decrypt<T>(encryptedData: EncryptedData, secretKey: Uint8Array): T`
- `decryptWithGracePeriod<T>(encryptedData: EncryptedData, secretKeys: Uint8Array[]): T`

**Features:**

- Automatic data serialization/deserialization
- Comprehensive input validation
- Grace period decryption for key rotation
- Detailed error reporting

### 2. KeyManager

Comprehensive key lifecycle management with automatic rotation.

**Key Methods:**

- `getInstance(config?: KeyManagerConfig): KeyManager`
- `initialize(): Promise<void>`
- `getKeyPair(): Promise<KeyPair>`
- `rotateKeys(): Promise<void>`
- `getDecryptionKeys(): Promise<KeyPair[]>`

**Features:**

- Singleton pattern with thread safety
- Automatic key generation and rotation
- Grace period support for zero-downtime
- File-based key persistence
- Comprehensive health monitoring

### 3. Utility Functions

Essential cryptographic and data processing utilities.

**Buffer Utils:**

- Base64 encoding/decoding
- Secure random byte generation
- Constant-time comparison

**Serialization Utils:**

- JSON serialization for encryption
- Binary data handling
- Type-safe deserialization

**Key Derivation Utils:**

- HKDF-based key derivation
- Preset-specific key lengths
- Secure key material generation

**Comparison Utils:**

- Deep object comparison
- Array equality checking
- Type-safe comparison options

## 📊 Security Presets

| Preset          | ML-KEM Variant | Key Length | Security Level | Use Case                   |
| --------------- | -------------- | ---------- | -------------- | -------------------------- |
| `NORMAL`        | ML-KEM-768     | 1184 bytes | NIST Level 1   | General applications       |
| `HIGH_SECURITY` | ML-KEM-1024    | 1568 bytes | NIST Level 3   | High-security applications |

## 🎯 Basic Usage

### Installation and Import

```typescript
import { HybridEncryption, KeyManager, Preset } from 'your-library/core';
```

### Simple Encryption/Decryption

```typescript
import { HybridEncryption, KeyManager, Preset } from 'your-library/core';

async function basicExample() {
  // Initialize key manager
  const keyManager = KeyManager.getInstance({
    preset: Preset.NORMAL,
    autoGenerate: true,
  });
  await keyManager.initialize();

  // Get key pair
  const keyPair = await keyManager.getKeyPair();

  // Create encryption instance
  const encryption = new HybridEncryption(Preset.NORMAL);

  // Your data
  const sensitiveData = {
    userId: 12345,
    email: 'user@example.com',
    balance: 1500.0,
  };

  // Encrypt
  const encrypted = encryption.encrypt(sensitiveData, keyPair.publicKey);
  console.log('Encrypted:', encrypted);

  // Decrypt
  const decrypted = encryption.decrypt(encrypted, keyPair.secretKey!);
  console.log('Decrypted:', decrypted);
}
```

### Advanced Usage with Grace Period

```typescript
async function advancedExample() {
  const keyManager = KeyManager.getInstance({
    preset: Preset.HIGH_SECURITY,
    rotationIntervalInMinutes: 60,
    rotationGracePeriodInMinutes: 10,
  });

  await keyManager.initialize();

  const encryption = new HybridEncryption(Preset.HIGH_SECURITY);

  // Get all available decryption keys (current + grace period)
  const keyPairs = await keyManager.getDecryptionKeys();
  const secretKeys = keyPairs.map((kp) => kp.secretKey!);

  // Decrypt with automatic fallback
  const decrypted = encryption.decryptWithGracePeriod(
    encryptedData,
    secretKeys,
  );
}
```

## 🛡️ Error Handling

The core module provides comprehensive error handling with context-aware error
types:

```typescript
import { createAppropriateError, EncryptionError } from 'your-library/core';

try {
  const result = encryption.encrypt(data, publicKey);
} catch (error) {
  if (error instanceof EncryptionError) {
    console.log('Encryption error:', error.message);
    console.log('Context:', error.context);
  }
}
```

### Error Types

- **ValidationError**: Input validation failures
- **AlgorithmAsymmetricError**: ML-KEM algorithm errors
- **AlgorithmSymmetricError**: AES-GCM algorithm errors
- **KeyManagerError**: Key management issues
- **FormatConversionError**: Serialization/deserialization errors
- **OperationError**: General operation failures

## 📈 Performance Considerations

### Algorithm Performance

| Operation          | ML-KEM-768 | ML-KEM-1024 | Notes                 |
| ------------------ | ---------- | ----------- | --------------------- |
| Key Generation     | ~1ms       | ~1.5ms      | One-time cost         |
| Encapsulation      | ~0.1ms     | ~0.15ms     | Per encryption        |
| Decapsulation      | ~0.1ms     | ~0.15ms     | Per decryption        |
| AES-GCM Encryption | ~0.01ms/KB | ~0.01ms/KB  | Linear with data size |

### Memory Usage

- **KeyManager Singleton**: Single instance across application
- **Key Caching**: Automatic caching of current and grace period keys
- **Secure Cleanup**: Automatic zeroing of sensitive key material

### Best Practices

```typescript
// ✅ Good: Reuse encryption instances
const encryption = new HybridEncryption(preset);
// Use encryption multiple times

// ✅ Good: Use singleton KeyManager
const keyManager = KeyManager.getInstance();

// ❌ Avoid: Creating multiple instances
const enc1 = new HybridEncryption(preset);
const enc2 = new HybridEncryption(preset); // Unnecessary
```

## 🧪 Testing Support

### Test Utilities

```typescript
import { KeyManager } from 'your-library/core';

beforeEach(() => {
  // Reset singleton for clean tests
  KeyManager.resetInstance();
});

test('encryption round trip', async () => {
  const keyManager = KeyManager.getInstance({ autoGenerate: true });
  await keyManager.initialize();

  const keyPair = await keyManager.getKeyPair();
  const encryption = new HybridEncryption();

  const data = { test: 'data' };
  const encrypted = encryption.encrypt(data, keyPair.publicKey);
  const decrypted = encryption.decrypt(encrypted, keyPair.secretKey!);

  expect(decrypted).toEqual(data);
});
```

### Mock Data Generation

```typescript
// Test helpers are available for generating mock data
import {
  generateMockKeyPair,
  generateMockEncryptedData,
} from 'your-library/test-utils';
```

## 🔗 Integration Points

### Client Module Integration

```typescript
// Client uses core for encryption
import { HybridEncryption } from 'your-library/core';

const encryption = new HybridEncryption(preset);
const encrypted = encryption.encrypt(data, serverPublicKey);
```

### Server Module Integration

```typescript
// Server uses core for decryption and key management
import { HybridEncryption, KeyManager } from 'your-library/core';

const keyManager = KeyManager.getInstance(config);
const encryption = new HybridEncryption(preset);
```

## 📚 Related Documentation

- [HybridEncryption Details](./hybrid-encryption.md)
- [KeyManager Details](./key-manager.md)
- [Core Utils](./core-utils.md)
- [Client Module](../client/client-encryption.md)
- [Server Module](../server/server-decryption.md)

## 🚀 Next Steps

1. **Explore Components**: Read detailed documentation for each component
2. **Try Examples**: Run the provided usage examples
3. **Integration**: Use with Client or Server modules
4. **Custom Providers**: Implement custom algorithm providers if needed
5. **Performance Testing**: Benchmark your specific use cases
