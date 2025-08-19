# Quick Start Guide: Server Decryption

Get up and running with the ServerDecryption module in under 5 minutes!

## 🚀 Installation

```bash
npm install your-hybrid-encryption-library
```

## 📦 Import

```typescript
import {
  ServerDecryption,
  getServerDecryption,
} from 'your-hybrid-encryption-library/server';
```

## ⚡ Basic Usage (3 Steps)

### Step 1: Get Instance

```typescript
const server = ServerDecryption.getInstance();
```

### Step 2: Decrypt Data

```typescript
// Encrypted data received from client
const encryptedData = {
  preset: 'normal',
  encryptedContent: 'base64-encrypted-content...',
  cipherText: 'base64-cipher-text...',
  nonce: 'base64-nonce...',
};

const decrypted = await server.decryptData(encryptedData);
```

### Step 3: Use Decrypted Data

```typescript
console.log('Decrypted user data:', decrypted);
// Process your business logic with the decrypted data
```

## 🎯 Complete Example

```typescript
import {
  ServerDecryption,
  Preset,
} from 'your-hybrid-encryption-library/server';

async function handleEncryptedRequest() {
  // Initialize server with configuration
  const server = ServerDecryption.getInstance({
    preset: Preset.NORMAL,
    enableFileBackup: true,
    autoGenerate: true,
  });

  // Encrypted data from client request
  const encryptedUserData = {
    preset: 'normal',
    encryptedContent:
      'eyJ1c2VySWQiOjEyMzQ1LCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ==',
    cipherText: 'TW9ja0NpcGhlclRleHRGb3JUZXN0aW5nUHVycG9zZXM=',
    nonce: 'TW9ja05vbmNlRm9yVGVzdGluZw==',
  };

  try {
    // Decrypt the data
    const userData = await server.decryptData<{
      userId: number;
      email: string;
    }>(encryptedUserData);

    console.log('✅ Decryption successful:', userData);

    // Process your business logic
    return processUserData(userData);
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Unable to process encrypted data');
  }
}

function processUserData(userData: { userId: number; email: string }) {
  // Your business logic here
  console.log(
    `Processing user ${userData.userId} with email ${userData.email}`,
  );
  return { success: true, userId: userData.userId };
}
```

## 🌐 Express.js Integration

### Basic Express Setup

```typescript
import express from 'express';
import { ServerDecryption } from 'your-hybrid-encryption-library/server';

const app = express();
app.use(express.json());

// Initialize server decryption
const serverDecryption = ServerDecryption.getInstance({
  preset: Preset.NORMAL,
  enableFileBackup: true,
});

// Server's Public Key Distribution endpoint
app.get('/api/public-key', async (req, res) => {
  const sd = ServerDecryption.getInstance();
  const publicKey = await sd.getPublicKeyBase64();
  res.json({
    success: true,
    publicKey,
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = await serverDecryption.healthCheck();
  res.status(health.healthy ? 200 : 503).json(health);
});

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});
```

### Middleware Pattern

```typescript
import { decryptionMiddleware } from 'your-hybrid-encryption-library/server/middleware';

// Automatically decrypts incoming requests that have the encrypted data shape.
app.use('/api/secure', decryptionMiddleware());

// Protected route that automatically handles decryption
app.post('/api/secure/user', async (req, res) => {
  // req.body.encryptedData is automatically decrypted to req.body.data
  const userData = req.body.data;

  // Process your business logic
  const result = await processUserRegistration(userData);
  res.json(result);
});
```

## 🔒 Security Presets

| Preset                 | Use Case       | Key Type    | Security Level |
| ---------------------- | -------------- | ----------- | -------------- |
| `Preset.NORMAL`        | General use    | ML-KEM-768  | Standard       |
| `Preset.HIGH_SECURITY` | Sensitive data | ML-KEM-1024 | Maximum        |

```typescript
// For maximum security
const highSecurityServer = ServerDecryption.getInstance({
  preset: Preset.HIGH_SECURITY,
  rotationIntervalInMinutes: 30, // More frequent rotation
});
```

## 🛡️ Key Features

- ✅ **Automatic Key Management**: Zero-configuration key generation and
  rotation
- ✅ **Grace Period Support**: Seamless decryption during key rotation
- ✅ **Singleton Pattern**: One instance per application
- ✅ **Post-Quantum Security**: ML-KEM + AES-GCM encryption
- ✅ **Type Safe**: Full TypeScript support with generics
- ✅ **Express.js Ready**: Built-in middleware and route handlers

## 🚨 Common Pitfalls

❌ **Don't do this:**

```typescript
const server = new ServerDecryption(); // Error: Cannot instantiate directly
```

✅ **Do this instead:**

```typescript
const server = ServerDecryption.getInstance(); // Correct singleton usage
```

✅ **Let it auto-initialize:**

```typescript
const server = ServerDecryption.getInstance();
// Auto-initializes on first decryptData call
const result = await server.decryptData(data); // ✅ Works correctly
```

## 📊 Configuration Options

### Development Configuration

```typescript
const devConfig = {
  preset: Preset.NORMAL,
  enableFileBackup: false, // In-memory only
  autoGenerate: true,
  rotationIntervalInMinutes: 30, // Shorter for testing
  certPath: './tmp/dev-certs',
};
```

### Production Configuration

```typescript
const prodConfig = {
  preset: Preset.HIGH_SECURITY,
  enableFileBackup: true,
  autoGenerate: true,
  rotationIntervalInMinutes: 60, // 1 hour rotation
  certPath: '/etc/app/certs',
  rotationGracePeriodInMinutes: 10,
};
```

## 🩺 Health Monitoring

### Basic Health Check

```typescript
const server = ServerDecryption.getInstance();

// Check server health
const health = await server.healthCheck();
console.log('Server healthy:', health.healthy);

if (!health.healthy) {
  console.log('Issues:', health.issues);
}
```

### Status Information

```typescript
const status = await server.getStatus();
console.log('Status:', {
  initialized: status.initialized,
  preset: status.preset,
  keyVersion: status.keyManager?.currentKeyVersion,
  hasKeys: status.keyManager?.hasKeys,
});
```

## 🧪 Testing

```typescript
import { ServerDecryption } from 'your-hybrid-encryption-library/server';

beforeEach(() => {
  ServerDecryption.resetInstance(); // Clean slate for each test
});

test('decrypts data correctly', async () => {
  const server = ServerDecryption.getInstance({
    enableFileBackup: false,
    autoGenerate: true,
  });

  // Test with mock encrypted data
  const mockEncryptedData = {
    preset: 'normal',
    encryptedContent: 'base64-content',
    cipherText: 'base64-cipher',
    nonce: 'base64-nonce',
  };

  // This will auto-initialize the server
  try {
    const result = await server.decryptData(mockEncryptedData);
    // Handle result or expected error
  } catch (error) {
    // Expected with mock data
    expect(error).toBeDefined();
  }
});
```

## 🔄 Key Rotation

Key rotation happens automatically, but you can monitor it:

```typescript
const server = ServerDecryption.getInstance({
  rotationIntervalInMinutes: 60, // Rotate every hour
  rotationGracePeriodInMinutes: 10, // 10-minute grace period
});

// Monitor key status
setInterval(async () => {
  const status = await server.getStatus();
  console.log('Current key version:', status.keyManager?.currentKeyVersion);
  console.log('Last rotation:', status.keyManager?.lastRotation);
}, 30000); // Check every 30 seconds
```

## 📚 What's Next?

- [Full Documentation](./server-decryption.md)
- [Middleware Guide](./server-middleware.md)
- [Advanced Examples](../examples/server-decryption-usage.ts)
- [Client Integration](../client/client-quickstart.md)

---

**Need help?** Check the [troubleshooting guide](./troubleshooting.md) or open
an issue.
