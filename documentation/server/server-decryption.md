# Server Decryption Module

The **Server Decryption Module** (`src/server/`) provides a high-level,
production-ready interface for decrypting data using hybrid cryptography in
server environments. It implements the **Singleton Pattern** with automatic key
management, grace period support, and comprehensive health monitoring.

## 🔑 Key Features

- **🔐 Automatic Key Management**: Integrated KeyManager with rotation and grace
  period support
- **🎯 Singleton Pattern**: Single instance management with runtime constructor
  protection
- **🛡️ Zero-Downtime Rotation**: Seamless key rotation with automatic fallback
- **⚡ Express.js Ready**: Built-in middleware and route handlers
- **🩺 Health Monitoring**: Comprehensive status reporting and health checks
- **🎨 Type Safety**: Full TypeScript support with generic return types
- **🔄 Grace Period Decryption**: Automatic fallback to previous keys during
  rotation

## 📁 Module Structure

```
src/server/
├── decrypt.ts              # Main ServerDecryption class
├── index.ts                # Module exports
├── utils.ts                # Server-specific utilities
├── middleware/             # Express.js middleware components
│   ├── index.ts           # Middleware exports
│   ├── encryption.ts      # Encryption context middleware
│   └── key-rotation.ts    # Key rotation middleware
├── routes/                # API route handlers
│   ├── index.ts          # Route exports
│   ├── public-key.ts     # Public key endpoint
│   └── rotate-keys.ts    # Key rotation endpoint
├── storage/               # Storage abstractions
└── cron/                 # Scheduled tasks
    ├── index.ts          # Cron exports
    ├── scheduler.ts      # Task scheduler
    └── key-rotation.ts   # Automatic rotation tasks
```

## 🏗️ Architecture

### Singleton Pattern Implementation

The `ServerDecryption` class uses a **thread-safe singleton pattern** with
runtime constructor protection:

```typescript
// ✅ Correct usage
const server = ServerDecryption.getInstance();

// ❌ This will throw an error
const server = new ServerDecryption(); // Error: Cannot instantiate directly
```

### Automatic Initialization

The server automatically initializes on first use:

```typescript
const server = ServerDecryption.getInstance();
// No manual initialization needed
const decrypted = await server.decryptData(encryptedData); // Auto-initializes
```

### Key Management Integration

```
┌─────────────────────────────────────────────────────────┐
│                ServerDecryption                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│ │   KeyManager    │ │ HybridEncryption│ │   Config    │ │
│ │   (Singleton)   │ │   (Instance)    │ │ Management  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────┘ │
│          │                    │                │        │
│          │                    │                │        │
│          ▼                    ▼                ▼        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           Decryption Pipeline                       │ │
│ │  Keys → Grace Period → Decrypt → Validate → Return │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 📖 API Reference

### Static Methods

#### `getInstance(config?: KeyManagerConfig): ServerDecryption`

Gets the singleton instance of ServerDecryption.

- **Parameters:**
  - `config` (optional): Key management configuration
- **Returns:** `ServerDecryption` - The singleton instance
- **Example:**
  ```typescript
  const server = ServerDecryption.getInstance({
    preset: Preset.HIGH_SECURITY,
    enableFileBackup: true,
    rotationIntervalInMinutes: 60,
  });
  ```

#### `resetInstance(): void`

Resets the singleton instance and cleans up resources. Essential for testing.

- **Example:**
  ```typescript
  ServerDecryption.resetInstance();
  const newServer = ServerDecryption.getInstance(newConfig);
  ```

### Instance Methods

#### `decryptData<T>(encryptedData: EncryptedData): Promise<T>`

Decrypts encrypted data with automatic key management and grace period support.

- **Parameters:**
  - `encryptedData`: Encrypted data structure from client
- **Returns:** `Promise<T>` - Decrypted data with type safety
- **Throws:** Various decryption errors with context
- **Example:**

  ```typescript
  interface UserData {
    userId: number;
    email: string;
    preferences: Record<string, any>;
  }

  const userData = await server.decryptData<UserData>(encryptedData);
  console.log('User ID:', userData.userId);
  ```

#### `getStatus(): Promise<ServerStatus>`

Gets comprehensive status information about the ServerDecryption instance.

- **Returns:** `Promise<ServerStatus>` - Detailed status object
- **Example:**
  ```typescript
  const status = await server.getStatus();
  console.log('Initialized:', status.initialized);
  console.log('Key version:', status.keyManager?.currentKeyVersion);
  ```

#### `healthCheck(): Promise<{healthy: boolean; issues: string[]}>`

Performs a comprehensive health check of the ServerDecryption instance.

- **Returns:** Health status with any detected issues
- **Example:**
  ```typescript
  const health = await server.healthCheck();
  if (!health.healthy) {
    console.warn('Server health issues:', health.issues);
  }
  ```

### Types

#### `ServerStatus`

```typescript
interface ServerStatus {
  initialized: boolean;
  preset: Preset;
  keyManager: KeyManagerStatus | null;
}
```

#### `EncryptedData`

```typescript
interface EncryptedData {
  preset: Preset;
  encryptedContent: Base64;
  cipherText: Base64;
  nonce: Base64;
}
```

## 🎯 Usage Examples

### Basic Server Setup

```typescript
import { ServerDecryption, Preset } from 'your-library/server';

async function basicServerSetup() {
  // Initialize with configuration
  const server = ServerDecryption.getInstance({
    preset: Preset.NORMAL,
    enableFileBackup: true,
    autoGenerate: true,
    rotationIntervalInMinutes: 1440, // 24 hours
  });

  // The server will auto-initialize on first use
  console.log('✅ Server ready for decryption');

  // Example decryption
  const encryptedUserData = {
    preset: 'normal' as Preset,
    encryptedContent: 'eyJ1c2VySWQiOjEyMzQ1...' as Base64,
    cipherText: 'TW9ja0NpcGhlclRleHQ...' as Base64,
    nonce: 'TW9ja05vbmNl...' as Base64,
  };

  try {
    const userData = await server.decryptData<{
      userId: number;
      email: string;
    }>(encryptedUserData);

    console.log('Decrypted user data:', userData);
    return userData;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}
```

### Express.js Integration

```typescript
import express from 'express';
import { ServerDecryption, Preset } from 'your-library/server';

const app = express();
app.use(express.json());

// Initialize server decryption
const serverDecryption = ServerDecryption.getInstance({
  preset: Preset.HIGH_SECURITY,
  enableFileBackup: true,
  rotationIntervalInMinutes: 60,
});

// Decryption endpoint
app.post('/api/decrypt', async (req, res) => {
  try {
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        error: 'Missing encrypted data',
      });
    }

    const decrypted = await serverDecryption.decryptData(encryptedData);

    res.json({
      success: true,
      data: decrypted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Decryption endpoint error:', error);

    res.status(400).json({
      success: false,
      error: 'Decryption failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await serverDecryption.healthCheck();
    const status = await serverDecryption.getStatus();

    res.status(health.healthy ? 200 : 503).json({
      service: 'encryption-server',
      healthy: health.healthy,
      issues: health.issues,
      status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      service: 'encryption-server',
      healthy: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Public key endpoint for clients
app.get('/api/public-key', async (req, res) => {
  try {
    const status = await serverDecryption.getStatus();

    if (!status.keyManager?.hasKeys) {
      return res.status(503).json({
        error: 'Server keys not available',
      });
    }

    // In a real implementation, you'd get the public key
    // This is a placeholder showing the pattern
    res.json({
      publicKey: 'base64-encoded-public-key',
      version: status.keyManager.currentKeyVersion,
      preset: status.preset,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve public key',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Encryption server running on port ${PORT}`);
});
```

### Middleware Pattern

```typescript
import express from 'express';
import { ServerDecryption } from 'your-library/server';

const app = express();
app.use(express.json());

const serverDecryption = ServerDecryption.getInstance();

// Decryption middleware
function decryptionMiddleware() {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      // Check if request has encrypted data
      if (req.body && req.body.encryptedData) {
        console.log('🔐 Decrypting request data...');

        // Decrypt the data
        const decryptedData = await serverDecryption.decryptData(
          req.body.encryptedData,
        );

        // Replace encrypted data with decrypted data
        req.body.data = decryptedData;
        delete req.body.encryptedData;

        console.log('✅ Request data decrypted successfully');
      }

      next();
    } catch (error) {
      console.error('❌ Decryption middleware error:', error);

      res.status(400).json({
        success: false,
        error: 'Invalid encrypted data',
        message: 'Unable to decrypt request data',
      });
    }
  };
}

// Apply middleware to protected routes
app.use('/api/secure', decryptionMiddleware());

// Protected route that receives decrypted data
app.post('/api/secure/user', async (req, res) => {
  // req.body.data contains the decrypted data
  const userData = req.body.data;

  console.log('Processing user data:', userData);

  // Your business logic here
  const result = await processUserRegistration(userData);

  res.json({
    success: true,
    result: result,
  });
});

async function processUserRegistration(userData: any) {
  // Simulate user registration logic
  return {
    userId: userData.userId || Math.floor(Math.random() * 10000),
    email: userData.email,
    registered: true,
    timestamp: new Date().toISOString(),
  };
}
```

### Service Layer Pattern

```typescript
import { ServerDecryption, Preset } from 'your-library/server';

class UserService {
  private serverDecryption: ServerDecryption;

  constructor() {
    this.serverDecryption = ServerDecryption.getInstance({
      preset: Preset.HIGH_SECURITY,
      enableFileBackup: true,
      rotationIntervalInMinutes: 60,
    });
  }

  async processEncryptedUserData(encryptedData: EncryptedData) {
    try {
      // Decrypt user data with type safety
      const userData = await this.serverDecryption.decryptData<{
        userId: number;
        email: string;
        profile: {
          name: string;
          preferences: Record<string, any>;
        };
      }>(encryptedData);

      console.log('Processing user:', userData.userId);

      // Validate decrypted data
      if (!this.validateUserData(userData)) {
        throw new Error('Invalid user data structure');
      }

      // Process business logic
      const result = await this.saveUserProfile(userData);

      return {
        success: true,
        userId: userData.userId,
        saved: result,
      };
    } catch (error) {
      console.error('User data processing failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  private validateUserData(userData: any): boolean {
    return (
      userData &&
      typeof userData.userId === 'number' &&
      typeof userData.email === 'string' &&
      userData.profile &&
      typeof userData.profile.name === 'string'
    );
  }

  private async saveUserProfile(userData: any) {
    // Simulate database save
    console.log('Saving user profile for:', userData.email);
    return { profileId: Math.floor(Math.random() * 10000) };
  }

  async getServerHealth() {
    const health = await this.serverDecryption.healthCheck();
    const status = await this.serverDecryption.getStatus();

    return {
      decryptionService: {
        healthy: health.healthy,
        issues: health.issues,
        initialized: status.initialized,
        preset: status.preset,
        keyStatus: status.keyManager,
      },
    };
  }
}

// Usage example
async function serviceExample() {
  const userService = new UserService();

  // Process encrypted user registration
  const encryptedUserData = {
    preset: 'high_security' as Preset,
    encryptedContent: 'encrypted-user-data...' as Base64,
    cipherText: 'cipher-text...' as Base64,
    nonce: 'nonce...' as Base64,
  };

  const result = await userService.processEncryptedUserData(encryptedUserData);
  console.log('Service result:', result);

  // Check service health
  const health = await userService.getServerHealth();
  console.log('Service health:', health);
}
```

### Production Monitoring

```typescript
import { ServerDecryption } from 'your-library/server';

class ProductionMonitor {
  private serverDecryption: ServerDecryption;
  private metrics = {
    decryptionAttempts: 0,
    decryptionSuccesses: 0,
    decryptionFailures: 0,
    lastHealthCheck: new Date(),
    healthCheckFailures: 0,
  };

  constructor() {
    this.serverDecryption = ServerDecryption.getInstance({
      preset: Preset.HIGH_SECURITY,
      enableFileBackup: true,
      rotationIntervalInMinutes: 60,
      rotationGracePeriodInMinutes: 10,
    });

    this.startMonitoring();
  }

  private startMonitoring() {
    // Health check every 5 minutes
    setInterval(
      async () => {
        try {
          const health = await this.serverDecryption.healthCheck();
          this.metrics.lastHealthCheck = new Date();

          if (!health.healthy) {
            this.metrics.healthCheckFailures++;
            this.alertUnhealthyServer(health.issues);
          } else {
            console.log('✅ Server health check passed');
          }
        } catch (error) {
          this.metrics.healthCheckFailures++;
          console.error('❌ Health check failed:', error);
        }
      },
      5 * 60 * 1000,
    );

    // Metrics reporting every hour
    setInterval(
      () => {
        this.reportMetrics();
      },
      60 * 60 * 1000,
    );
  }

  async monitoredDecryption<T>(encryptedData: EncryptedData): Promise<T> {
    this.metrics.decryptionAttempts++;

    try {
      const result = await this.serverDecryption.decryptData<T>(encryptedData);
      this.metrics.decryptionSuccesses++;
      return result;
    } catch (error) {
      this.metrics.decryptionFailures++;
      this.logDecryptionFailure(error, encryptedData);
      throw error;
    }
  }

  private alertUnhealthyServer(issues: string[]) {
    console.error('🚨 Server health alert:', issues);

    // Send alert to monitoring system
    // this.sendAlert('server_unhealthy', { issues });
  }

  private logDecryptionFailure(error: any, encryptedData: EncryptedData) {
    console.error('❌ Decryption failure:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      preset: encryptedData.preset,
      timestamp: new Date().toISOString(),
    });
  }

  private reportMetrics() {
    const successRate =
      this.metrics.decryptionAttempts > 0
        ? (this.metrics.decryptionSuccesses / this.metrics.decryptionAttempts) *
          100
        : 0;

    console.log('📊 Decryption metrics:', {
      attempts: this.metrics.decryptionAttempts,
      successes: this.metrics.decryptionSuccesses,
      failures: this.metrics.decryptionFailures,
      successRate: `${successRate.toFixed(2)}%`,
      healthCheckFailures: this.metrics.healthCheckFailures,
      lastHealthCheck: this.metrics.lastHealthCheck.toISOString(),
    });
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

// Usage
const monitor = new ProductionMonitor();

// Use monitored decryption in your routes
app.post('/api/monitored-decrypt', async (req, res) => {
  try {
    const result = await monitor.monitoredDecryption(req.body.encryptedData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Decryption failed' });
  }
});
```

## 🛡️ Security Features

### Automatic Key Management

```typescript
// Server handles all key management automatically
const server = ServerDecryption.getInstance({
  rotationIntervalInMinutes: 60, // Rotate keys every hour
  rotationGracePeriodInMinutes: 10, // 10-minute overlap period
  enableFileBackup: true, // Persist keys to disk
  autoGenerate: true, // Generate keys if missing
});

// No manual key management required
const decrypted = await server.decryptData(encryptedData);
```

### Grace Period Support

```typescript
// Automatic fallback during key rotation
// - Primary key is tried first
// - Previous keys are tried if primary fails
// - Zero-downtime key rotation
const decrypted = await server.decryptData(encryptedData);
// Handles grace period automatically
```

### Input Validation

```typescript
// Comprehensive input validation
try {
  const decrypted = await server.decryptData(encryptedData);
} catch (error) {
  // Detailed error information for debugging
  console.error('Validation error:', error.message);
}
```

## 📊 Performance Considerations

### Singleton Benefits

- **Memory Efficiency**: Single instance across application
- **Key Caching**: Automatic caching of current and grace period keys
- **Connection Reuse**: Shared resources across requests

### Optimization Tips

```typescript
// ✅ Good: Reuse singleton instance
const server = ServerDecryption.getInstance();
// Use server for multiple requests

// ✅ Good: Configure appropriately for your needs
const server = ServerDecryption.getInstance({
  preset: Preset.NORMAL, // Use NORMAL for general use
  rotationIntervalInMinutes: 1440, // 24 hours for production
  enableFileBackup: true, // Persist keys for restarts
});

// ❌ Avoid: Frequent instance resets
ServerDecryption.resetInstance(); // Only needed in tests
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  async measureDecryption(encryptedData: EncryptedData) {
    const server = ServerDecryption.getInstance();

    const start = performance.now();
    const result = await server.decryptData(encryptedData);
    const end = performance.now();

    const duration = end - start;
    console.log(`Decryption took ${duration.toFixed(2)}ms`);

    return { result, duration };
  }
}
```

## 🧪 Testing Support

### Unit Testing

```typescript
import { ServerDecryption, Preset } from 'your-library/server';

describe('ServerDecryption', () => {
  beforeEach(() => {
    // Reset singleton for clean tests
    ServerDecryption.resetInstance();
  });

  afterEach(() => {
    // Cleanup after each test
    ServerDecryption.resetInstance();
  });

  test('singleton pattern works correctly', () => {
    const instance1 = ServerDecryption.getInstance();
    const instance2 = ServerDecryption.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('auto-initializes on first use', async () => {
    const server = ServerDecryption.getInstance({
      enableFileBackup: false,
      autoGenerate: true,
    });

    // Should auto-initialize
    const status = await server.getStatus();
    expect(status.initialized).toBe(true);
  });

  test('handles invalid encrypted data', async () => {
    const server = ServerDecryption.getInstance({
      enableFileBackup: false,
      autoGenerate: true,
    });

    const invalidData = {} as EncryptedData;

    await expect(server.decryptData(invalidData)).rejects.toThrow();
  });
});
```

### Integration Testing

```typescript
test('integrates with Express.js', async () => {
  const app = express();
  app.use(express.json());

  const server = ServerDecryption.getInstance({
    enableFileBackup: false,
    autoGenerate: true,
  });

  app.post('/decrypt', async (req, res) => {
    try {
      const result = await server.decryptData(req.body.encryptedData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false });
    }
  });

  // Test the endpoint
  const response = await request(app)
    .post('/decrypt')
    .send({ encryptedData: mockEncryptedData });

  // Assertions based on expected behavior
});
```

### Mock Testing

```typescript
// Create test utilities for mocking
const createMockEncryptedData = (): EncryptedData => ({
  preset: Preset.NORMAL,
  encryptedContent: 'bW9ja0VuY3J5cHRlZERhdGE=' as Base64,
  cipherText: 'bW9ja0NpcGhlclRleHQ=' as Base64,
  nonce: 'bW9ja05vbmNl' as Base64,
});

test('handles mock data appropriately', async () => {
  const server = ServerDecryption.getInstance({
    enableFileBackup: false,
    autoGenerate: true,
  });

  const mockData = createMockEncryptedData();

  // This should fail with mock data, but test the error handling
  await expect(server.decryptData(mockData)).rejects.toThrow();
});
```

## 🚨 Error Handling

### Error Types and Recovery

```typescript
import { ServerDecryption, EncryptionError } from 'your-library/server';

async function robustDecryption(encryptedData: EncryptedData) {
  const server = ServerDecryption.getInstance();

  try {
    return await server.decryptData(encryptedData);
  } catch (error) {
    if (error instanceof EncryptionError) {
      console.log('Encryption error:', error.message);
      console.log('Context:', error.context);
    } else {
      console.log('Unknown error:', error);
    }

    // Attempt recovery
    const health = await server.healthCheck();
    if (!health.healthy) {
      console.log('Server unhealthy, attempting recovery...');
      // Implement recovery logic
    }

    throw error; // Re-throw after logging
  }
}
```

### Production Error Handling

```typescript
class ErrorHandler {
  static async handleDecryptionError(error: any, encryptedData: EncryptedData) {
    // Log error with context
    console.error('Decryption error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      preset: encryptedData.preset,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Send to monitoring system
    // await this.sendErrorToMonitoring(error, encryptedData);

    // Determine appropriate HTTP status
    if (error.message.includes('validation')) {
      return 400; // Bad Request
    } else if (error.message.includes('key')) {
      return 503; // Service Unavailable
    } else {
      return 500; // Internal Server Error
    }
  }
}
```

## 📚 Related Documentation

- [Core Module Overview](../core/core-documentation.md)
- [HybridEncryption Details](../core/hybrid-encryption.md)
- [KeyManager Details](../core/key-manager.md)
- [Server Quickstart](./server-quickstart.md)
- [Client Integration](../client/client-encryption.md)

## 🔗 External Resources

- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
