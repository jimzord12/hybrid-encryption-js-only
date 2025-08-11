// Key Management Unit Tests
// Run with: npm run test
// File: tests/core/key-management.test.ts

import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  KeyManager,
  getKeyManager,
  getPrivateKey,
  getPublicKey,
  healthCheck,
  initializeKeyManagement,
} from '../../../src/core/key-rotation';
import { KeyManagerConfig } from '../../../src/core/types/key-rotation.types';

// Compute __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CERT_PATH = path.join(__dirname, 'test-certs');
const TEST_CONFIG: KeyManagerConfig = {
  certPath: TEST_CERT_PATH,
  keySize: 2048,
  keyExpiryMonths: 1,
  autoGenerate: true,
  enableFileBackup: true,
  rotationGracePeriod: 1, // 1 minute for testing
};

console.log('TEST_CERT_PATH:', TEST_CERT_PATH);

describe('KeyManager Core Tests', () => {
  beforeEach(async () => {
    // Reset singleton and clean test directory
    KeyManager.resetInstance();
    await cleanTestDirectory();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanTestDirectory();
    KeyManager.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = KeyManager.getInstance();
      const instance2 = KeyManager.getInstance();
      const instance3 = getKeyManager();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });

    it('should allow resetting the instance', () => {
      const instance1 = KeyManager.getInstance();
      KeyManager.resetInstance();
      const instance2 = KeyManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should apply configuration only to first instance', () => {
      const instance1 = KeyManager.getInstance({ keySize: 2048 });
      const instance2 = KeyManager.getInstance({ keySize: 4096 }); // Should be ignored

      expect(instance1).toBe(instance2);
      expect(instance1.getConfig().keySize).toBe(2048);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with default config', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await expect(manager.initialize()).resolves.not.toThrow();

      const status = await manager.getStatus();
      expect(status.hasKeys).toBe(true);
      expect(status.keysValid).toBe(true);
    });

    it('should create cert directory if it does not exist', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      const exists = await fs
        .access(TEST_CERT_PATH)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should generate keys when none exist and autoGenerate is true', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      const publicKey = await manager.getPublicKey();
      const privateKey = await manager.getPrivateKey();

      expect(publicKey).toContain('BEGIN PUBLIC KEY');
      expect(privateKey).toContain('BEGIN RSA PRIVATE KEY');
    });

    it('should fail when no keys exist and autoGenerate is false', async () => {
      const config = { ...TEST_CONFIG, autoGenerate: false };
      const manager = KeyManager.getInstance(config);

      await expect(manager.initialize()).rejects.toThrow(
        'No keys found and auto-generation is disabled'
      );
    });

    it('should not initialize twice', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // Second initialization should be a no-op
      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Key Loading and Saving', () => {
    it('should save and load keys from filesystem', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      const originalKeys = await manager.getKeyPair();

      // Reset and create new instance
      KeyManager.resetInstance();
      const newManager = KeyManager.getInstance(TEST_CONFIG);
      await newManager.initialize();

      const loadedKeys = await newManager.getKeyPair();

      expect(loadedKeys.publicKey).toEqual(originalKeys.publicKey);
      expect(loadedKeys.privateKey).toEqual(originalKeys.privateKey);
    });

    it('should load key metadata correctly', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      KeyManager.resetInstance();
      const newManager = KeyManager.getInstance(TEST_CONFIG);
      await newManager.initialize();

      const keys = await newManager.getKeyPair();
      expect(keys.version).toBeTruthy();
      expect(keys.createdAt).toBeInstanceOf(Date);
      expect(keys.expiresAt).toBeInstanceOf(Date);
    });

    it('should set correct file permissions on private key', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      const privateKeyPath = path.join(TEST_CERT_PATH, 'priv-key.pem');
      const stats = await fs.stat(privateKeyPath);

      // Check that file is only readable/writable by owner (600)
      expect(stats.mode & 0o777).toBe(0o600);
    });
  });

  describe('Key Validation', () => {
    it('should validate generated keys successfully', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      const status = await manager.getStatus();
      expect(status.keysValid).toBe(true);
      expect(status.keysExpired).toBe(false);
    });

    it('should detect invalid key formats', async () => {
      const invalidMetadata = {
        name: 'Josh',
        age: 30,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      // Create invalid key files
      await fs.mkdir(TEST_CERT_PATH, { recursive: true });
      await fs.writeFile(path.join(TEST_CERT_PATH, 'pub-key.pem'), 'invalid-public-key');
      await fs.writeFile(path.join(TEST_CERT_PATH, 'priv-key.pem'), 'invalid-private-key');
      await fs.writeFile(
        path.join(TEST_CERT_PATH, 'key-metadata.json'),
        JSON.stringify(invalidMetadata)
      );

      const manager = KeyManager.getInstance({ ...TEST_CONFIG, autoGenerate: false });

      await expect(manager.initialize()).rejects.toThrow('Key validation failed');
    });

    it.only('should detect invalid date formats in key-metadata.json', async () => {
      const invalidMetadata = {
        name: 'Josh',
        age: 30,
      };

      // Create invalid key files
      await fs.mkdir(TEST_CERT_PATH, { recursive: true });
      await fs.writeFile(path.join(TEST_CERT_PATH, 'pub-key.pem'), 'invalid-public-key');
      await fs.writeFile(path.join(TEST_CERT_PATH, 'priv-key.pem'), 'invalid-private-key');
      await fs.writeFile(
        path.join(TEST_CERT_PATH, 'key-metadata.json'),
        JSON.stringify(invalidMetadata)
      );

      const manager = KeyManager.getInstance({ ...TEST_CONFIG, autoGenerate: false });

      await expect(manager.initialize()).rejects.toThrow('Key validation failed');
    });

    it('should detect missing files (e.g., metadata)', async () => {
      // Create invalid key files
      await fs.mkdir(TEST_CERT_PATH, { recursive: true });
      await fs.writeFile(path.join(TEST_CERT_PATH, 'pub-key.pem'), 'invalid-public-key');
      await fs.writeFile(path.join(TEST_CERT_PATH, 'priv-key.pem'), 'invalid-private-key');

      const manager = KeyManager.getInstance({ ...TEST_CONFIG, autoGenerate: false });

      await expect(manager.initialize()).rejects.toThrow('Key validation failed');
    });

    it('should detect expired keys', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // Manually expire the keys
      const keys = await manager.getKeyPair();
      keys.expiresAt = new Date('2020-01-01'); // Past date

      expect(manager.needsRotation()).toBe(true);
    });

    it('should provide detailed validation results', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      const health = await manager.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });
  });

  describe('Version Tracking and Rotation History', () => {
    it('should track version numbers correctly', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // First key should be version 1
      const firstKeys = await manager.getKeyPair();
      expect(firstKeys.version).toBe(1);

      // Force rotation
      firstKeys.expiresAt = new Date('2020-01-01');
      await manager.rotateKeys();

      // Second key should be version 2
      const secondKeys = await manager.getKeyPair();
      expect(secondKeys.version).toBe(2);

      // Another rotation
      secondKeys.expiresAt = new Date('2020-01-01');
      await manager.rotateKeys();

      // Third key should be version 3
      const thirdKeys = await manager.getKeyPair();
      expect(thirdKeys.version).toBe(3);
    });

    it('should maintain rotation history', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // Get initial history
      const initialHistory = await manager.getRotationHistory();
      expect(initialHistory.totalRotations).toBe(1); // Initial generation
      expect(initialHistory.rotations).toHaveLength(1);
      expect(initialHistory.rotations[0].version).toBe(1);
      expect(initialHistory.rotations[0].reason).toBe('initial_generation');

      // Perform rotation
      const keys = await manager.getKeyPair();
      keys.expiresAt = new Date('2020-01-01');
      await manager.rotateKeys();

      // Check updated history
      const updatedHistory = await manager.getRotationHistory();
      expect(updatedHistory.totalRotations).toBe(2);
      expect(updatedHistory.rotations).toHaveLength(2);
      expect(updatedHistory.rotations[1].version).toBe(2);
      expect(updatedHistory.rotations[1].reason).toBe('scheduled_rotation');
    });

    it('should provide rotation statistics', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // Perform a few rotations
      for (let i = 0; i < 3; i++) {
        const keys = await manager.getKeyPair();
        keys.expiresAt = new Date('2020-01-01');
        await manager.rotateKeys();
      }

      const stats = await manager.getRotationStats();
      expect(stats.totalRotations).toBe(4); // Initial + 3 rotations
      expect(stats.oldestRotation?.version).toBe(1);
      expect(stats.newestRotation?.version).toBe(4);
      expect(stats.rotationsThisYear).toBeGreaterThan(0);
      expect(stats.rotationsThisMonth).toBeGreaterThan(0);
    });

    it('should handle history file corruption gracefully', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // Corrupt the history file
      const historyPath = path.join(TEST_CERT_PATH, 'rotation-history.json');
      await fs.writeFile(historyPath, 'invalid-json', 'utf8');

      // Should still work and recreate history
      const history = await manager.getRotationHistory();
      expect(history.totalRotations).toBe(0);
      expect(history.rotations).toHaveLength(0);
    });

    it('should persist version numbers across restarts', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();

      // Perform rotation to get version 2
      const keys = await manager.getKeyPair();
      keys.expiresAt = new Date('2020-01-01');
      await manager.rotateKeys();

      const version2Keys = await manager.getKeyPair();
      expect(version2Keys.version).toBe(2);

      // Restart the manager
      KeyManager.resetInstance();
      const newManager = KeyManager.getInstance(TEST_CONFIG);
      await newManager.initialize();

      // Should load version 2 keys
      const loadedKeys = await newManager.getKeyPair();
      expect(loadedKeys.version).toBe(2);

      // Next rotation should be version 3
      loadedKeys.expiresAt = new Date('2020-01-01');
      await newManager.rotateKeys();

      const version3Keys = await newManager.getKeyPair();
      expect(version3Keys.version).toBe(3);
    });
  });
  it('should rotate keys when expired', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const originalKeys = await manager.getKeyPair();
    originalKeys.expiresAt = new Date('2020-01-01'); // Force expiry

    await manager.rotateKeys();

    const newKeys = await manager.getKeyPair();
    expect(newKeys.publicKey).not.toBe(originalKeys.publicKey);
    expect(newKeys.version).toBeGreaterThan(originalKeys.version || 0);
  });

  it('should handle concurrent rotation requests', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const originalKeys = await manager.getKeyPair();
    originalKeys.expiresAt = new Date('2020-01-01'); // Force expiry

    // Start multiple rotations concurrently
    const rotations = [manager.rotateKeys(), manager.rotateKeys(), manager.rotateKeys()];

    await Promise.all(rotations);

    const newKeys = await manager.getKeyPair();
    expect(newKeys.version).toBe((originalKeys.version || 0) + 1);
  });

  it('should backup old keys during rotation', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const originalKeys = await manager.getKeyPair();
    originalKeys.expiresAt = new Date('2020-01-01'); // Force expiry

    await manager.rotateKeys();

    // Check backup directory exists and has files
    const backupDir = path.join(TEST_CERT_PATH, 'backup');
    const files = await fs.readdir(backupDir);

    expect(files.some(f => f.includes('expired'))).toBe(true);
  });

  it('should provide decryption keys during grace period', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const originalKeys = await manager.getKeyPair();
    originalKeys.expiresAt = new Date('2020-01-01'); // Force expiry

    await manager.rotateKeys();

    const decryptionKeys = await manager.getDecryptionKeys();
    expect(decryptionKeys).toHaveLength(2); // Current + previous
  });

  it('should clean up old backups', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    // Create old backup files
    const backupDir = path.join(TEST_CERT_PATH, 'backup');
    await fs.mkdir(backupDir, { recursive: true });

    const oldDate = '2020-01'; // 5+ years ago
    await fs.writeFile(path.join(backupDir, `pub-key-expired-${oldDate}.pem`), 'old-key');

    await manager.cleanupOldBackups();

    const files = await fs.readdir(backupDir);
    expect(files.some(f => f.includes(oldDate))).toBe(false);
  });
});

describe('Memory Caching', () => {
  it('should cache keys in memory after loading', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    // First access - loads from file or generates
    const start1 = Date.now();
    const keys1 = await manager.getKeyPair();
    const time1 = Date.now() - start1;

    // Second access - should be from cache (much faster)
    const start2 = Date.now();
    const keys2 = await manager.getKeyPair();
    const time2 = Date.now() - start2;

    expect(keys1).toBe(keys2); // Same object reference (cached)
    expect(time2).toBeLessThan(time1); // Faster access
  });

  it('should ensure valid keys before returning', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    // Get keys multiple times
    for (let i = 0; i < 5; i++) {
      const keys = await manager.ensureValidKeys();
      expect(keys.publicKey).toBeTruthy();
      expect(keys.privateKey).toBeTruthy();
    }
  });

  it('should handle memory pressure gracefully', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    // Simulate many concurrent requests
    const requests = Array.from({ length: 100 }, () => manager.getPublicKey());
    const results = await Promise.all(requests);

    // All should return the same key
    const uniqueKeys = new Set(results);
    expect(uniqueKeys.size).toBe(1);
  });
});

describe('Key Rotation', () => {
  it('should use default configuration values', () => {
    const manager = KeyManager.getInstance();
    const config = manager.getConfig();

    expect(config.keySize).toBe(2048);
    expect(config.keyExpiryMonths).toBe(1);
    expect(config.autoGenerate).toBe(true);
    expect(config.enableFileBackup).toBe(true);
  });

  it('should allow configuration updates', () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);

    manager.updateConfig({ keySize: 4096 });
    const config = manager.getConfig();

    expect(config.keySize).toBe(4096);
  });

  it('should validate configuration values', async () => {
    const invalidConfig = { ...TEST_CONFIG, keySize: 1024 }; // Too small
    const manager = KeyManager.getInstance(invalidConfig);

    // Should use the config but fail validation later
    await expect(manager.initialize()).rejects.toThrow();
  });
});

describe('Configuration Management', () => {
  it('should handle filesystem permission errors', async () => {
    // Create a directory with no write permissions
    await fs.mkdir(TEST_CERT_PATH, { recursive: true });
    await fs.chmod(TEST_CERT_PATH, 0o444); // Read-only

    const manager = KeyManager.getInstance(TEST_CONFIG);

    await expect(manager.initialize()).rejects.toThrow();

    // Restore permissions for cleanup
    await fs.chmod(TEST_CERT_PATH, 0o755);
  });

  it('should handle corrupted key files', async () => {
    // Create corrupted files
    await fs.mkdir(TEST_CERT_PATH, { recursive: true });
    await fs.writeFile(path.join(TEST_CERT_PATH, 'pub-key.pem'), 'corrupted-data');
    await fs.writeFile(path.join(TEST_CERT_PATH, 'priv-key.pem'), 'corrupted-data');

    const manager = KeyManager.getInstance({ ...TEST_CONFIG, autoGenerate: false });

    await expect(manager.initialize()).rejects.toThrow();
  });

  it('should recover from rotation failures', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    // Mock a rotation failure
    const utilsModule = await import('../../../src/core/utils');
    vi.spyOn(utilsModule, 'generateRSAKeyPair').mockImplementation(() => {
      throw new Error('Key generation failed');
    });

    await expect(manager.rotateKeys()).rejects.toThrow('Key rotation failed');

    // Restore original function
    vi.restoreAllMocks();

    // Manager should still have original keys
    const keys = await manager.getKeyPair();
    expect(keys).toBeTruthy();
  });

  it('should handle network/filesystem interruptions', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    // Simulate filesystem being unavailable during rotation
    const originalWriteFile = fs.writeFile;
    vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Disk full'));

    await expect(manager.rotateKeys()).rejects.toThrow();

    vi.restoreAllMocks();
  });
});

describe('Status and Monitoring', () => {
  it('should provide comprehensive status information', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const status = await manager.getStatus();

    expect(status.hasKeys).toBe(true);
    expect(status.keysValid).toBe(true);
    expect(status.keysExpired).toBe(false);
    expect(status.isRotating).toBe(false);
    expect(status.currentKeyVersion).toBeTruthy();
    expect(status.createdAt).toBeInstanceOf(Date);
    expect(status.expiresAt).toBeInstanceOf(Date);
    expect(status.certPath).toBe(TEST_CERT_PATH);
  });

  it('should detect unhealthy states', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);

    // Check health before initialization
    const healthBefore = await manager.healthCheck();
    expect(healthBefore.healthy).toBe(false);
    expect(healthBefore.issues).toContain('KeyManager not initialized');

    await manager.initialize();

    // Check health after initialization
    const healthAfter = await manager.healthCheck();
    expect(healthAfter.healthy).toBe(true);
    expect(healthAfter.issues).toHaveLength(0);
  });

  it('should track rotation state during rotation', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const originalKeys = await manager.getKeyPair();
    originalKeys.expiresAt = new Date('2020-01-01'); // Force expiry

    // Start rotation but don't await
    const rotationPromise = manager.rotateKeys();

    // Check status during rotation
    const statusDuringRotation = await manager.getStatus();
    expect(statusDuringRotation.isRotating).toBe(true);

    await rotationPromise;

    // Check status after rotation
    const statusAfterRotation = await manager.getStatus();
    expect(statusAfterRotation.isRotating).toBe(false);
  });
});

describe('Performance Tests', () => {
  it('should handle rapid key access requests', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const start = Date.now();

    // Make 100 concurrent requests
    const requests = Array.from({ length: 100 }, () => manager.getPublicKey());
    const results = await Promise.all(requests);

    const end = Date.now();

    // All should return the same key
    expect(new Set(results).size).toBe(1);

    // Should complete in reasonable time (< 1 second)
    expect(end - start).toBeLessThan(1000);
  });

  it('should handle multiple rotation attempts efficiently', async () => {
    const manager = KeyManager.getInstance(TEST_CONFIG);
    await manager.initialize();

    const originalKeys = await manager.getKeyPair();
    originalKeys.expiresAt = new Date('2020-01-01'); // Force expiry

    const start = Date.now();

    // Start multiple rotations
    const rotations = Array.from({ length: 10 }, () => manager.rotateKeys());
    await Promise.all(rotations);

    const end = Date.now();

    // Should complete efficiently and result in only one rotation
    const newKeys = await manager.getKeyPair();
    expect(newKeys.version).toBe((originalKeys.version || 0) + 1);

    // Log performance for monitoring
    console.log(`10 concurrent rotations completed in ${end - start}ms`);
  });
});

describe('Convenience Functions', () => {
  beforeEach(async () => {
    KeyManager.resetInstance();
    await cleanTestDirectory();
  });

  afterEach(async () => {
    await cleanTestDirectory();
    KeyManager.resetInstance();
  });

  it('should provide easy access functions', async () => {
    await initializeKeyManagement(TEST_CONFIG);

    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    const health = await healthCheck();

    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(privateKey).toContain('BEGIN RSA PRIVATE KEY');
    expect(health.healthy).toBe(true);
  });

  it('should work with global instance', async () => {
    const manager1 = await initializeKeyManagement(TEST_CONFIG);
    const manager2 = getKeyManager();

    expect(manager1).toBe(manager2);
  });
});

// Test utilities
async function cleanTestDirectory(): Promise<void> {
  try {
    await fs.rm(TEST_CERT_PATH, { recursive: true, force: true });
  } catch {
    // Ignore errors - directory might not exist
  }
}

// Export test utilities for integration tests
export { TEST_CERT_PATH, TEST_CONFIG, cleanTestDirectory };
