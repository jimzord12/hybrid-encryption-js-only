# Hybrid Encryption Library (TypeScript)

A production-ready hybrid encryption library combining **ML-KEM** (post-quantum
asymmetric) and **AES-GCM** (symmetric) cryptography for optimal security and
performance.

## 🔐 Quick Start - Client Encryption

```typescript
import { ClientEncryption, Preset } from 'hybrid-encryption-library/client';

// Get encryption instance
const encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);

// Encrypt sensitive data
const userData = {
  email: 'user@example.com',
  creditCard: '4111-1111-1111-1111',
};

const encrypted = encryption.encryptData(userData, serverPublicKey);
// Ready to send securely to your server!
```

## 📚 Documentation

- **[Client Module Documentation](./documentation/client-encryption.md)** -
  Complete API reference and examples
- **[Quick Start Guide](./documentation/client-quickstart.md)** - Get started in
  5 minutes
- **[Usage Examples](./examples/client-encryption-usage.ts)** - Comprehensive
  examples

## 🏗️ Architecture

This library provides two main packages:

### 📱 Client Package (`src/client/`)

- **Purpose**: Client-side data encryption
- **Platform**: Universal (Browser, Node.js, React Native)
- **Key Features**:
  - Singleton pattern for consistent configuration
  - Runtime constructor protection
  - Support for Base64 and binary public keys
  - TypeScript-first with full type safety

### 🖥️ Server Package (`src/server/`)

- **Purpose**: Server-side data decryption
- **Platform**: Node.js (filesystem operations required)
- **Key Features**:
  - Express middleware integration
  - Automatic key rotation
  - Production monitoring
  - Comprehensive error handling

## 🛡️ Security Features

- ✅ **Post-Quantum Ready**: ML-KEM encryption
- ✅ **Hybrid Approach**: Asymmetric + Symmetric for performance
- ✅ **Multiple Security Presets**: Normal and High Security modes
- ✅ **Automatic Key Management**: Built-in key rotation and lifecycle
- ✅ **Memory Safety**: Secure key cleanup and management

## 🚀 Installation

```bash
npm install hybrid-encryption-library
```

## 📖 Basic Usage

### Client-Side Encryption

```typescript
import { ClientEncryption } from 'hybrid-encryption-library/client';

const encryption = ClientEncryption.getInstance();
const encrypted = encryption.encryptData(sensitiveData, publicKey);
```

### Server-Side Setup

```typescript
import { ServerDecryption } from 'hybrid-encryption-library/server';

const decryption = ServerDecryption.getInstance();
const originalData = decryption.decryptData(encryptedData, privateKey);
```

## 🎯 Use Cases

- **Financial Applications**: Secure payment processing
- **Healthcare Systems**: Patient data protection
- **E-commerce**: Credit card and personal information
- **Enterprise Software**: Sensitive business data
- **IoT Devices**: Secure device communication

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

- **Node.js**: 16+ (for server features)
- **TypeScript**: 4.5+ (recommended)
- **Browser**: Modern browsers with crypto support

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

- [Documentation](./documentation/)
- [Examples](./examples/)
- [API Reference](./documentation/client-encryption.md)
- [Security Guide](./documentation/security-guide.md)
