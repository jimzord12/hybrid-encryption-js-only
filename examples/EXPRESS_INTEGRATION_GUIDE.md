# Express.js v5 Integration Guide

## Quick Start

This guide shows how to integrate the hybrid encryption library with Express.js
v5 for automatic encryption/decryption of sensitive data.

## 🚀 Server Setup

### 1. Basic Express Server with Automatic Decryption

```javascript
import express from 'express';
import {
  ServerDecryption,
  decryptMiddleware,
  decryptionRouter,
  DecryptionError,
} from 'hybrid-encryption-js-only/server';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// Mount built-in encryption routes
app.use('/api/crypto', decryptionRouter);

// Your routes with automatic decryption
app.post('/api/users', decryptMiddleware, (req, res) => {
  const userData = req.body.data; // Automatically decrypted!

  // Process the decrypted data
  console.log('User email:', userData.email);

  res.json({ success: true, userId: 'user_123' });
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof DecryptionError) {
    return res.status(400).json({ error: 'Decryption failed' });
  }
  res.status(500).json({ error: 'Server error' });
});

app.listen(3000, () => {
  console.log('🔐 Secure server running on http://localhost:3000');
});
```

### 2. Built-in Routes Available

When you mount `decryptionRouter`, you get these endpoints automatically:

- `GET /api/crypto/public-key` - Get current public key
- `POST /api/crypto/rotate-keys` - Trigger key rotation
- `POST /api/crypto/round-trip` - Test encryption/decryption

## 🔒 Client Integration

### 1. Basic Client Encryption

```javascript
import { ClientEncryption } from 'hybrid-encryption-js-only/client';

// Initialize client
const client = ClientEncryption.getInstance();

// Get public key from server
const response = await fetch('http://localhost:3000/api/crypto/public-key');
const { publicKey } = await response.json();

// Encrypt sensitive data
const sensitiveData = {
  email: 'user@example.com',
  creditCard: '4532-1234-5678-9012',
  ssn: '123-45-6789',
};

const encrypted = client.encryptData(sensitiveData, publicKey);

// Send to server
await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: encrypted }),
});
```

## 🧪 Running the Tests

### Real-World Scenario Test

```bash
# Run the comprehensive integration test
npm test tests/server/express/real-world-scenario.test.ts

# Output shows complete workflow:
# ✅ 1. Client successfully requested public key
# ✅ 2. Client successfully encrypted sensitive data
# ✅ 3. Client successfully sent encrypted data to server
# ✅ 4. Server middleware automatically decrypted data
# ✅ 5. Data integrity verified - no corruption occurred
```

## 🔐 Security Features

### 1. Automatic Encryption/Decryption

- Client encrypts data before transmission
- Server middleware automatically decrypts incoming data
- No plaintext sensitive data in transit

### 2. Key Management

- Automatic key generation and rotation
- Grace period support during key transitions
- Secure key storage and retrieval

### 3. Data Integrity

- All data types preserved exactly (strings, numbers, objects, arrays)
- No corruption during encryption/decryption cycles
- Cryptographic integrity verification

## 📊 Performance

### Benchmarks (from test results)

- Single encryption/decryption: ~5-10ms
- Key generation: ~50-100ms (one-time cost)
- Concurrent operations: Handled efficiently
- Memory usage: Optimized with singleton patterns

## 🛡️ Production Considerations

### 1. Environment Configuration

```javascript
// Production server setup
const serverDecryption = ServerDecryption.getInstance({
  preset: 'high-security', // Use stronger encryption
  keyExpiryMonths: 3, // Rotate keys every 3 months
  rotationGracePeriodInMinutes: 60, // Allow 1 hour for transitions
  enableFileBackup: true, // Backup old keys
  certPath: '/secure/keys', // Secure key storage location
});
```

### 2. Error Handling Best Practices

```javascript
app.use((err, req, res, next) => {
  // Log for monitoring
  console.error('Encryption error:', {
    error: err.message,
    endpoint: req.path,
    timestamp: new Date().toISOString(),
  });

  if (err instanceof DecryptionError) {
    return res.status(400).json({
      success: false,
      error: 'Data decryption failed',
      code: 'DECRYPTION_ERROR',
    });
  }

  // Don't expose internal errors in production
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});
```

### 3. Health Monitoring

```javascript
app.get('/health', async (req, res) => {
  const serverDecryption = ServerDecryption.getInstance();
  const health = await serverDecryption.healthCheck();

  res.json({
    status: health.healthy ? 'healthy' : 'unhealthy',
    encryption: {
      available: health.healthy,
      issues: health.issues,
    },
    timestamp: new Date().toISOString(),
  });
});
```

## 📝 Example Use Cases

### 1. User Registration with PII

```javascript
// Client encrypts personal information
const userData = {
  email: 'user@example.com',
  personalInfo: {
    fullName: 'John Doe',
    ssn: '123-45-6789',
    dateOfBirth: '1990-01-01',
  },
};

const encrypted = client.encryptData(userData, publicKey);
// Send to /api/users/register
```

### 2. Payment Processing

```javascript
// Client encrypts payment information
const paymentData = {
  amount: 99.99,
  creditCard: '4532-1234-5678-9012',
  cvv: '123',
  billingAddress: {
    /* ... */
  },
};

const encrypted = client.encryptData(paymentData, publicKey);
// Send to /api/payments/process
```

### 3. Medical Records

```javascript
// Client encrypts health information
const medicalData = {
  patientId: 'P123456',
  diagnosis: 'Hypertension',
  medications: ['Lisinopril 10mg'],
  notes: 'Patient reports improved symptoms',
};

const encrypted = client.encryptData(medicalData, publicKey);
// Send to /api/medical/records
```

## 🚀 Demo Applications

### Run the Complete Demo

```bash
# Terminal 1: Start the server
node examples/express-server-demo.js

# Terminal 2: Run the client demo
node examples/client-server-demo.js
```

This will demonstrate:

- User registration with encrypted PII
- Payment processing with encrypted financial data
- Document upload with encrypted metadata
- Security verification of transmission
- Health monitoring

## 📚 Additional Resources

- **Tests**: `tests/server/express/` - Complete integration tests
- **Examples**: `examples/` - Working server and client demos
- **Documentation**: `documentation/` - Detailed API documentation

## 🔧 Troubleshooting

### Common Issues

1. **"fetch is not defined"** - Use Node.js 18+ or polyfill fetch
2. **Key not found errors** - Ensure server is initialized before handling
   requests
3. **Decryption failures** - Check that client and server use the same key
4. **TypeScript errors** - Ensure proper imports and type definitions

### Debug Mode

```javascript
// Enable debug logging
process.env.NODE_ENV = 'development';

// The library will provide detailed logs for troubleshooting
```

This integration provides enterprise-grade security for sensitive data
transmission while maintaining simplicity and performance for production
applications.
