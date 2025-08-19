# KeyManager Module

The **KeyManager** class is a comprehensive singleton-based key lifecycle
management system that handles ML-KEM key generation, rotation, storage, and
validation. It provides enterprise-grade key management with automatic rotation,
grace period support, and production-ready monitoring capabilities.

## 🔑 Key Features

- **🔄 Automatic Key Rotation**: Configurable rotation intervals with
  zero-downtime support
- **⏰ Grace Period Support**: Maintains old keys during rotation for seamless
  decryption
- **💾 Persistent Storage**: File-based key storage with configurable backup
- **🛡️ Secure Key Handling**: Automatic key cleanup and secure memory management
- **📊 Health Monitoring**: Comprehensive status reporting and health checks
- **🎯 Singleton Pattern**: Thread-safe single instance management
- **🔧 Service Architecture**: Modular services for different key management
  aspects
- **⚙️ Configurable Options**: Flexible configuration for different deployment
  scenarios

## 🏗️ Architecture

### Service-Based Design

The KeyManager delegates responsibilities to specialized services:

```
┌─────────────────────────────────────────────────────────┐
│                   KeyManager                            │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│ │ Configuration   │ │ Storage         │ │ Lifecycle   │ │
│ │ Service         │ │ Service         │ │ Service     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────┘ │
│ ┌─────────────────┐ ┌─────────────────┐               │ │
│ │ Rotation        │ │ History         │               │ │
│ │ Service         │ │ Service         │               │ │
│ └─────────────────┘ └─────────────────┘               │ │
└─────────────────────────────────────────────────────────┘
```

### Rotation Timeline

```
Time:     0────────60min────────70min────────────────120min
         │          │           │                     │
State:   │ Active   │ Rotating  │ Grace Period        │ Next Active
         │          │           │                     │
Keys:    │ Key-v1   │ Key-v1 +  │ Key-v2 + Key-v1    │ Key-v2
         │          │ Key-v2    │ (fallback)          │
```

## 📖 API Reference

### Static Methods

#### `getInstance(config?: KeyManagerConfig): KeyManager`

Gets or creates the singleton KeyManager instance.

- **Parameters:**
  - `config` (optional): Configuration object for key management
- **Returns:** `KeyManager` - The singleton instance
- **Example:**
  ```typescript
  const keyManager = KeyManager.getInstance({
    preset: Preset.HIGH_SECURITY,
    rotationGracePeriodInMinutes: 30,
    enableFileBackup: true,
  });
  ```

#### `resetInstance(): void`

Resets the singleton instance and cleans up resources. Essential for testing.

- **Example:**
  ```typescript
  KeyManager.resetInstance(); // Clean up for tests
  ```

### Instance Methods

#### `initialize(): Promise<void>`

Initializes the KeyManager with configuration validation, directory setup, and
key loading.

- **Throws:** KeyManagerError if initialization fails
- **Example:**
  ```typescript
  await keyManager.initialize();
  ```

#### `getKeyPair(): Promise<KeyPair>`

Gets the current active key pair, ensuring keys are valid and rotating if
needed.

- **Returns:** `Promise<KeyPair>` - Current active key pair
- **Example:**
  ```typescript
  const keyPair = await keyManager.getKeyPair();
  console.log('Public key length:', keyPair.publicKey.length);
  ```

#### `getPublicKey(): Promise<Uint8Array>`

Gets the current public key as Uint8Array.

- **Returns:** `Promise<Uint8Array>` - Public key bytes
- **Example:**
  ```typescript
  const publicKey = await keyManager.getPublicKey();
  ```

#### `getPublicKeyBase64(): Promise<string>`

Gets the current public key as Base64-encoded string.

- **Returns:** `Promise<string>` - Base64-encoded public key
- **Example:**
  ```typescript
  const publicKeyB64 = await keyManager.getPublicKeyBase64();
  console.log('Public key:', publicKeyB64);
  ```

#### `getSecretKey(): Promise<Uint8Array>`

Gets the current secret key as Uint8Array.

- **Returns:** `Promise<Uint8Array>` - Secret key bytes
- **Security:** Handle with care, zero after use
- **Example:**
  ```typescript
  const secretKey = await keyManager.getSecretKey();
  // Use secretKey...
  // Key is automatically cleaned up by KeyManager
  ```

#### `getSecretKeyBase64(): Promise<string>`

Gets the current secret key as Base64-encoded string.

- **Returns:** `Promise<string>` - Base64-encoded secret key
- **Example:**
  ```typescript
  const secretKeyB64 = await keyManager.getSecretKeyBase64();
  ```

#### `getDecryptionKeys(): Promise<KeyPair[]>`

Gets all available keys for decryption (current + grace period keys).

- **Returns:** `Promise<KeyPair[]>` - Array of usable key pairs
- **Example:**
  ```typescript
  const keyPairs = await keyManager.getDecryptionKeys();
  console.log(`Available ${keyPairs.length} key pairs for decryption`);
  ```

#### `rotateKeys(): Promise<void>`

Manually triggers key rotation process.

- **Note:** Automatic rotation happens based on configuration
- **Example:**
  ```typescript
  await keyManager.rotateKeys();
  console.log('Key rotation completed');
  ```

#### `getStatus(): Promise<KeyManagerStatus>`

Gets comprehensive status information about the KeyManager.

- **Returns:** `Promise<KeyManagerStatus>` - Detailed status object
- **Example:**
  ```typescript
  const status = await keyManager.getStatus();
  console.log('Key valid:', status.keysValid);
  console.log('Current version:', status.currentKeyVersion);
  ```

#### `healthCheck(): Promise<{healthy: boolean; issues: string[]}>`

Performs a comprehensive health check of the KeyManager.

- **Returns:** Health status with any detected issues
- **Example:**
  ```typescript
  const health = await keyManager.healthCheck();
  if (!health.healthy) {
    console.warn('Issues detected:', health.issues);
  }
  ```

#### `getConfig(): Required<KeyManagerConfig>`

Gets the current configuration (read-only copy).

- **Returns:** Complete configuration object
- **Example:**
  ```typescript
  const config = keyManager.getConfig();
  console.log('Rotation interval:', config.rotationIntervalInMinutes);
  ```

## ⚙️ Configuration

### KeyManagerConfig Interface

```typescript
interface KeyManagerConfig {
  preset?: Preset; // Security preset (NORMAL/HIGH_SECURITY)
  certPath?: string; // Directory for key storage
  rotationIntervalInMinutes?: number; // Key rotation frequency
  rotationGracePeriodInMinutes?: number; // Grace period for old keys
  enableFileBackup?: boolean; // Enable persistent storage
  autoGenerate?: boolean; // Auto-generate keys if missing
}
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  preset: Preset.NORMAL,
  certPath: './config/certs',
  rotationIntervalInMinutes: 1440, // 24 hours
  rotationGracePeriodInMinutes: 10, // 10 minutes
  enableFileBackup: true,
  autoGenerate: true,
};
```

### Configuration Examples

#### Production Configuration

```typescript
const productionConfig: KeyManagerConfig = {
  preset: Preset.HIGH_SECURITY,
  certPath: '/etc/app/certs',
  rotationIntervalInMinutes: 60, // 1 hour rotation
  rotationGracePeriodInMinutes: 15, // 15 minute grace period
  enableFileBackup: true,
  autoGenerate: true,
};

const keyManager = KeyManager.getInstance(productionConfig);
```

#### Development Configuration

```typescript
const developmentConfig: KeyManagerConfig = {
  preset: Preset.NORMAL,
  certPath: './tmp/dev-certs',
  rotationIntervalInMinutes: 30, // 30 minute rotation for testing
  rotationGracePeriodInMinutes: 5, // 5 minute grace period
  enableFileBackup: false, // In-memory only
  autoGenerate: true,
};
```

#### High-Frequency Rotation

```typescript
const highFrequencyConfig: KeyManagerConfig = {
  preset: Preset.HIGH_SECURITY,
  rotationIntervalInMinutes: 15, // 15 minute rotation
  rotationGracePeriodInMinutes: 3, // 3 minute grace period
  enableFileBackup: true,
  autoGenerate: true,
};
```

## 🎯 Usage Examples

### Basic Usage

```typescript
import { KeyManager, Preset } from 'your-library/core';

async function basicKeyManagement() {
  // Initialize KeyManager
  const keyManager = KeyManager.getInstance({
    preset: Preset.NORMAL,
    autoGenerate: true,
  });

  await keyManager.initialize();

  // Get current keys
  const keyPair = await keyManager.getKeyPair();
  const publicKey = await keyManager.getPublicKey();
  const publicKeyB64 = await keyManager.getPublicKeyBase64();

  console.log('Key pair ready:', {
    publicKeyLength: keyPair.publicKey.length,
    hasSecretKey: !!keyPair.secretKey,
    version: keyPair.metadata.version,
    createdAt: keyPair.metadata.createdAt,
  });

  // Use keys for encryption/decryption
  // ...
}
```

### Production Deployment

```typescript
import { KeyManager, Preset } from 'your-library/core';

class ProductionKeyManagement {
  private keyManager: KeyManager;

  constructor() {
    this.keyManager = KeyManager.getInstance({
      preset: Preset.HIGH_SECURITY,
      certPath: process.env.CERT_PATH || '/etc/app/certs',
      rotationIntervalInMinutes: parseInt(
        process.env.KEY_ROTATION_MINUTES || '60',
      ),
      rotationGracePeriodInMinutes: parseInt(
        process.env.GRACE_PERIOD_MINUTES || '10',
      ),
      enableFileBackup: process.env.NODE_ENV === 'production',
      autoGenerate: true,
    });
  }

  async initialize() {
    await this.keyManager.initialize();

    // Set up monitoring
    this.setupHealthMonitoring();

    console.log('✅ Production KeyManager initialized');
  }

  private setupHealthMonitoring() {
    // Check health every 5 minutes
    setInterval(
      async () => {
        const health = await this.keyManager.healthCheck();
        if (!health.healthy) {
          console.error('❌ KeyManager health check failed:', health.issues);
          // Alert your monitoring system
          this.alertMonitoring('key_manager_unhealthy', health.issues);
        }
      },
      5 * 60 * 1000,
    );
  }

  async getDecryptionCapabilities() {
    const keyPairs = await this.keyManager.getDecryptionKeys();
    return {
      keyCount: keyPairs.length,
      versions: keyPairs.map((kp) => kp.metadata.version),
      hasGracePeriod: keyPairs.length > 1,
    };
  }

  private alertMonitoring(event: string, details: any) {
    // Send to your monitoring/alerting system
    console.error(`🚨 ALERT: ${event}`, details);
  }
}
```

### Key Rotation Monitoring

```typescript
import { KeyManager } from 'your-library/core';

class KeyRotationMonitor {
  private keyManager: KeyManager;
  private rotationHistory: Array<{
    timestamp: Date;
    oldVersion: number;
    newVersion: number;
    duration: number;
  }> = [];

  constructor() {
    this.keyManager = KeyManager.getInstance();
  }

  async monitorRotations() {
    let lastVersion: number | null = null;

    setInterval(async () => {
      const status = await this.keyManager.getStatus();

      if (lastVersion && status.currentKeyVersion !== lastVersion) {
        // Rotation detected
        const rotationEvent = {
          timestamp: new Date(),
          oldVersion: lastVersion,
          newVersion: status.currentKeyVersion!,
          duration: status.lastRotation
            ? Date.now() - status.lastRotation.getTime()
            : 0,
        };

        this.rotationHistory.push(rotationEvent);
        this.logRotationEvent(rotationEvent);
      }

      lastVersion = status.currentKeyVersion;
    }, 30 * 1000); // Check every 30 seconds
  }

  private logRotationEvent(event: any) {
    console.log('🔄 Key rotation completed:', {
      from: `v${event.oldVersion}`,
      to: `v${event.newVersion}`,
      duration: `${event.duration}ms`,
      timestamp: event.timestamp.toISOString(),
    });
  }

  getRotationMetrics() {
    return {
      totalRotations: this.rotationHistory.length,
      averageDuration:
        this.rotationHistory.reduce((sum, r) => sum + r.duration, 0) /
        this.rotationHistory.length,
      lastRotation: this.rotationHistory[this.rotationHistory.length - 1],
      rotationFrequency: this.calculateRotationFrequency(),
    };
  }

  private calculateRotationFrequency() {
    if (this.rotationHistory.length < 2) return 0;

    const timeSpan =
      this.rotationHistory[
        this.rotationHistory.length - 1
      ].timestamp.getTime() - this.rotationHistory[0].timestamp.getTime();

    return (this.rotationHistory.length - 1) / (timeSpan / (1000 * 60 * 60)); // rotations per hour
  }
}
```

### Grace Period Testing

```typescript
import { KeyManager, HybridEncryption } from 'your-library/core';

class GracePeriodTester {
  private keyManager: KeyManager;
  private encryption: HybridEncryption;

  constructor() {
    this.keyManager = KeyManager.getInstance({
      rotationIntervalInMinutes: 2, // Fast rotation for testing
      rotationGracePeriodInMinutes: 1, // 1 minute grace period
      enableFileBackup: false,
    });
    this.encryption = new HybridEncryption();
  }

  async testGracePeriodDecryption() {
    await this.keyManager.initialize();

    // Get initial key and encrypt data
    const initialKeyPair = await this.keyManager.getKeyPair();
    const testData = { message: 'Grace period test', timestamp: Date.now() };

    const encrypted = this.encryption.encrypt(
      testData,
      initialKeyPair.publicKey,
    );
    console.log(
      '✅ Data encrypted with version:',
      initialKeyPair.metadata.version,
    );

    // Wait for rotation to occur
    console.log('⏳ Waiting for key rotation...');
    await this.waitForRotation(initialKeyPair.metadata.version);

    // Test decryption with new keys (should use grace period)
    console.log('🔄 Testing grace period decryption...');
    const decryptionKeys = await this.keyManager.getDecryptionKeys();

    console.log(
      'Available keys:',
      decryptionKeys.map((kp) => ({
        version: kp.metadata.version,
        isActive: kp === (await this.keyManager.getKeyPair()),
      })),
    );

    // This should work because old key is still available in grace period
    const secretKeys = decryptionKeys
      .map((kp) => kp.secretKey!)
      .filter((key) => key);

    const decrypted = this.encryption.decryptWithGracePeriod(
      encrypted,
      secretKeys,
    );
    console.log('✅ Grace period decryption successful:', decrypted);

    return decrypted;
  }

  private async waitForRotation(currentVersion: number): Promise<void> {
    return new Promise((resolve) => {
      const checkRotation = async () => {
        const status = await this.keyManager.getStatus();
        if (status.currentKeyVersion !== currentVersion) {
          console.log(
            `🔄 Rotation completed: v${currentVersion} → v${status.currentKeyVersion}`,
          );
          resolve();
        } else {
          setTimeout(checkRotation, 1000); // Check every second
        }
      };
      checkRotation();
    });
  }
}
```

## 🛡️ Security Features

### Secure Key Storage

```typescript
// Keys are stored securely with proper file permissions
const storageFeatures = {
  filePermissions: '600', // Owner read/write only
  directoryPermissions: '700', // Owner access only
  encryption: 'AES-256-GCM', // File encryption (planned)
  backup: 'Configurable rotation', // Secure backup strategy
  cleanup: 'Automatic memory zeroing', // Secure memory management
};
```

### Key Validation

```typescript
// Comprehensive key validation
const validation = await keyManager.healthCheck();

// Validation includes:
// - Key format correctness
// - Key length verification
// - Expiration checking
// - Cryptographic integrity
// - Metadata consistency
```

### Rotation Security

```typescript
// Secure rotation process
const rotationSecurity = {
  atomicity: 'All-or-nothing rotation',
  gracePeriod: 'No service interruption',
  fallback: 'Automatic rollback on failure',
  audit: 'Complete rotation history',
  verification: 'New key validation before activation',
};
```

## 📊 Monitoring and Observability

### Status Information

```typescript
interface KeyManagerStatus {
  hasKeys: boolean; // Keys are available
  keysValid: boolean; // Keys pass validation
  keysExpired: boolean; // Keys are expired
  isRotating: boolean; // Rotation in progress
  currentKeyVersion: number | null; // Current key version
  createdAt: Date | null; // Key creation time
  expiresAt: Date | null; // Key expiration time
  certPath: string; // Storage path
  lastRotation: Date | null; // Last rotation time
}
```

### Health Monitoring

```typescript
// Example health check integration
import { KeyManager } from 'your-library/core';

async function healthEndpoint(req: Request, res: Response) {
  const keyManager = KeyManager.getInstance();
  const health = await keyManager.healthCheck();

  const response = {
    service: 'key-manager',
    status: health.healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    details: {
      issues: health.issues,
      keyStatus: await keyManager.getStatus(),
    },
  };

  res.status(health.healthy ? 200 : 503).json(response);
}
```

### Metrics Collection

```typescript
class KeyManagerMetrics {
  private keyManager: KeyManager;
  private metrics = {
    rotations: 0,
    rotationFailures: 0,
    healthCheckFailures: 0,
    lastHealthCheck: new Date(),
    avgRotationDuration: 0,
  };

  constructor() {
    this.keyManager = KeyManager.getInstance();
    this.startMetricsCollection();
  }

  private startMetricsCollection() {
    // Monitor rotations
    setInterval(async () => {
      const status = await this.keyManager.getStatus();

      if (status.isRotating) {
        const start = Date.now();
        // Wait for rotation to complete
        await this.waitForRotationComplete();
        const duration = Date.now() - start;

        this.metrics.rotations++;
        this.updateAverageRotationDuration(duration);
      }
    }, 10 * 1000);

    // Monitor health
    setInterval(async () => {
      try {
        const health = await this.keyManager.healthCheck();
        this.metrics.lastHealthCheck = new Date();

        if (!health.healthy) {
          this.metrics.healthCheckFailures++;
        }
      } catch (error) {
        this.metrics.healthCheckFailures++;
      }
    }, 60 * 1000);
  }

  private updateAverageRotationDuration(newDuration: number) {
    this.metrics.avgRotationDuration =
      (this.metrics.avgRotationDuration * (this.metrics.rotations - 1) +
        newDuration) /
      this.metrics.rotations;
  }

  getMetrics() {
    return { ...this.metrics };
  }
}
```

## 🧪 Testing

### Unit Testing

```typescript
import { KeyManager, Preset } from 'your-library/core';

describe('KeyManager', () => {
  beforeEach(() => {
    KeyManager.resetInstance(); // Clean slate for each test
  });

  afterEach(() => {
    KeyManager.resetInstance(); // Cleanup after each test
  });

  test('singleton pattern works correctly', () => {
    const instance1 = KeyManager.getInstance();
    const instance2 = KeyManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('initializes with default config', async () => {
    const keyManager = KeyManager.getInstance();
    await keyManager.initialize();

    const config = keyManager.getConfig();
    expect(config.preset).toBe(Preset.NORMAL);
    expect(config.autoGenerate).toBe(true);
  });

  test('generates keys when auto-generate is enabled', async () => {
    const keyManager = KeyManager.getInstance({
      autoGenerate: true,
      enableFileBackup: false,
    });

    await keyManager.initialize();
    const keyPair = await keyManager.getKeyPair();

    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.metadata.version).toBe(1);
  });

  test('key rotation works correctly', async () => {
    const keyManager = KeyManager.getInstance({
      autoGenerate: true,
      enableFileBackup: false,
      rotationGracePeriodInMinutes: 1,
    });

    await keyManager.initialize();
    const initialKeyPair = await keyManager.getKeyPair();
    const initialVersion = initialKeyPair.metadata.version;

    // Trigger rotation
    await keyManager.rotateKeys();

    const newKeyPair = await keyManager.getKeyPair();
    expect(newKeyPair.metadata.version).toBe(initialVersion + 1);

    // Check grace period keys are available
    const decryptionKeys = await keyManager.getDecryptionKeys();
    expect(decryptionKeys.length).toBe(2); // New + old key
  });
});
```

### Integration Testing

```typescript
test('integrates with HybridEncryption', async () => {
  const keyManager = KeyManager.getInstance({
    autoGenerate: true,
    enableFileBackup: false,
  });

  await keyManager.initialize();

  const encryption = new HybridEncryption();
  const keyPair = await keyManager.getKeyPair();

  const testData = { integration: 'test' };
  const encrypted = encryption.encrypt(testData, keyPair.publicKey);
  const decrypted = encryption.decrypt(encrypted, keyPair.secretKey!);

  expect(decrypted).toEqual(testData);
});
```

### Performance Testing

```typescript
test('performance under load', async () => {
  const keyManager = KeyManager.getInstance({
    autoGenerate: true,
    enableFileBackup: false,
  });

  await keyManager.initialize();

  // Test concurrent key access
  const promises = Array(100)
    .fill(0)
    .map(() => keyManager.getPublicKey());

  const start = Date.now();
  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  expect(results).toHaveLength(100);
  expect(duration).toBeLessThan(1000); // Should complete in under 1 second
});
```

## 🚨 Error Handling

### Common Error Scenarios

```typescript
import { KeyManager, createAppropriateError } from 'your-library/core';

try {
  const keyManager = KeyManager.getInstance({
    certPath: '/invalid/path',
    enableFileBackup: true,
  });

  await keyManager.initialize();
} catch (error) {
  if (error.message.includes('ENOENT')) {
    console.log('Certificate directory does not exist');
    // Handle directory creation or path correction
  }
}
```

### Error Recovery Patterns

```typescript
class RobustKeyManager {
  private keyManager: KeyManager;
  private fallbackConfig: KeyManagerConfig;

  constructor(primaryConfig: KeyManagerConfig) {
    this.fallbackConfig = {
      ...primaryConfig,
      enableFileBackup: false, // Fallback to memory-only
      autoGenerate: true,
    };
  }

  async initializeWithFallback() {
    try {
      this.keyManager = KeyManager.getInstance();
      await this.keyManager.initialize();
    } catch (error) {
      console.warn('Primary initialization failed, trying fallback:', error);

      // Reset and try with fallback config
      KeyManager.resetInstance();
      this.keyManager = KeyManager.getInstance(this.fallbackConfig);

      try {
        await this.keyManager.initialize();
        console.log('✅ Fallback initialization successful');
      } catch (fallbackError) {
        throw new Error(
          `Both primary and fallback initialization failed: ${fallbackError}`,
        );
      }
    }
  }

  async safeGetKeyPair(): Promise<KeyPair | null> {
    try {
      return await this.keyManager.getKeyPair();
    } catch (error) {
      console.error('Failed to get key pair:', error);

      // Attempt recovery
      try {
        await this.keyManager.rotateKeys();
        return await this.keyManager.getKeyPair();
      } catch (recoveryError) {
        console.error('Key recovery failed:', recoveryError);
        return null;
      }
    }
  }
}
```

## 📚 Related Documentation

- [Core Module Overview](./core-documentation.md)
- [HybridEncryption Details](./hybrid-encryption.md)
- [Core Utils](./core-utils.md)
- [Client Integration](../client/client-encryption.md)
- [Server Integration](../server/server-decryption.md)

## 🔗 External Resources

- [ML-KEM Specification](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Key Management Best Practices](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf)
