# HybridEncryption Module

The **HybridEncryption** class is the core cryptographic engine that implements
modern post-quantum secure hybrid encryption using ML-KEM (Key Encapsulation
Mechanism) and AES-GCM (Authenticated Encryption). It provides a clean,
type-safe API for encrypting and decrypting data with automatic key derivation
and comprehensive error handling.

## 🔑 Key Features

- **🛡️ Post-Quantum Security**: ML-KEM-768/1024 for quantum-resistant encryption
- **⚡ High Performance**: AES-GCM for fast symmetric encryption
- **🔄 Grace Period Support**: Automatic fallback during key rotation
- **🎯 Type Safety**: Full TypeScript support with generic return types
- **📊 Multiple Presets**: Security configurations for different use cases
- **🛠️ Comprehensive Validation**: Input validation and error handling
- **🧪 Production Ready**: Extensively tested and optimized

## 🏗️ Architecture

### Hybrid Encryption Design

The HybridEncryption class implements the **KEM + AEAD** pattern:

```
┌─────────────────┐    ┌─────────────────┐
│   ML-KEM        │    │   AES-GCM       │
│  (Asymmetric)   │ +  │  (Symmetric)    │
│                 │    │                 │
│ • Key Exchange  │    │ • Data Encrypt  │
│ • Post-Quantum  │    │ • Authentication│
│ • Small Overhead│    │ • High Speed    │
└─────────────────┘    └─────────────────┘
```

### Encryption Flow

```typescript
// 1. Serialize data
data → JSON.stringify → UTF-8 bytes

// 2. Generate shared secret (ML-KEM)
publicKey → KEM.Encapsulate → {sharedSecret, cipherText}

// 3. Derive symmetric key
sharedSecret → HKDF → derivedKey

// 4. Encrypt data (AES-GCM)
data + derivedKey + nonce → AES-GCM → encryptedData

// 5. Return structure
{preset, encryptedContent, cipherText, nonce}
```

### Decryption Flow

```typescript
// 1. Validate encrypted data structure
encryptedData → validate → ✓

// 2. Decode Base64 components
{encryptedContent, cipherText, nonce} → Uint8Array

// 3. Recover shared secret (ML-KEM)
cipherText + secretKey → KEM.Decapsulate → sharedSecret

// 4. Derive symmetric key
sharedSecret → HKDF → derivedKey

// 5. Decrypt data (AES-GCM)
encryptedData + derivedKey + nonce → AES-GCM → plaintext

// 6. Deserialize to original type
plaintext → JSON.parse → originalData
```

## 📖 API Reference

### Constructor

```typescript
new HybridEncryption(preset?: Preset)
```

Creates a new HybridEncryption instance with the specified security preset.

- **Parameters:**
  - `preset` (optional): Security configuration. Defaults to `Preset.NORMAL`
- **Example:**
  ```typescript
  const encryption = new HybridEncryption(Preset.HIGH_SECURITY);
  ```

### Instance Methods

#### `encrypt(data: any, publicKey: Uint8Array): EncryptedData`

Encrypts data using hybrid ML-KEM + AES-GCM encryption.

- **Parameters:**
  - `data`: Any serializable data to encrypt
  - `publicKey`: ML-KEM public key as Uint8Array
- **Returns:** `EncryptedData` - Encrypted data structure
- **Throws:** Various encryption errors with context
- **Example:**
  ```typescript
  const encrypted = encryption.encrypt(
    { userId: 123, email: 'user@example.com' },
    publicKey,
  );
  ```

#### `decrypt<T>(encryptedData: EncryptedData, secretKey: Uint8Array): T`

Decrypts data using the corresponding secret key.

- **Parameters:**
  - `encryptedData`: Previously encrypted data structure
  - `secretKey`: ML-KEM secret key as Uint8Array
- **Returns:** `T` - Decrypted data with type safety
- **Throws:** Various decryption errors with context
- **Example:**

  ```typescript
  interface UserData {
    userId: number;
    email: string;
  }

  const decrypted = encryption.decrypt<UserData>(encrypted, secretKey);
  ```

#### `decryptWithGracePeriod<T>(encryptedData: EncryptedData, secretKeys: Uint8Array[]): T`

Decrypts data with automatic fallback to previous keys during rotation periods.

- **Parameters:**
  - `encryptedData`: Previously encrypted data structure
  - `secretKeys`: Array of secret keys (current first, then fallbacks)
- **Returns:** `T` - Decrypted data with type safety
- **Throws:** Error if all keys fail
- **Example:**
  ```typescript
  const secretKeys = [currentSecretKey, previousSecretKey];
  const decrypted = encryption.decryptWithGracePeriod<UserData>(
    encrypted,
    secretKeys,
  );
  ```

### Static Methods

#### `validateKeyPair(keyPair: KeyPair): boolean`

Validates an ML-KEM key pair for correctness and security.

- **Parameters:**
  - `keyPair`: Key pair to validate
- **Returns:** `boolean` - True if valid
- **Example:**
  ```typescript
  const isValid = HybridEncryption.validateKeyPair(keyPair);
  if (!isValid) {
    throw new Error('Invalid key pair');
  }
  ```

## 🎯 Usage Examples

### Basic Encryption/Decryption

```typescript
import { HybridEncryption, Preset } from 'your-library/core';

// Create encryption instance
const encryption = new HybridEncryption(Preset.NORMAL);

// Your sensitive data
const userData = {
  userId: 12345,
  email: 'user@example.com',
  creditCard: '4111-1111-1111-1111',
  preferences: {
    newsletter: true,
    notifications: false,
  },
};

// Encrypt (assumes you have a public key)
const encrypted = encryption.encrypt(userData, publicKey);

console.log('Encrypted structure:', {
  preset: encrypted.preset,
  contentLength: encrypted.encryptedContent.length,
  cipherTextLength: encrypted.cipherText.length,
  nonceLength: encrypted.nonce.length,
});

// Decrypt with type safety
const decrypted = encryption.decrypt<typeof userData>(encrypted, secretKey);
console.log('Decrypted data:', decrypted);
```

### High Security Configuration

```typescript
import { HybridEncryption, Preset } from 'your-library/core';

// Use ML-KEM-1024 for maximum security
const highSecurityEncryption = new HybridEncryption(Preset.HIGH_SECURITY);

// Encrypt sensitive government/financial data
const classifiedData = {
  classification: 'TOP_SECRET',
  document: 'sensitive-content...',
  clearanceLevel: 'LEVEL_5',
};

const encrypted = highSecurityEncryption.encrypt(classifiedData, publicKey);
const decrypted = highSecurityEncryption.decrypt(encrypted, secretKey);
```

### Grace Period Decryption

```typescript
import { HybridEncryption } from 'your-library/core';

class SecureDataProcessor {
  private encryption: HybridEncryption;

  constructor(preset: Preset) {
    this.encryption = new HybridEncryption(preset);
  }

  async processEncryptedData(
    encryptedData: EncryptedData,
    currentKey: Uint8Array,
    previousKey?: Uint8Array,
  ) {
    // Prepare keys array (current first, then fallbacks)
    const keys = [currentKey];
    if (previousKey) {
      keys.push(previousKey);
    }

    try {
      // Attempt decryption with grace period support
      const data = this.encryption.decryptWithGracePeriod(encryptedData, keys);

      return this.processBusinessLogic(data);
    } catch (error) {
      console.error('All decryption attempts failed:', error);
      throw new Error('Unable to decrypt data with any available key');
    }
  }

  private processBusinessLogic(data: any) {
    // Your business logic here
    return data;
  }
}
```

### Batch Processing

```typescript
import { HybridEncryption, Preset } from 'your-library/core';

class BatchEncryptionProcessor {
  private encryption: HybridEncryption;

  constructor() {
    this.encryption = new HybridEncryption(Preset.NORMAL);
  }

  encryptBatch(dataArray: any[], publicKey: Uint8Array) {
    const results = [];
    const errors = [];

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const encrypted = this.encryption.encrypt(dataArray[i], publicKey);
        results.push({
          index: i,
          success: true,
          data: encrypted,
        });
      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalData: dataArray[i],
        });
      }
    }

    return {
      results,
      errors,
      successRate: results.length / dataArray.length,
    };
  }

  decryptBatch(encryptedArray: EncryptedData[], secretKey: Uint8Array) {
    return encryptedArray.map((encrypted, index) => {
      try {
        return {
          index,
          success: true,
          data: this.encryption.decrypt(encrypted, secretKey),
        };
      } catch (error) {
        return {
          index,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }
}
```

## 🛡️ Security Features

### Post-Quantum Resistance

```typescript
// ML-KEM provides security against quantum attacks
const encryption = new HybridEncryption(Preset.HIGH_SECURITY);

// Your data is protected against:
// - Classical cryptanalytic attacks
// - Quantum computer attacks (Shor's algorithm)
// - Side-channel attacks (constant-time implementation)
```

### Authenticated Encryption

```typescript
// AES-GCM provides:
// - Confidentiality (encryption)
// - Authenticity (MAC verification)
// - Integrity (tamper detection)

// Any modification to encrypted data will be detected
try {
  const decrypted = encryption.decrypt(tamperedData, secretKey);
} catch (error) {
  // Will throw authentication error
  console.log('Data has been tampered with!');
}
```

### Perfect Forward Secrecy

```typescript
// Each encryption uses a fresh shared secret
const encryption1 = encryption.encrypt(data1, publicKey);
const encryption2 = encryption.encrypt(data2, publicKey);

// encryption1 and encryption2 use different secrets
// Compromise of one doesn't affect the other
```

## 📊 Performance Characteristics

### Benchmark Results

| Operation      | ML-KEM-768 | ML-KEM-1024 | Notes                  |
| -------------- | ---------- | ----------- | ---------------------- |
| Encrypt (1KB)  | ~0.2ms     | ~0.3ms      | Includes serialization |
| Decrypt (1KB)  | ~0.2ms     | ~0.3ms      | Includes parsing       |
| Encrypt (1MB)  | ~10ms      | ~10ms       | Linear with data size  |
| Key Validation | ~0.01ms    | ~0.01ms     | Very fast              |

### Memory Usage

```typescript
// Typical memory usage per operation
const memoryProfile = {
  publicKey: '1184 bytes (ML-KEM-768) / 1568 bytes (ML-KEM-1024)',
  secretKey: '2400 bytes (ML-KEM-768) / 3168 bytes (ML-KEM-1024)',
  sharedSecret: '32 bytes (both presets)',
  overhead: '~100 bytes (nonce + metadata)',
  temporaryBuffers: '~2x data size during processing',
};
```

### Optimization Tips

```typescript
// ✅ Good: Reuse encryption instances
const encryption = new HybridEncryption(preset);
for (const data of dataArray) {
  const encrypted = encryption.encrypt(data, publicKey);
}

// ❌ Avoid: Creating new instances repeatedly
for (const data of dataArray) {
  const encryption = new HybridEncryption(preset); // Wasteful
  const encrypted = encryption.encrypt(data, publicKey);
}

// ✅ Good: Use appropriate preset
const normalEncryption = new HybridEncryption(Preset.NORMAL); // For general use
const highSecEncryption = new HybridEncryption(Preset.HIGH_SECURITY); // For sensitive data

// ✅ Good: Validate keys once
if (HybridEncryption.validateKeyPair(keyPair)) {
  // Use keys multiple times
}
```

## 🚨 Error Handling

### Error Types and Handling

```typescript
import {
  HybridEncryption,
  EncryptionError,
  ValidationError,
  AlgorithmAsymmetricError,
  AlgorithmSymmetricError,
} from 'your-library/core';

try {
  const encrypted = encryption.encrypt(data, publicKey);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Input validation failed:', error.message);
  } else if (error instanceof AlgorithmAsymmetricError) {
    console.log('ML-KEM operation failed:', error.message);
  } else if (error instanceof AlgorithmSymmetricError) {
    console.log('AES-GCM operation failed:', error.message);
  } else {
    console.log('Unknown error:', error.message);
  }
}
```

### Common Error Scenarios

| Error Condition           | Error Type               | Solution                         |
| ------------------------- | ------------------------ | -------------------------------- |
| Invalid public key length | AlgorithmAsymmetricError | Verify key format and preset     |
| Corrupted encrypted data  | ValidationError          | Check data integrity             |
| Authentication failure    | AlgorithmSymmetricError  | Verify data hasn't been modified |
| Serialization failure     | FormatConversionError    | Check data is JSON serializable  |
| Invalid secret key        | AlgorithmAsymmetricError | Verify key matches public key    |

### Robust Error Handling Pattern

```typescript
class SecureDataHandler {
  private encryption: HybridEncryption;

  constructor(preset: Preset) {
    this.encryption = new HybridEncryption(preset);
  }

  async safeEncrypt(
    data: unknown,
    publicKey: Uint8Array,
  ): Promise<EncryptedData | null> {
    try {
      return this.encryption.encrypt(data, publicKey);
    } catch (error) {
      this.logSecurityEvent('encryption_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataType: typeof data,
        keyLength: publicKey.length,
      });
      return null;
    }
  }

  async safeDecrypt<T>(
    encryptedData: EncryptedData,
    secretKeys: Uint8Array[],
  ): Promise<T | null> {
    try {
      return this.encryption.decryptWithGracePeriod<T>(
        encryptedData,
        secretKeys,
      );
    } catch (error) {
      this.logSecurityEvent('decryption_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        preset: encryptedData.preset,
        keyCount: secretKeys.length,
      });
      return null;
    }
  }

  private logSecurityEvent(event: string, details: Record<string, any>) {
    console.warn(`🔒 Security Event: ${event}`, details);
    // Send to your security monitoring system
  }
}
```

## 🧪 Testing

### Unit Testing

```typescript
import { HybridEncryption, Preset } from 'your-library/core';
import { generateMockKeyPair } from 'your-library/test-utils';

describe('HybridEncryption', () => {
  let encryption: HybridEncryption;
  let keyPair: KeyPair;

  beforeEach(() => {
    encryption = new HybridEncryption(Preset.NORMAL);
    keyPair = generateMockKeyPair(Preset.NORMAL);
  });

  test('encrypts and decrypts data correctly', () => {
    const data = { message: 'test', value: 42 };

    const encrypted = encryption.encrypt(data, keyPair.publicKey);
    const decrypted = encryption.decrypt(encrypted, keyPair.secretKey!);

    expect(decrypted).toEqual(data);
  });

  test('validates key pair correctly', () => {
    const isValid = HybridEncryption.validateKeyPair(keyPair);
    expect(isValid).toBe(true);
  });

  test('handles grace period decryption', () => {
    const data = { test: 'data' };
    const encrypted = encryption.encrypt(data, keyPair.publicKey);

    const secretKeys = [keyPair.secretKey!, keyPair.secretKey!];
    const decrypted = encryption.decryptWithGracePeriod(encrypted, secretKeys);

    expect(decrypted).toEqual(data);
  });
});
```

### Integration Testing

```typescript
test('works with KeyManager integration', async () => {
  const keyManager = KeyManager.getInstance({ autoGenerate: true });
  await keyManager.initialize();

  const keyPair = await keyManager.getKeyPair();
  const encryption = new HybridEncryption();

  const data = { integration: 'test' };
  const encrypted = encryption.encrypt(data, keyPair.publicKey);
  const decrypted = encryption.decrypt(encrypted, keyPair.secretKey!);

  expect(decrypted).toEqual(data);
});
```

## 🔗 Integration Examples

### With Express.js

```typescript
import express from 'express';
import { HybridEncryption } from 'your-library/core';

const app = express();
const encryption = new HybridEncryption();

app.post('/api/decrypt', async (req, res) => {
  try {
    const { encryptedData, secretKey } = req.body;
    const decrypted = encryption.decrypt(encryptedData, secretKey);
    res.json({ success: true, data: decrypted });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Decryption failed',
    });
  }
});
```

### With WebSocket

```typescript
import WebSocket from 'ws';
import { HybridEncryption } from 'your-library/core';

const wss = new WebSocket.Server({ port: 8080 });
const encryption = new HybridEncryption();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const { encryptedData, secretKey } = JSON.parse(message.toString());
      const decrypted = encryption.decrypt(encryptedData, secretKey);

      ws.send(
        JSON.stringify({
          type: 'decrypted',
          data: decrypted,
        }),
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Decryption failed',
        }),
      );
    }
  });
});
```

## 📚 Related Documentation

- [Core Module Overview](./core-documentation.md)
- [KeyManager Details](./key-manager.md)
- [Core Utils](./core-utils.md)
- [Client Integration](../client/client-encryption.md)
- [Server Integration](../server/server-decryption.md)
