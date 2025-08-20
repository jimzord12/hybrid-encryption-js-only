# Distributable NPM Packages

This project can export 4 separate npm packages for modular distribution.

## 🎯 What You Get

After running the build script, you'll have 4 distributable `.tgz` files:

### 1. **@hybrid-encryption/client** (40.3 KB)

- **Purpose**: Client-side encryption for browsers/frontend
- **Platform**: Browser + Node.js
- **Dependencies**: Minimal crypto libraries only
- **Use Case**: Encrypt data before sending to server

### 2. **@hybrid-encryption/server** (127.7 KB)

- **Purpose**: Server-side decryption with Express integration
- **Platform**: Node.js only
- **Dependencies**: Includes Express middleware + key management
- **Use Case**: Decrypt data from clients, handle key rotation

### 3. **@hybrid-encryption/core** (120.8 KB)

- **Purpose**: Low-level encryption engine and key management
- **Platform**: Node.js only
- **Dependencies**: Full crypto suite + key providers
- **Use Case**: Custom implementations, advanced usage

### 4. **@hybrid-encryption/utils** (48.5 KB)

- **Purpose**: Utility functions and helpers
- **Platform**: Browser + Node.js
- **Dependencies**: Minimal utilities
- **Use Case**: Validation, formatting, debugging

## 🚀 How to Build & Distribute

### Build All Packages

```bash
npm run build:packages
```

This will:

1. Clean and rebuild the TypeScript
2. Generate individual package.json files
3. Create compressed `.tgz` files in `./packages/`

### Distribute to Others

Send the `.tgz` files to your users. They can install like this:

```bash
# Install specific packages
npm install ./hybrid-encryption-client-1.0.0.tgz
npm install ./hybrid-encryption-server-1.0.0.tgz

# Or install all at once
npm install ./hybrid-encryption-*.tgz
```

## 📦 Package Usage Examples

### Client Package Only

```typescript
// Frontend/Browser code
import { ClientEncryption } from '@hybrid-encryption/client';

const encrypted = await ClientEncryption.encrypt(data, publicKey);
```

### Server Package Only

```typescript
// Backend/Node.js code
import express from 'express';
import {
  ServerDecryption,
  encryptionMiddleware,
} from '@hybrid-encryption/server';

const app = express();
app.use(encryptionMiddleware());

app.post('/api/decrypt', async (req, res) => {
  const decrypted = await ServerDecryption.decrypt(req.body);
  res.json(decrypted);
});
```

### Core Package (Advanced)

```typescript
// Custom implementation
import { HybridEncryption, KeyManager } from '@hybrid-encryption/core';

const keyManager = KeyManager.getInstance();
await keyManager.initialize();

// Direct access to encryption engine
const result = HybridEncryption.encrypt(data, publicKey);
```

### Utils Package

```typescript
// Validation and helpers
import { validateEncryptedData, deepCompare } from '@hybrid-encryption/utils';

const isValid = validateEncryptedData(encryptedData);
const areEqual = deepCompare(obj1, obj2);
```

## 🎯 Distribution Strategies

### Strategy 1: Minimal Install

Users only install what they need:

- **Frontend projects**: Just `@hybrid-encryption/client`
- **Backend projects**: Just `@hybrid-encryption/server`
- **Full-stack projects**: Both client + server

### Strategy 2: Scoped Packages

If you publish to npm registry:

```bash
npm install @hybrid-encryption/client
npm install @hybrid-encryption/server
npm install @hybrid-encryption/core
npm install @hybrid-encryption/utils
```

### Strategy 3: Private Registry

Upload to your own npm registry for internal distribution.

## 🔧 Customization

### Modify Package Names

Edit the package names in `scripts/build-packages.sh`:

```json
"name": "@your-company/encryption-client"
```

### Adjust Dependencies

Each package has carefully selected dependencies:

- **Client**: Browser-compatible only
- **Server**: Includes Express + Node.js features
- **Core**: Full feature set
- **Utils**: Minimal shared utilities

### Version Management

Sync versions across all packages by updating the script.

## ✅ Benefits

1. **Modular**: Users install only what they need
2. **Small bundles**: Client package is only 40KB
3. **Type-safe**: Full TypeScript support in all packages
4. **Zero-config**: Packages work out of the box
5. **Cross-platform**: Client works in browsers, server in Node.js
6. **Production-ready**: Includes sourcemaps, minification, CJS/ESM

## 🚨 Important Notes

- The build script recreates package.json files each time
- Source maps are included for debugging
- All packages include both CommonJS and ES modules
- Express is a peer dependency for the server package
- Client package has zero Node.js dependencies
