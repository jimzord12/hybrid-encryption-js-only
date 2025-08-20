# 📦 Installation Guide

## Quick Install Commands

Copy and paste these commands to get started quickly:

### Frontend/Client-Side Apps

```bash
npm install ./hybrid-encryption-client-<VERSION>>.tgz
```

### Backend/Server Apps

```bash
npm install ./hybrid-encryption-server-<VERSION>>.tgz
```

### Full-Stack Applications

```bash
npm install ./hybrid-encryption-client-<VERSION>>.tgz ./hybrid-encryption-server-<VERSION>>.tgz
```

### All Packages

```bash
npm install ./hybrid-encryption-*.tgzc
```

## Usage After Installation

### Client (Frontend)

```typescript
import { ClientEncryption, Preset } from '@hybrid-encryption/client';

const encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);

// NEW: Encrypt with remote public key
const encrypted = await encryption.encryptDataWithRemoteKey(
  { data: 'sensitive' },
  'https://your-server.com/api/crypto', // ✅
  // 'https://your-server.com/api/crypto/public-key' ❌
);
```

⚠️ `encryptDataWithRemoteKey` Expects the BaseURL! **NOT** the `'/public-key'`
part!!!

### Server (Express.js)

```typescript
import express from 'express';
import { decryptionRoutes, decryptMiddleware } from '@hybrid-encryption/server';

const app = express();
app.use(express.json());

// Option 1: Predefined routes (fastest)
app.use('/api/crypto', decryptionRoutes);

// Option 2: Custom middleware
app.post('/api/data', decryptMiddleware, (req, res) => {
  console.log('Decrypted:', req.body.data);
  res.json({ success: true });
});

app.listen(3000);
```

## Available Endpoints (when using decryptionRoutes)

| Method | URL                      | Purpose                 |
| ------ | ------------------------ | ----------------------- |
| GET    | `<base-url>/public-key`  | Get server's public key |
| POST   | `<base-url>/rotate-keys` | Trigger key rotation    |
| POST   | `<base-url>/round-trip`  | Test encrypt/decrypt    |

## Client Integration Example

```typescript
// Frontend code - automatically fetch server's public key
const encryption = ClientEncryption.getInstance();

const sensitiveData = {
  creditCard: '4111-1111-1111-1111',
  amount: 999.99,
};

const encrypted = await encryption.encryptDataWithRemoteKey(
  sensitiveData,
  'https://your-server.com/api/crypto/public-key', // Server endpoint
);

// Send to your server
fetch('/api/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: encrypted }),
});
```

## Server Integration Example

```typescript
// Backend code - automatic decryption
import express from 'express';
import { decryptMiddleware } from '@hybrid-encryption/server';

const app = express();
app.use(express.json());

app.post('/api/process-payment', decryptMiddleware, (req, res) => {
  // req.body.data is automatically decrypted by middleware
  const { creditCard, amount } = req.body.data;

  // Process payment with decrypted data
  processPayment(creditCard, amount);

  res.json({ success: true });
});
```

## Package Sizes

- **Client**: 40KB (browser-optimized)
- **Server**: 128KB (includes Express integration)
- **Core**: 121KB (advanced features)
- **Utils**: 49KB (validation helpers)

## Requirements

- **Node.js**: 18+
- **Express**: 4.x or 5.x (for server package)
- **Browser**: Modern browsers with Web Crypto API

## Need Help?

- [📖 Full Documentation](./documentation/)
- [⚡ Examples](./examples/)
- [🔧 Express Integration Guide](./examples/EXPRESS_INTEGRATION_GUIDE.md)
