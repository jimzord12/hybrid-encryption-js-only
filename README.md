# Hybrid Encryption Library (TypeScript)

A production-ready hybrid encryption library combining **ML-KEM** (post-quantum
asymmetric) and **AES-GCM** (symmetric) cryptography for optimal security and
performance.

## � Installation

### Option 1: Install Individual Packages (Recommended)

```bash
# For client-side encryption (browsers, React, etc.)
npm install ./hybrid-encryption-client-1.0.0.tgz

# For server-side decryption (Node.js, Express)
npm install ./hybrid-encryption-server-1.0.0.tgz

# For advanced usage (custom implementations)
npm install ./hybrid-encryption-core-1.0.0.tgz

# For utilities (validation, helpers)
npm install ./hybrid-encryption-utils-1.0.0.tgz
```

### Option 2: Install All Packages

```bash
npm install ./hybrid-encryption-*.tgz
```

### Option 3: Build from Source

```bash
git clone https://github.com/jimzord12/hybrid-encryption-js-only.git
cd hybrid-encryption-js-only
npm install
npm run build:packages
```

## 🔐 Quick Start - Client Encryption

```typescript
import { ClientEncryption, Preset } from '@hybrid-encryption/client';

// Get encryption instance
const enc = ClientEncryption.getInstance();

// Method 1: Encrypt with local public key
const userData = {
  email: 'user@example.com',
  creditCard: '4111-1111-1111-1111',
};

// If you have the Server's Public key in Base64 or Uint8Array format...
const encrypted = enc.encryptData(userData, serverPublicKey);

// Method 2: NEW! Encrypt by using the Server's endpoint (url)
const encrypted2 = await enc.encryptDataWithRemoteKey(
  userData,
  'https://your-server.com/api', ✅
  // 'https://your-server.com/api/public-key', ❌
);
```

🚨 Do **NOT** add `/public-key` at the end, if you use the provided
`decryptionRoutes`

🚨 The Server must use the same library!

## ⚡ Quick Start - Express Server

```typescript
import express from 'express';
import { decryptionRoutes, decryptMiddleware } from '@hybrid-encryption/server';

const app = express();
app.use(express.json());

// Method 1: Use predefined routes (fastest setup)
app.use('/api/encryption', decryptionRoutes);

// Method 2: Use middleware for custom routes
app.post('/api/secure-data', decryptMiddleware, (req, res) => {
  // req.body.data is automatically decrypted
  console.log('Decrypted data:', req.body.data);
  res.json({ success: true, data: req.body.data });
});

app.listen(3000, () => {
  console.log('🔒 Secure server running on port 3000');
});
```

## 📚 Documentation

- **[Client Module Documentation](./documentation/client-encryption.md)** -
  Complete API reference and examples
- **[Quick Start Guide](./documentation/client-quickstart.md)** - Get started in
  5 minutes
- **[Usage Examples](./examples/client-encryption-usage.ts)** - Comprehensive
  examples

## 🏗️ Architecture

This library provides four modular packages:

### 📱 Client Package (`@hybrid-encryption/client`)

- **Purpose**: Client-side data encryption for any platform
- **Platform**: Universal (Browser, Node.js, React Native, Electron)
- **Size**: 40KB compressed
- **Key Features**:
  - 🔒 **Dual Encryption Methods**: Local keys + remote key fetching
  - 🌐 **`encryptDataWithRemoteKey()`**: Fetch server's public key automatically
  - ⚡ **Singleton Pattern**: Consistent configuration across your app
  - 🛡️ **Runtime Protection**: Constructor safety and type validation
  - 📦 **Zero Dependencies**: Pure crypto implementation
  - 🎯 **TypeScript-First**: Full type safety and IntelliSense

### 🖥️ Server Package (`@hybrid-encryption/server`)

- **Purpose**: Server-side data decryption with Express.js integration
- **Platform**: Node.js (filesystem operations required)
- **Size**: 128KB compressed
- **Key Features**:
  - ⚡ **Express Ready**: Pre-built routes and middleware
  - 🔄 **Auto Key Rotation**: Zero-downtime key management
  - 🛠️ **Predefined Routes**:
    - `GET /public-key` - Get current public key
    - `POST /rotate-keys` - Trigger key rotation
    - `POST /round-trip` - Test encryption/decryption
  - 🎛️ **Middleware**: `decryptMiddleware` for custom routes
  - 📊 **Production Monitoring**: Comprehensive error handling and logging
  - ⏰ **Scheduled Tasks**: Automated key rotation with node-cron

### 🔧 Core Package (`@hybrid-encryption/core`)

- **Purpose**: Low-level encryption engine and advanced key management
- **Platform**: Node.js
- **Size**: 121KB compressed
- **Key Features**:
  - 🏗️ **Strategy Pattern**: Pluggable key providers
  - 🔐 **Direct API Access**: `HybridEncryption.encrypt()`
  - 🎛️ **Advanced Configuration**: Custom presets and parameters
  - 📈 **Performance Optimized**: High-throughput operations

### 🛠️ Utils Package (`@hybrid-encryption/utils`)

- **Purpose**: Shared utilities and validation functions
- **Platform**: Universal (Browser + Node.js)
- **Size**: 49KB compressed
- **Key Features**:
  - ✅ **Data Validation**: `validateEncryptedData()`
  - 🔍 **Deep Comparison**: `deepCompare()` for testing
  - 🔄 **Format Converters**: Base64, Buffer, and type utilities
  - 🧪 **Testing Helpers**: Mock data and validation tools

## 🛡️ Security Features

- ✅ **Post-Quantum Ready**: ML-KEM encryption
- ✅ **Hybrid Approach**: Asymmetric + Symmetric for performance
- ✅ **Multiple Security Presets**: Normal and High Security modes
- ✅ **Automatic Key Management**: Built-in key rotation and lifecycle
- ✅ **Memory Safety**: Secure key cleanup and management

## 🚀 Advanced Usage Examples

### Client-Side Examples

```typescript
import { ClientEncryption, Preset } from '@hybrid-encryption/client';

// Example 1: High-security financial data
const encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);

const paymentData = {
  cardNumber: '4111-1111-1111-1111',
  amount: 999.99,
  currency: 'USD',
};

// Encrypt with remote key (recommended)
const encrypted = await encryption.encryptDataWithRemoteKey(
  paymentData,
  'https://api.yourbank.com/public-key',
);

// Send to server
fetch('/api/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: encrypted }),
});

// Example 2: Local key encryption
const localEncrypted = encryption.encryptData(userData, publicKeyBuffer);
```

### Server-Side Examples

```typescript
import express from 'express';
import {
  decryptionRoutes,
  decryptMiddleware,
  ServerDecryption,
} from '@hybrid-encryption/server';

const app = express();
app.use(express.json());

// Method 1: Use all predefined routes
app.use('/api/crypto', decryptionRoutes);
// Provides:
// GET  /api/crypto/public-key    - Get server's public key
// POST /api/crypto/rotate-keys   - Manually rotate keys
// POST /api/crypto/round-trip    - Test encrypt/decrypt

// Method 2: Custom routes with middleware
app.post('/api/secure-endpoint', decryptMiddleware, (req, res) => {
  // Data is automatically decrypted by middleware
  const { user, action, data } = req.body.data;

  // Process the decrypted data
  processSecureAction(user, action, data);

  res.json({ success: true });
});

// Method 3: Manual decryption for complex scenarios
app.post('/api/custom-decrypt', async (req, res) => {
  try {
    const decryption = ServerDecryption.getInstance();
    const decryptedData = await decryption.decryptData(
      req.body.encryptedPayload,
    );

    // Custom business logic here
    const result = await processBusinessLogic(decryptedData);

    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: 'Decryption failed' });
  }
});

app.listen(3000);
```

## 📋 Available Express Routes

When using `decryptionRoutes`, you get these endpoints:

| Method | Endpoint       | Description                   | Response                      |
| ------ | -------------- | ----------------------------- | ----------------------------- |
| GET    | `/public-key`  | Get current public key        | `{ publicKey: "base64..." }`  |
| POST   | `/rotate-keys` | Manually trigger key rotation | `{ success: true }`           |
| POST   | `/round-trip`  | Test encrypt/decrypt cycle    | `{ success: true, data: {} }` |

### Example: Getting Public Key

```bash
# Get server's public key
curl https://your-server.com/api/crypto/public-key

# Response:
{
  "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFA...",
  "keyId": "key-2024-08-20-v1",
  "expires": "2024-08-27T10:30:00Z"
}
```

## 🎯 Use Cases

- **Financial Applications**: Secure payment processing
- **Healthcare Systems**: Patient data protection
- **E-commerce**: Credit card and personal information
- **Enterprise Software**: Sensitive business data
- **IoT Devices**: Secure device communication
- **API Testing**: Bruno/Postman/Insomnia integration for encrypted endpoint
  testing

## 📊 Performance

| Operation            | Speed | Security Level |
| -------------------- | ----- | -------------- |
| NORMAL Preset        | ~1ms  | Standard       |
| HIGH_SECURITY Preset | ~2ms  | Maximum        |

_Benchmarks on standard hardware for 1KB data_

## 🧪 Testing

```bash
# Run all tests
npm test

# Run client module tests
npm test tests/client/

# Run with coverage
npm run test:coverage
```

## 📋 Requirements

- **Node.js**: 18+ (for server features)
- **TypeScript**: 5.0+ (recommended)
- **Browser**: Modern browsers with Web Crypto API support
- **Express**: 4.x or 5.x (for server package)

## 🎯 Package Selection Guide

Choose the right packages for your use case:

| Use Case              | Install Packages            | Size  | Platform          |
| --------------------- | --------------------------- | ----- | ----------------- |
| Frontend App          | `@hybrid-encryption/client` | 40KB  | Browser/Universal |
| Backend API           | `@hybrid-encryption/server` | 128KB | Node.js           |
| Full-Stack            | `client` + `server`         | 168KB | Both              |
| Custom Implementation | `@hybrid-encryption/core`   | 121KB | Node.js           |
| Testing/Validation    | `@hybrid-encryption/utils`  | 49KB  | Universal         |

## 🏗️ Build Your Own Packages

Want to distribute your own versions?

```bash
# Clone and build packages
git clone https://github.com/jimzord12/hybrid-encryption-js-only.git
cd hybrid-encryption-js-only
npm install
npm run build:packages

# Packages will be created in ./packages/
ls packages/
# hybrid-encryption-client-1.0.0.tgz
# hybrid-encryption-server-1.0.0.tgz
# hybrid-encryption-core-1.0.0.tgz
# hybrid-encryption-utils-1.0.0.tgz
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🔗 Links

- **[📖 Complete Documentation](./documentation/)** - Detailed guides and API
  reference
- **[⚡ Quick Examples](./examples/)** - Ready-to-run code samples
- **[📦 Package Distribution Guide](./documentation/DISTRIBUTABLE_PACKAGES.md)** -
  How to build and distribute packages
- **[🔒 Client API Reference](./documentation/client/client-encryption.md)** -
  Client package documentation
- **[🖥️ Server API Reference](./documentation/server/server-decryption.md)** -
  Server package documentation
- **[🛠️ Express Integration Guide](./examples/EXPRESS_INTEGRATION_GUIDE.md)** -
  Express.js setup examples
- **[🧪 Bruno API Testing Guide](./documentation/BRUNO_INTEGRATION.md)** - How
  to test encrypted APIs with Bruno
