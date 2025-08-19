# Core Utils Module

The **Core Utils** (`src/core/utils/`) provides essential utility functions for
cryptographic operations, data processing, and type-safe comparisons. These
utilities form the foundation for secure data handling throughout the hybrid
encryption library.

## 🔑 Key Features

- **🛡️ Cryptographic Security**: Secure random byte generation and constant-time
  operations
- **📊 Data Serialization**: JSON-safe serialization for encryption with proper
  binary handling
- **🔐 Key Derivation**: HKDF-based key derivation with preset-specific
  parameters
- **🔍 Deep Comparison**: Type-safe deep object and array comparison utilities
- **⚡ Buffer Operations**: Efficient binary data manipulation and encoding
- **🎯 Type Safety**: Full TypeScript support with branded types and strict
  validation

## 📁 Module Structure

```
src/core/utils/
├── index.ts                    # Main exports and re-exports
├── buffer.utils.ts             # Binary data operations and encoding
├── comparison.utils.ts         # Deep comparison utilities
├── key-derivation.utils.ts     # Cryptographic key derivation
└── serialization.utils.ts      # Data serialization/deserialization
```

## 🚀 Core Utilities

### 1. Buffer Utils

Binary data operations, encoding, and cryptographic utilities.

#### Functions

##### `encodeBase64(data: Uint8Array): string`

Converts binary data to Base64 string encoding.

- **Parameters:** `data` - Binary data to encode
- **Returns:** Base64-encoded string
- **Example:**

  ```typescript
  import { encodeBase64 } from 'your-library/core/utils';

  const binaryData = new Uint8Array([72, 101, 108, 108, 111]);
  const encoded = encodeBase64(binaryData);
  console.log(encoded); // "SGVsbG8="
  ```

##### `decodeBase64(data: string): Uint8Array`

Converts Base64 string to binary data.

- **Parameters:** `data` - Base64-encoded string
- **Returns:** Binary data as Uint8Array
- **Throws:** Error if invalid Base64
- **Example:**

  ```typescript
  import { decodeBase64 } from 'your-library/core/utils';

  const encoded = 'SGVsbG8=';
  const decoded = decodeBase64(encoded);
  console.log(decoded); // Uint8Array([72, 101, 108, 108, 111])
  ```

##### `getSecureRandomBytes(length: number): Uint8Array`

Generates cryptographically secure random bytes.

- **Parameters:** `length` - Number of random bytes to generate
- **Returns:** Secure random bytes
- **Example:**

  ```typescript
  import { getSecureRandomBytes } from 'your-library/core/utils';

  const randomKey = getSecureRandomBytes(32); // 256-bit random key
  const nonce = getSecureRandomBytes(12); // AES-GCM nonce
  ```

##### `constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean`

Performs constant-time comparison of two byte arrays to prevent timing attacks.

- **Parameters:** `a`, `b` - Byte arrays to compare
- **Returns:** True if arrays are equal
- **Security:** Constant-time operation prevents timing side-channel attacks
- **Example:**

  ```typescript
  import { constantTimeEqual } from 'your-library/core/utils';

  const key1 = getSecureRandomBytes(32);
  const key2 = getSecureRandomBytes(32);

  // Secure comparison
  if (constantTimeEqual(key1, key2)) {
    console.log('Keys are identical');
  }
  ```

##### `stringToBinary(str: string): Uint8Array`

Converts UTF-8 string to binary data.

- **Parameters:** `str` - UTF-8 string
- **Returns:** Binary representation
- **Example:**

  ```typescript
  import { stringToBinary } from 'your-library/core/utils';

  const text = 'Hello, 世界!';
  const binary = stringToBinary(text);
  ```

##### `binaryToString(data: Uint8Array): string`

Converts binary data to UTF-8 string.

- **Parameters:** `data` - Binary data
- **Returns:** UTF-8 string
- **Example:**

  ```typescript
  import { binaryToString } from 'your-library/core/utils';

  const binary = new Uint8Array([72, 101, 108, 108, 111]);
  const text = binaryToString(binary); // "Hello"
  ```

#### BufferUtils Class

Provides static methods for all buffer operations:

```typescript
import { BufferUtils } from 'your-library/core/utils';

// All buffer operations available as static methods
const encoded = BufferUtils.encodeBase64(data);
const decoded = BufferUtils.decodeBase64(encoded);
const random = BufferUtils.getSecureRandomBytes(32);
```

### 2. Serialization Utils

Type-safe JSON serialization optimized for encryption workflows.

#### Functions

##### `serializeForEncryption(data: any): Uint8Array`

Serializes data to binary format suitable for encryption.

- **Parameters:** `data` - Any JSON-serializable data
- **Returns:** Binary representation ready for encryption
- **Handles:** Complex objects, arrays, primitives, null, undefined
- **Example:**

  ```typescript
  import { Serialization } from 'your-library/core/utils';

  const complexData = {
    user: { id: 123, name: 'Alice' },
    preferences: ['theme:dark', 'lang:en'],
    metadata: null,
    timestamp: new Date().toISOString(),
  };

  const serialized = Serialization.serializeForEncryption(complexData);
  // Ready for encryption
  ```

##### `deserializeFromDecryption<T>(data: Uint8Array): T`

Deserializes binary data back to original type after decryption.

- **Parameters:** `data` - Binary data from decryption
- **Returns:** Original data with type safety
- **Type Safety:** Generic return type for TypeScript
- **Example:**

  ```typescript
  import { Serialization } from 'your-library/core/utils';

  interface UserData {
    user: { id: number; name: string };
    preferences: string[];
  }

  const deserialized =
    Serialization.deserializeFromDecryption<UserData>(binaryData);
  // TypeScript knows the structure
  console.log(deserialized.user.name);
  ```

#### Advanced Serialization

```typescript
import { Serialization } from 'your-library/core/utils';

class SecureDataProcessor {
  // Handle complex data structures
  processUserData(userData: any) {
    try {
      const serialized = Serialization.serializeForEncryption(userData);
      console.log('Serialization successful, size:', serialized.length);

      // Would encrypt here...

      // After decryption...
      const restored = Serialization.deserializeFromDecryption(serialized);
      return restored;
    } catch (error) {
      console.error('Serialization failed:', error);
      throw new Error('Data processing failed');
    }
  }

  // Handle edge cases
  processEdgeCases() {
    const testCases = [
      null,
      undefined,
      '',
      0,
      false,
      [],
      {},
      { nested: { deep: { data: 'value' } } },
    ];

    testCases.forEach((testCase, index) => {
      try {
        const serialized = Serialization.serializeForEncryption(testCase);
        const deserialized =
          Serialization.deserializeFromDecryption(serialized);
        console.log(`Test case ${index}: ✅`);
      } catch (error) {
        console.error(`Test case ${index}: ❌`, error);
      }
    });
  }
}
```

### 3. Key Derivation Utils

HKDF-based key derivation for secure symmetric key generation.

#### Functions

##### `deriveKey(preset: Preset, sharedSecret: Uint8Array): Uint8Array`

Derives symmetric encryption keys from ML-KEM shared secrets.

- **Parameters:**
  - `preset` - Security preset (NORMAL/HIGH_SECURITY)
  - `sharedSecret` - ML-KEM shared secret (32 bytes)
- **Returns:** Derived key (32 bytes for AES-256)
- **Algorithm:** HKDF-SHA256 with preset-specific parameters
- **Example:**

  ```typescript
  import { KeyDerivation, Preset } from 'your-library/core/utils';

  // From ML-KEM encapsulation
  const sharedSecret = kemAlgorithm.encapsulate(publicKey).sharedSecret;

  // Derive AES key
  const aesKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
  console.log('Derived key length:', aesKey.length); // 32 bytes
  ```

#### Key Derivation Details

```typescript
// Internal derivation parameters (preset-specific)
const derivationParams = {
  [Preset.NORMAL]: {
    salt: 'HybridEncryption-v1-Normal',
    info: 'AES-GCM-256',
    length: 32,
  },
  [Preset.HIGH_SECURITY]: {
    salt: 'HybridEncryption-v1-HighSec',
    info: 'AES-GCM-256-HS',
    length: 32,
  },
};
```

#### Advanced Key Derivation

```typescript
import { KeyDerivation, Preset } from 'your-library/core/utils';

class KeyMaterialManager {
  // Derive multiple keys from single shared secret
  deriveKeyMaterial(sharedSecret: Uint8Array, preset: Preset) {
    // Primary encryption key
    const encryptionKey = KeyDerivation.deriveKey(preset, sharedSecret);

    // Additional keys for different purposes (if needed)
    // Note: This would require extending KeyDerivation utility

    return {
      encryptionKey,
      keyLength: encryptionKey.length,
      preset,
    };
  }

  // Validate derived keys
  validateKeyMaterial(keyMaterial: Uint8Array) {
    if (keyMaterial.length !== 32) {
      throw new Error('Invalid key length for AES-256');
    }

    // Check for weak keys (all zeros, etc.)
    const isAllZeros = keyMaterial.every((byte) => byte === 0);
    if (isAllZeros) {
      throw new Error('Derived key is all zeros - possible derivation failure');
    }

    return true;
  }
}
```

### 4. Comparison Utils

Deep comparison utilities for objects, arrays, and primitives.

#### Functions

##### `deepEqual(a: any, b: any, options?: DeepComparisonOptions): boolean`

Performs deep equality comparison between two values.

- **Parameters:**
  - `a`, `b` - Values to compare
  - `options` - Comparison configuration
- **Returns:** True if deeply equal
- **Example:**

  ```typescript
  import { deepEqual } from 'your-library/core/utils';

  const obj1 = { user: { id: 123, name: 'Alice' }, tags: ['admin'] };
  const obj2 = { user: { id: 123, name: 'Alice' }, tags: ['admin'] };

  const isEqual = deepEqual(obj1, obj2);
  console.log(isEqual); // true
  ```

##### `objectsDeepEqual(a: object, b: object): boolean`

Specialized deep comparison for objects.

- **Parameters:** `a`, `b` - Objects to compare
- **Returns:** True if objects are deeply equal
- **Example:**

  ```typescript
  import { objectsDeepEqual } from 'your-library/core/utils';

  const config1 = { preset: 'normal', rotation: 60 };
  const config2 = { preset: 'normal', rotation: 60 };

  console.log(objectsDeepEqual(config1, config2)); // true
  ```

##### `arraysDeepEqual(a: any[], b: any[]): boolean`

Specialized deep comparison for arrays.

- **Parameters:** `a`, `b` - Arrays to compare
- **Returns:** True if arrays are deeply equal
- **Example:**

  ```typescript
  import { arraysDeepEqual } from 'your-library/core/utils';

  const arr1 = [1, { x: 2 }, [3, 4]];
  const arr2 = [1, { x: 2 }, [3, 4]];

  console.log(arraysDeepEqual(arr1, arr2)); // true
  ```

#### Comparison Options

```typescript
interface DeepComparisonOptions {
  strictTypeChecking?: boolean; // Strict type comparison (3 !== "3")
  ignoreUndefinedProperties?: boolean; // Ignore undefined vs missing properties
  maxDepth?: number; // Maximum recursion depth
  customComparators?: Map<string, (a: any, b: any) => boolean>; // Custom type comparisons
}
```

#### ComparisonUtils Class

```typescript
import { ComparisonUtils } from 'your-library/core/utils';

// Configuration comparison for KeyManager
const configsEqual = ComparisonUtils.deepEqual(config1, config2, {
  strictTypeChecking: true,
  ignoreUndefinedProperties: false,
});

// Array comparison for key arrays
const keyArraysEqual = ComparisonUtils.arraysDeepEqual(
  currentKeys,
  previousKeys,
);
```

#### Advanced Comparison Examples

```typescript
import {
  ComparisonUtils,
  DeepComparisonOptions,
} from 'your-library/core/utils';

class DataIntegrityChecker {
  // Verify data integrity after encryption/decryption round trip
  verifyRoundTrip(original: any, decrypted: any) {
    const options: DeepComparisonOptions = {
      strictTypeChecking: true,
      maxDepth: 10,
    };

    const isIntact = ComparisonUtils.deepEqual(original, decrypted, options);

    if (!isIntact) {
      console.error('Data integrity check failed!');
      this.logIntegrityFailure(original, decrypted);
      return false;
    }

    console.log('✅ Data integrity verified');
    return true;
  }

  // Compare configuration changes
  detectConfigChanges(oldConfig: any, newConfig: any) {
    if (ComparisonUtils.deepEqual(oldConfig, newConfig)) {
      return { hasChanges: false, changes: [] };
    }

    const changes = this.findDifferences(oldConfig, newConfig);
    console.log('Configuration changes detected:', changes);

    return { hasChanges: true, changes };
  }

  private findDifferences(obj1: any, obj2: any, path = ''): string[] {
    const differences: string[] = [];

    // Implementation would detect specific field differences
    // This is a simplified example

    return differences;
  }

  private logIntegrityFailure(original: any, decrypted: any) {
    console.error('Original:', JSON.stringify(original, null, 2));
    console.error('Decrypted:', JSON.stringify(decrypted, null, 2));
  }
}
```

## 🎯 Integrated Usage Examples

### Complete Encryption Workflow

```typescript
import {
  BufferUtils,
  Serialization,
  KeyDerivation,
  ComparisonUtils,
  Preset,
} from 'your-library/core/utils';

class EncryptionWorkflow {
  async demonstrateFullWorkflow() {
    // 1. Prepare data
    const sensitiveData = {
      userId: 12345,
      creditCard: '4111-1111-1111-1111',
      metadata: { timestamp: new Date().toISOString() },
    };

    console.log('📊 Original data prepared');

    // 2. Serialize for encryption
    const serializedData = Serialization.serializeForEncryption(sensitiveData);
    console.log('📦 Data serialized, size:', serializedData.length);

    // 3. Generate secure random components
    const sharedSecret = BufferUtils.getSecureRandomBytes(32);
    const nonce = BufferUtils.getSecureRandomBytes(12);

    console.log('🔐 Cryptographic components generated');

    // 4. Derive encryption key
    const encryptionKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
    console.log('🔑 Encryption key derived');

    // 5. Base64 encoding for transport
    const encodedData = BufferUtils.encodeBase64(serializedData);
    const encodedKey = BufferUtils.encodeBase64(encryptionKey);

    console.log('📡 Data encoded for transport');

    // 6. Simulate decryption workflow
    const decodedData = BufferUtils.decodeBase64(encodedData);
    const decodedKey = BufferUtils.decodeBase64(encodedKey);

    // 7. Verify key integrity
    const keyIntact = BufferUtils.constantTimeEqual(encryptionKey, decodedKey);
    console.log('🔍 Key integrity check:', keyIntact ? '✅' : '❌');

    // 8. Deserialize and verify data integrity
    const restoredData = Serialization.deserializeFromDecryption(decodedData);
    const dataIntact = ComparisonUtils.deepEqual(sensitiveData, restoredData);

    console.log('🔍 Data integrity check:', dataIntact ? '✅' : '❌');

    return {
      serializedSize: serializedData.length,
      encodedSize: encodedData.length,
      keyIntact,
      dataIntact,
      restoredData,
    };
  }
}
```

### Security Validation Suite

```typescript
import {
  BufferUtils,
  KeyDerivation,
  ComparisonUtils,
  Preset,
} from 'your-library/core/utils';

class SecurityValidationSuite {
  // Test cryptographic functions
  async validateCryptographicFunctions() {
    console.log('🔐 Testing cryptographic functions...');

    // 1. Random byte generation
    const random1 = BufferUtils.getSecureRandomBytes(32);
    const random2 = BufferUtils.getSecureRandomBytes(32);

    // Should be different (probability of collision is negligible)
    const randomsEqual = BufferUtils.constantTimeEqual(random1, random2);
    console.log('Random bytes different:', !randomsEqual ? '✅' : '❌');

    // 2. Key derivation consistency
    const sharedSecret = BufferUtils.getSecureRandomBytes(32);
    const key1 = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
    const key2 = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

    const derivationConsistent = BufferUtils.constantTimeEqual(key1, key2);
    console.log(
      'Key derivation consistent:',
      derivationConsistent ? '✅' : '❌',
    );

    // 3. Different presets produce different keys
    const keyNormal = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
    const keyHighSec = KeyDerivation.deriveKey(
      Preset.HIGH_SECURITY,
      sharedSecret,
    );

    const presetsDifferent = !BufferUtils.constantTimeEqual(
      keyNormal,
      keyHighSec,
    );
    console.log(
      'Presets produce different keys:',
      presetsDifferent ? '✅' : '❌',
    );

    return {
      randomGeneration: !randomsEqual,
      keyDerivationConsistency: derivationConsistent,
      presetDifferentiation: presetsDifferent,
    };
  }

  // Test serialization edge cases
  validateSerializationEdgeCases() {
    console.log('📦 Testing serialization edge cases...');

    const edgeCases = [
      null,
      undefined,
      '',
      0,
      false,
      [],
      {},
      { nested: { very: { deep: { object: 'value' } } } },
      [1, [2, [3, [4, 5]]]],
      new Date().toISOString(),
      { unicode: 'Hello, 世界! 🌍' },
    ];

    const results = edgeCases.map((testCase, index) => {
      try {
        const serialized = Serialization.serializeForEncryption(testCase);
        const deserialized =
          Serialization.deserializeFromDecryption(serialized);
        const isEqual = ComparisonUtils.deepEqual(testCase, deserialized);

        console.log(`Edge case ${index}:`, isEqual ? '✅' : '❌');
        return { index, success: isEqual, error: null };
      } catch (error) {
        console.log(`Edge case ${index}:`, '❌', error);
        return {
          index,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `Serialization: ${successCount}/${edgeCases.length} cases passed`,
    );

    return results;
  }
}
```

### Performance Monitoring

```typescript
import {
  BufferUtils,
  Serialization,
  KeyDerivation,
  Preset,
} from 'your-library/core/utils';

class UtilsPerformanceMonitor {
  async benchmarkOperations() {
    const iterations = 1000;
    const dataSize = 1024; // 1KB

    console.log(
      `🏁 Benchmarking utils operations (${iterations} iterations)...`,
    );

    // Prepare test data
    const testData = {
      data: 'x'.repeat(dataSize),
      number: 42,
      array: Array(100)
        .fill(0)
        .map((_, i) => i),
    };
    const sharedSecret = BufferUtils.getSecureRandomBytes(32);

    // Benchmark serialization
    const serializationTime = await this.benchmarkFunction(
      () => Serialization.serializeForEncryption(testData),
      iterations,
      'Serialization',
    );

    // Benchmark key derivation
    const keyDerivationTime = await this.benchmarkFunction(
      () => KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret),
      iterations,
      'Key Derivation',
    );

    // Benchmark Base64 encoding
    const binaryData = BufferUtils.getSecureRandomBytes(1024);
    const encodingTime = await this.benchmarkFunction(
      () => BufferUtils.encodeBase64(binaryData),
      iterations,
      'Base64 Encoding',
    );

    return {
      serialization: serializationTime,
      keyDerivation: keyDerivationTime,
      encoding: encodingTime,
    };
  }

  private async benchmarkFunction(
    fn: () => any,
    iterations: number,
    name: string,
  ): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      fn();
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;

    console.log(
      `${name}: ${avgTime.toFixed(3)}ms average (${totalTime.toFixed(1)}ms total)`,
    );

    return avgTime;
  }
}
```

## 🛡️ Security Considerations

### Cryptographic Security

```typescript
// ✅ Secure practices
const secureRandom = BufferUtils.getSecureRandomBytes(32); // Cryptographically secure
const keyComparison = BufferUtils.constantTimeEqual(key1, key2); // Timing-safe

// ❌ Avoid insecure alternatives
const insecureRandom = new Uint8Array(32); // Not random!
const timingUnsafe = key1.toString() === key2.toString(); // Timing attack vulnerable
```

### Memory Management

```typescript
// Utilities handle sensitive data - be aware of:
// - Automatic garbage collection timing
// - Memory dumps in development
// - Swap file exposure in production

// Best practice: Minimize lifetime of sensitive data
function processSecretData(secret: Uint8Array) {
  const derived = KeyDerivation.deriveKey(Preset.NORMAL, secret);

  // Use derived key immediately
  const result = useKeyForEncryption(derived);

  // Key will be garbage collected, but timing is not guaranteed
  return result;
}
```

### Input Validation

```typescript
// Always validate inputs to utility functions
function safeSerialize(data: unknown) {
  if (data === null || data === undefined) {
    return Serialization.serializeForEncryption(data); // These are valid
  }

  // Check for circular references
  try {
    JSON.stringify(data); // Quick circular reference check
  } catch (error) {
    throw new Error('Data contains circular references');
  }

  return Serialization.serializeForEncryption(data);
}
```

## 🧪 Testing Utils

### Unit Testing

```typescript
import {
  BufferUtils,
  Serialization,
  KeyDerivation,
  ComparisonUtils,
  Preset,
} from 'your-library/core/utils';

describe('Core Utils', () => {
  describe('BufferUtils', () => {
    test('Base64 encoding/decoding round trip', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const encoded = BufferUtils.encodeBase64(original);
      const decoded = BufferUtils.decodeBase64(encoded);

      expect(decoded).toEqual(original);
    });

    test('secure random bytes are different', () => {
      const bytes1 = BufferUtils.getSecureRandomBytes(32);
      const bytes2 = BufferUtils.getSecureRandomBytes(32);

      expect(BufferUtils.constantTimeEqual(bytes1, bytes2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    test('handles complex objects', () => {
      const complex = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, { nested: 'value' }],
        object: { deep: { nesting: 'works' } },
      };

      const serialized = Serialization.serializeForEncryption(complex);
      const deserialized = Serialization.deserializeFromDecryption(serialized);

      expect(ComparisonUtils.deepEqual(complex, deserialized)).toBe(true);
    });
  });

  describe('KeyDerivation', () => {
    test('same input produces same output', () => {
      const secret = BufferUtils.getSecureRandomBytes(32);
      const key1 = KeyDerivation.deriveKey(Preset.NORMAL, secret);
      const key2 = KeyDerivation.deriveKey(Preset.NORMAL, secret);

      expect(BufferUtils.constantTimeEqual(key1, key2)).toBe(true);
    });

    test('different presets produce different keys', () => {
      const secret = BufferUtils.getSecureRandomBytes(32);
      const keyNormal = KeyDerivation.deriveKey(Preset.NORMAL, secret);
      const keyHighSec = KeyDerivation.deriveKey(Preset.HIGH_SECURITY, secret);

      expect(BufferUtils.constantTimeEqual(keyNormal, keyHighSec)).toBe(false);
    });
  });
});
```

### Integration Testing

```typescript
test('utils integrate correctly with encryption workflow', () => {
  // This would test the utils in a complete encryption/decryption cycle
  const data = { test: 'integration' };

  // 1. Serialize
  const serialized = Serialization.serializeForEncryption(data);

  // 2. Generate key material
  const sharedSecret = BufferUtils.getSecureRandomBytes(32);
  const encryptionKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

  // 3. Simulate encryption workflow (would use HybridEncryption)
  // ... encryption logic ...

  // 4. Deserialize
  const deserialized = Serialization.deserializeFromDecryption(serialized);

  // 5. Verify integrity
  expect(ComparisonUtils.deepEqual(data, deserialized)).toBe(true);
});
```

## 📚 Related Documentation

- [Core Module Overview](./core-documentation.md)
- [HybridEncryption Details](./hybrid-encryption.md)
- [KeyManager Details](./key-manager.md)
- [Client Integration](../client/client-encryption.md)
- [Server Integration](../server/server-decryption.md)
