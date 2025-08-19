# Client Encryption Module

The **Client Encryption Module** (`src/client/`) provides a high-level,
easy-to-use interface for encrypting data using hybrid cryptography. It
implements the **Singleton Pattern** to ensure consistent encryption
configuration across your application.

## 🔑 Key Features

- **🔐 Hybrid Encryption**: ML-KEM (post-quantum) + AES-GCM symmetric encryption
- **🎯 Singleton Pattern**: Single instance management with runtime constructor
  protection
- **🛡️ Type Safety**: Full TypeScript support with strict typing
- **⚡ Easy Integration**: Simple API designed for client-side applications
- **🎨 Flexible Key Input**: Supports both `Uint8Array` and Base64-encoded
  string public keys
- **📊 Multiple Security Presets**: `NORMAL` and `HIGH_SECURITY` configurations

## 📁 Module Structure

```
src/client/
├── encrypt.ts      # Main ClientEncryption class
├── index.ts        # Module exports
└── utils.ts        # Utility functions
```

## 🏗️ Architecture

### Singleton Pattern Implementation

The `ClientEncryption` class uses a **thread-safe singleton pattern** with
runtime constructor protection:

```typescript
// ✅ Correct usage
const encryption = ClientEncryption.getInstance();

// ❌ This will throw an error
const encryption = new ClientEncryption(); // Error: Cannot instantiate directly
```

### Security Presets

| Preset          | Description             | Use Case                               |
| --------------- | ----------------------- | -------------------------------------- |
| `NORMAL`        | Standard security level | General applications, good performance |
| `HIGH_SECURITY` | Enhanced security level | Sensitive data, maximum security       |

## 🚀 Basic Usage

### 1. Installation and Import

```typescript
import { ClientEncryption, Preset } from 'your-library/client';

// Or import specific components
import { ClientEncryption } from 'your-library/client/encrypt';
```

### 2. Get Encryption Instance

```typescript
// Using default preset (NORMAL)
const encryption = ClientEncryption.getInstance();

// Using specific preset
const encryptionHS = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
```

### 3. Encrypt Data

```typescript
// Your data to encrypt (can be any serializable object)
const sensitiveData = {
  userId: 12345,
  email: 'user@example.com',
  creditCard: '4111-1111-1111-1111',
  metadata: {
    timestamp: new Date().toISOString(),
    sessionId: 'abc-123-def',
  },
};

// Public key (Base64 string or Uint8Array)
const publicKey = 'LS0tLS1CRUdJTi...'; // Base64 encoded public key

// Encrypt the data
const encryptedData = encryption.encryptData(sensitiveData, publicKey);

console.log('Encrypted:', encryptedData);
// Output:
// {
//   preset: 'normal',
//   encryptedContent: 'eyJjaXBoZXJ0ZXh0IjoiLi4u...',
//   cipherText: 'LS0tLS1CRUdJTi...',
//   nonce: 'YWJjZGVmZ2hpams...'
// }
```

## 📖 API Reference

### `ClientEncryption` Class

#### Static Methods

##### `getInstance(preset?: Preset): ClientEncryption`

Gets the singleton instance of ClientEncryption.

- **Parameters:**
  - `preset` (optional): Security preset. Defaults to `Preset.NORMAL`
- **Returns:** `ClientEncryption` - The singleton instance
- **Example:**
  ```typescript
  const encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
  ```

##### `resetInstance(): void`

Resets the singleton instance. Useful for testing or when you need to change
presets.

- **Example:**
  ```typescript
  ClientEncryption.resetInstance();
  const newEncryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
  ```

#### Instance Methods

##### `encryptData(data: unknown, publicKey: string | Uint8Array): EncryptedData`

Encrypts data using the provided public key.

- **Parameters:**
  - `data`: Any serializable data to encrypt
  - `publicKey`: Public key as Base64 string or Uint8Array
- **Returns:** `EncryptedData` - Encrypted data object
- **Throws:** Error if encryption fails or inputs are invalid
- **Example:**
  ```typescript
  const result = encryption.encryptData({ secret: 'data' }, publicKey);
  ```

### Types

#### `EncryptedData`

```typescript
interface EncryptedData {
  preset: Preset; // Security preset used
  encryptedContent: Base64; // Base64 encrypted data
  cipherText: Base64; // Base64 KEM ciphertext
  nonce: Base64; // Base64 nonce/IV
}
```

#### `Preset`

```typescript
enum Preset {
  NORMAL = 'normal',
  HIGH_SECURITY = 'high_security',
}
```

## 🎯 Advanced Usage Examples

### Example 1: Form Data Encryption

```typescript
import { ClientEncryption, Preset } from 'your-library/client';

class SecureFormHandler {
  private encryption: ClientEncryption;

  constructor() {
    this.encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
  }

  async submitForm(formData: Record<string, any>, serverPublicKey: string) {
    try {
      // Encrypt sensitive form data
      const encryptedData = this.encryption.encryptData(
        formData,
        serverPublicKey,
      );

      // Send to server
      const response = await fetch('/api/secure-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted: encryptedData }),
      });

      return response.json();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }
}
```

### Example 2: Local Storage Encryption

```typescript
import { ClientEncryption } from 'your-library/client';

class SecureStorage {
  private encryption: ClientEncryption;
  private publicKey: string;

  constructor(publicKey: string) {
    this.encryption = ClientEncryption.getInstance();
    this.publicKey = publicKey;
  }

  setItem(key: string, value: any): void {
    try {
      const encryptedData = this.encryption.encryptData(value, this.publicKey);
      localStorage.setItem(key, JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Failed to encrypt and store data:', error);
      throw error;
    }
  }

  getItem(key: string): string | null {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse stored data:', error);
      return null;
    }
  }
}
```

### Example 3: Batch Data Encryption

```typescript
import { ClientEncryption, Preset } from 'your-library/client';

class BatchEncryption {
  private encryption: ClientEncryption;

  constructor(preset: Preset = Preset.NORMAL) {
    this.encryption = ClientEncryption.getInstance(preset);
  }

  encryptBatch(dataArray: unknown[], publicKey: string | Uint8Array) {
    const results = [];
    const errors = [];

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const encrypted = this.encryption.encryptData(dataArray[i], publicKey);
        results.push({ index: i, success: true, data: encrypted });
      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { results, errors, successCount: results.length };
  }
}

// Usage
const batchProcessor = new BatchEncryption(Preset.HIGH_SECURITY);
const data = [
  { id: 1, secret: 'data1' },
  { id: 2, secret: 'data2' },
  { id: 3, secret: 'data3' },
];

const result = batchProcessor.encryptBatch(data, publicKey);
console.log(`Encrypted ${result.successCount}/${data.length} items`);
```

## 🚨 Error Handling

The client encryption module provides detailed error information:

```typescript
import { ClientEncryption, createAppropriateError } from 'your-library/client';

try {
  const encryption = ClientEncryption.getInstance();
  const result = encryption.encryptData(data, invalidPublicKey);
} catch (error) {
  if (error.message.includes('Base64 decoding failed')) {
    console.error('Invalid public key format');
  } else if (error.message.includes('Failed to encrypt data')) {
    console.error('Encryption operation failed');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Scenarios

| Error                         | Cause                                  | Solution                             |
| ----------------------------- | -------------------------------------- | ------------------------------------ |
| `Base64 decoding failed`      | Invalid Base64 public key              | Verify public key format             |
| `Failed to encrypt data`      | Cryptographic operation error          | Check key compatibility              |
| `Cannot instantiate directly` | Using `new` instead of `getInstance()` | Use `ClientEncryption.getInstance()` |

## ⚡ Performance Considerations

### Singleton Benefits

- **Memory Efficiency**: Single instance across application
- **Initialization Overhead**: One-time setup cost
- **Consistent Configuration**: Same preset used throughout

### Best Practices

1. **Reuse the Instance**: Always use `getInstance()` to get the same instance
2. **Choose Appropriate Preset**: Use `NORMAL` for general use, `HIGH_SECURITY`
   for sensitive data
3. **Handle Errors Gracefully**: Implement proper error handling for
   cryptographic operations
4. **Key Management**: Ensure public keys are properly validated before use

```typescript
// ✅ Good practice
const encryption = ClientEncryption.getInstance();
const result = encryption.encryptData(data, publicKey);

// ❌ Avoid creating multiple instances
const enc1 = ClientEncryption.getInstance();
ClientEncryption.resetInstance(); // Unnecessary reset
const enc2 = ClientEncryption.getInstance(); // Creates new instance
```

## 🧪 Testing Support

The module provides testing utilities:

```typescript
import { ClientEncryption } from 'your-library/client';

// In your test setup
beforeEach(() => {
  ClientEncryption.resetInstance();
});

// In your tests
test('should encrypt data correctly', () => {
  const encryption = ClientEncryption.getInstance();
  const result = encryption.encryptData({ test: 'data' }, mockPublicKey);

  expect(result).toHaveProperty('encryptedContent');
  expect(result).toHaveProperty('preset');
  expect(result.preset).toBe('normal');
});
```

## 🔗 Integration with Server Module

The client module is designed to work seamlessly with the server decryption
module:

```typescript
// Client side (browser/frontend)
import { ClientEncryption } from 'your-library/client';

const encryption = ClientEncryption.getInstance();
const encryptedData = encryption.encryptData(sensitiveData, serverPublicKey);

// Send to server
fetch('/api/process', {
  method: 'POST',
  body: JSON.stringify({ data: encryptedData }),
});

// Server side (Node.js/backend)
import { ServerDecryption } from 'your-library/server';

const decryption = ServerDecryption.getInstance();
const originalData = decryption.decryptData(encryptedData, privateKey);
```

## 📚 Related Documentation

- [Core Encryption Module](./core_documentation.md)
- [Server Module](./server-decryption.md)
- [Key Management](./key-manager.md)
- [Security Best Practices](./security-guide.md)
