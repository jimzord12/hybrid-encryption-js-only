# Quick Start Guide: Client Encryption

Get up and running with the ClientEncryption module in under 5 minutes!

## 🚀 Installation

```bash
npm install your-hybrid-encryption-library
```

## 📦 Import

```typescript
import {
  ClientEncryption,
  Preset,
} from 'your-hybrid-encryption-library/client';
```

## ⚡ Basic Usage (3 Steps)

### Step 1: Get Instance

```typescript
const encryption = ClientEncryption.getInstance();
```

### Step 2: Prepare Data

```typescript
const myData = {
  message: 'Hello, secure world!',
  userId: 12345,
  timestamp: new Date().toISOString(),
};
```

### Step 3: Encrypt

⚠️ This is **NOT** your Public key, BUT the **Receiver's (Server)** Public Key

```typescript
const publicKey = "receiver's-base64-public-key-here";
// encryptData also support Uint8Array format
// const publicKey = new Uint8Array([...]);
const encrypted = encryption.encryptData(myData, publicKey);
```

## 🎯 Complete Example

```typescript
import {
  ClientEncryption,
  Preset,
} from 'your-hybrid-encryption-library/client';

// Get encryption instance
const encryption = ClientEncryption.getInstance(Preset.NORMAL);

// Your sensitive data
const userData = {
  email: 'user@example.com',
  creditCard: '4111-1111-1111-1111',
};

// Server's public key (Base64 or Uint8Array)
const serverPublicKey = 'LS0tLS1CRUdJTi...';

// Encrypt the data
try {
  const encryptedData = encryption.encryptData(userData, serverPublicKey);

  // Send to server
  fetch('/api/secure-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: encryptedData }),
  });

  console.log('✅ Data encrypted and sent securely!');
} catch (error) {
  console.error('❌ Encryption failed:', error);
}
```

## 🔒 Security Presets

| Preset                 | Use Case       | Security Level |
| ---------------------- | -------------- | -------------- |
| `Preset.NORMAL`        | General use    | Standard       |
| `Preset.HIGH_SECURITY` | Sensitive data | Maximum        |

```typescript
// For maximum security
const highSecurityEncryption = ClientEncryption.getInstance(
  Preset.HIGH_SECURITY,
);
```

## 🛡️ Key Features

- ✅ **Singleton Pattern**: One instance per application
- ✅ **Post-Quantum Security**: ML-KEM + AES-GCM
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Flexible Input**: Base64 strings or Uint8Array keys
- ✅ **Error Handling**: Detailed error messages

## 🚨 Common Pitfalls

❌ **Don't do this:**

```typescript
const enc = new ClientEncryption(); // Error: Cannot instantiate directly
```

✅ **Do this instead:**

```typescript
const enc = ClientEncryption.getInstance(); // Correct singleton usage
```

## 🧪 Testing

```typescript
import { ClientEncryption } from 'your-hybrid-encryption-library/client';

beforeEach(() => {
  ClientEncryption.resetInstance(); // Clean slate for each test
});

test('encrypts data correctly', () => {
  const encryption = ClientEncryption.getInstance();
  const result = encryption.encryptData({ test: 'data' }, mockKey);
  expect(result).toHaveProperty('encryptedContent');
});
```

## 📚 What's Next?

- [Full Documentation](./client-encryption.md)
- [Advanced Examples](../examples/client-encryption-usage.ts)
- [Server Integration](./server-decryption.md)
- [Security Best Practices](./security-guide.md)

---

**Need help?** Check the [troubleshooting guide](./troubleshooting.md) or open
an issue.
