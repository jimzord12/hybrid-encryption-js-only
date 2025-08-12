// Key Management & Memory Caching System
// Dependencies: npm install node-forge @noble/ciphers fs-extra path
// File: src/core/key-management.ts

import fs from 'fs/promises';
import path from 'path';
import { KeyProviderFactory } from '../providers';
import {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  KeyValidationResult,
} from '../types/crypto-provider.types';
import { RSAKeyPair } from '../types/encryption.types';
import {
  KeyManagerConfig,
  KeyManagerStatus,
  KeyRotationState,
  RotationHistory,
  RotationHistoryEntry,
  RotationStats,
} from '../types/key-rotation.types';

// ============================================================================
// KEY MANAGER SINGLETON CLASS
// ============================================================================

export class KeyManager {
  public static instance: KeyManager | null = null;
  public config: Required<KeyManagerConfig>;
  public currentKeys: CryptoKeyPair | null = null;
  public rotationState: KeyRotationState;
  public lastValidation: Date | null = null;
  public isInitialized = false;
  public cleanupTimer: NodeJS.Timeout | null = null;
  private keyProvider: KeyProvider;

  private constructor(config: KeyManagerConfig = {}) {
    // Set default configuration with new algorithm support
    this.config = {
      algorithm: config.algorithm || 'rsa',
      certPath: config.certPath || path.join(process.cwd(), 'config', 'certs'),
      keySize: config.keySize || 2048,
      curve: config.curve,
      keyExpiryMonths: config.keyExpiryMonths || 1,
      autoGenerate: config.autoGenerate ?? true,
      enableFileBackup: config.enableFileBackup ?? true,
      rotationGracePeriod: config.rotationGracePeriod || 5,
    };

    // Initialize the key provider based on algorithm
    this.keyProvider = KeyProviderFactory.createProvider(this.config.algorithm);

    // Note: Configuration validation is deferred to initialize() to match test expectations

    this.rotationState = {
      isRotating: false,
      rotationPromise: null,
      rotationStartTime: null,
      previousKeys: null,
      newKeys: null,
    };
  }

  /**
   * Get the singleton instance of KeyManager
   */
  public static getInstance(config?: KeyManagerConfig): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager(config);
    }
    console.log('KeyManager instance created: ASA:', KeyManager.instance.isInitialized);
    return KeyManager.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    if (KeyManager.instance) {
      // Clean up any running timers
      KeyManager.instance.cleanup();
    }
    KeyManager.instance = null;
  }

  /**
   * Clean up all timers and state (for testing)
   */
  private cleanup(): void {
    // Clear any pending cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Reset all internal state
    this.currentKeys = null;
    this.lastValidation = null;
    this.isInitialized = false;
    this.config = {} as Required<KeyManagerConfig>;

    // Reset rotation state
    this.rotationState = {
      isRotating: false,
      rotationPromise: null,
      rotationStartTime: null,
      previousKeys: null,
      newKeys: null,
    };
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  /**
   * Initialize the key manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Validate configuration first
      this.validateConfig();

      // Ensure cert directory exists
      await this.ensureCertDirectory();

      // Load existing keys or generate new ones
      await this.loadOrGenerateKeys();

      // Validate current keys
      const validation = await this.validateCurrentKeys();
      if (!validation.isValid) {
        throw new Error(`Key validation failed: ${validation.errors.join(', ')}`);
      }

      this.isInitialized = true;
      console.log('✅ KeyManager initialized successfully');
    } catch (error) {
      throw new Error(
        `KeyManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if rotation is needed and wait for completion if in progress
   */
  public async ensureValidKeys(): Promise<CryptoKeyPair> {
    console.log('[ensureValidKeys]: Is rotation in progress?', this.rotationState.isRotating);
    // If rotation is in progress, wait for it to complete
    if (this.rotationState.isRotating && this.rotationState.rotationPromise) {
      await this.rotationState.rotationPromise;
    }

    console.log('[ensureValidKeys]: Needs Rotation:', this.needsRotation());

    // Check if we need rotation
    if (this.needsRotation()) {
      await this.rotateKeys();
    }

    if (!this.currentKeys) {
      throw new Error('No valid keys available after rotation attempt');
    }

    return this.currentKeys;
  }

  // ============================================================================
  // KEY ACCESS & RETRIEVAL
  // ============================================================================

  /**
   * Get current public key (safe for client access)
   */
  public async getPublicKey(): Promise<string> {
    const keys = await this.ensureValidKeys();
    return keys.publicKey;
  }

  /**
   * Get current private key (server-side only)
   */
  public async getPrivateKey(): Promise<string> {
    const keys = await this.ensureValidKeys();
    return keys.privateKey;
  }

  /**
   * Get current key pair (server-side only)
   */
  public async getKeyPair(): Promise<CryptoKeyPair> {
    return await this.ensureValidKeys();
  }

  /**
   * Get keys for decryption (includes previous keys during rotation)
   * This is meant to be used by the Encryption Core Module
   */
  public async getDecryptionKeys(): Promise<CryptoKeyPair[]> {
    const keys = [await this.ensureValidKeys()];

    // During rotation, also include previous keys for decrypting in-flight requests
    if (this.rotationState.previousKeys && this.isInGracePeriod()) {
      keys.push(this.rotationState.previousKeys);
    }

    return keys;
  }

  // ============================================================================
  // KEY ROTATION & LIFECYCLE
  // ============================================================================

  /**
   * Check if keys need rotation
   */
  public needsRotation(): boolean {
    if (!this.currentKeys) return true;
    return this.keyProvider.isKeyPairExpired(this.currentKeys);
  }

  /**
   * Manually trigger key rotation
   */
  public async rotateKeys(): Promise<void> {
    console.log('[rotateKeys]: isRotating: ', this.rotationState.isRotating);
    // If already rotating, wait for completion
    if (this.rotationState.isRotating && this.rotationState.rotationPromise) {
      return this.rotationState.rotationPromise;
    }

    // Start rotation
    this.rotationState.rotationPromise = this.performKeyRotation();
    return this.rotationState.rotationPromise;
  }

  /**
   * Internal key rotation implementation
   */
  private async performKeyRotation(): Promise<void> {
    console.log('🔄 Starting key rotation...');

    this.rotationState.isRotating = true;
    this.rotationState.rotationStartTime = new Date();
    this.rotationState.previousKeys = this.currentKeys;

    try {
      // Generate new keys using the key provider
      console.log(`🔑 Generating new ${this.config.algorithm.toUpperCase()} key pair...`);
      const keyGenConfig: KeyGenerationConfig = {
        algorithm: this.config.algorithm,
        keySize: this.config.keySize,
        expiryMonths: this.config.keyExpiryMonths,
      };

      // Only add curve if it's defined (for ECC algorithms)
      if (this.config.curve !== undefined) {
        keyGenConfig.curve = this.config.curve;
      }

      const newKeys = this.keyProvider.generateKeyPair(keyGenConfig);

      // Validate new keys using the key provider
      if (!this.keyProvider.validateKeyPair(newKeys)) {
        throw new Error('Generated invalid key pair');
      }

      // Get next version number
      const nextVersion = await this.getNextVersionNumber();
      newKeys.version = nextVersion;

      this.rotationState.newKeys = newKeys;

      // Backup old keys if they exist
      if (this.currentKeys && this.config.enableFileBackup) {
        await this.backupExpiredKeys(this.currentKeys);
      }

      // Save new keys to filesystem and update rotation history
      if (this.config.enableFileBackup) {
        await this.saveKeysToFile(newKeys);
        await this.updateRotationHistory(newKeys);
      }

      // Update current keys (atomic operation)
      this.currentKeys = newKeys;
      this.lastValidation = new Date();

      console.log(`✅ Key rotation completed successfully (version ${nextVersion})`);

      // Clean up rotation state after grace period
      this.cleanupTimer = setTimeout(
        () => {
          this.cleanupRotationState();
        },
        this.config.rotationGracePeriod * 60 * 1000
      );
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      this.rotationState.isRotating = false;
      this.rotationState.rotationPromise = null;
      this.rotationState.newKeys = null;
      throw new Error(
        `Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if we're in the grace period after rotation
   */
  private isInGracePeriod(): boolean {
    if (!this.rotationState.rotationStartTime) return false;

    const gracePeriodMs = this.config.rotationGracePeriod * 60 * 1000;
    const elapsed = Date.now() - this.rotationState.rotationStartTime.getTime();

    return elapsed < gracePeriodMs;
  }

  /**
   * Clean up rotation state after grace period
   */
  private cleanupRotationState(): void {
    this.rotationState.isRotating = false;
    this.rotationState.rotationPromise = null;
    this.rotationState.rotationStartTime = null;
    this.rotationState.previousKeys = null;
    this.rotationState.newKeys = null;
    this.cleanupTimer = null; // Clear timer reference
    console.log('🧹 Rotation state cleaned up');
  }

  // ============================================================================
  // FILE SYSTEM OPERATIONS
  // ============================================================================

  /**
   * Get the next version number for key rotation
   */
  private async getNextVersionNumber(): Promise<number> {
    const history = await this.getRotationHistory();

    if (history.rotations.length === 0) {
      return 1; // First key pair
    }

    // Find the highest version number and increment
    const maxVersion = Math.max(...history.rotations.map(r => r.version));
    return maxVersion + 1;
  }

  /**
   * Update rotation history with new key information
   */
  private async updateRotationHistory(keyPair: CryptoKeyPair): Promise<void> {
    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const history = await this.getRotationHistory();

      const rotationEntry = {
        version: keyPair.version!,
        createdAt: keyPair.createdAt!.toISOString(),
        expiresAt: keyPair.expiresAt!.toISOString(),
        keySize: keyPair.keySize || this.config.keySize,
        rotatedAt: new Date().toISOString(),
        reason: (history.rotations.length > 0
          ? 'scheduled_rotation'
          : 'initial_generation') as RotationHistoryEntry['reason'],
      };

      history.rotations.push(rotationEntry);
      history.totalRotations = history.rotations.length;
      history.lastUpdated = new Date().toISOString();

      await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');
      console.log(`📚 Updated rotation history (${history.totalRotations} total rotations)`);
    } catch (error) {
      console.warn('⚠️ Failed to update rotation history:', error);
      // Don't throw - history failure shouldn't stop key operations
    }
  }

  /**
   * Get rotation history
   */
  public async getRotationHistory(): Promise<RotationHistory> {
    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const historyContent = await fs.readFile(historyPath, 'utf8');
      return JSON.parse(historyContent);
    } catch {
      // Return default history if file doesn't exist
      return {
        totalRotations: 0,
        rotations: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get rotation statistics
   */
  public async getRotationStats(): Promise<RotationStats> {
    const history = await this.getRotationHistory();

    if (history.rotations.length === 0) {
      return {
        totalRotations: 0,
        averageKeyLifetime: 0,
        oldestRotation: null,
        newestRotation: null,
        rotationsThisYear: 0,
        rotationsThisMonth: 0,
      };
    }

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const rotationsThisYear = history.rotations.filter(
      r => new Date(r.createdAt).getFullYear() === thisYear
    ).length;

    const rotationsThisMonth = history.rotations.filter(r => {
      const date = new Date(r.createdAt);
      return date.getFullYear() === thisYear && date.getMonth() === thisMonth;
    }).length;

    // Calculate average lifetime
    let totalLifetime = 0;
    for (let i = 1; i < history.rotations.length; i++) {
      const prev = new Date(history.rotations[i - 1].createdAt);
      const curr = new Date(history.rotations[i].createdAt);
      totalLifetime += curr.getTime() - prev.getTime();
    }
    const averageKeyLifetime =
      history.rotations.length > 1
        ? Math.round(totalLifetime / (history.rotations.length - 1) / (1000 * 60 * 60 * 24)) // days
        : 0;

    return {
      totalRotations: history.totalRotations,
      averageKeyLifetime,
      oldestRotation: history.rotations[0],
      newestRotation: history.rotations[history.rotations.length - 1],
      rotationsThisYear,
      rotationsThisMonth,
    };
  }

  /**
   * Ensure certificate directory exists
   */
  private async ensureCertDirectory(): Promise<void> {
    try {
      console.log('Ensuring certificate directory exists...');
      await fs.mkdir(this.config.certPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create cert directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load keys from filesystem or generate new ones
   */
  private async loadOrGenerateKeys(): Promise<void> {
    try {
      // Try to load existing keys
      const loadedKeys = await this.loadKeysFromFile();

      if (loadedKeys) {
        // Convert RSAKeyPair to CryptoKeyPair format
        const convertedKeys: CryptoKeyPair = {
          publicKey: loadedKeys.publicKey,
          privateKey: loadedKeys.privateKey,
          algorithm: this.config.algorithm,
        };

        // Only set optional properties if they exist
        if (loadedKeys.version !== undefined) {
          convertedKeys.version = loadedKeys.version;
        } else {
          convertedKeys.version = 1;
        }

        if (loadedKeys.createdAt !== undefined) {
          convertedKeys.createdAt = loadedKeys.createdAt;
        }

        if (loadedKeys.expiresAt !== undefined) {
          convertedKeys.expiresAt = loadedKeys.expiresAt;
        }

        if (this.config.keySize !== undefined) {
          convertedKeys.keySize = this.config.keySize;
        }

        // Only add curve if it's defined and algorithm supports it
        if (this.config.curve !== undefined) {
          convertedKeys.curve = this.config.curve;
        }

        this.currentKeys = convertedKeys;

        console.log('📂 Loaded existing keys from filesystem');
        console.log(`🔢 Current key version: ${this.currentKeys.version}`);
        return;
      }
    } catch (error) {
      console.log('📂 No existing keys found, will generate new ones');
    }

    // Generate new keys if none found or auto-generate is enabled
    if (this.config.autoGenerate) {
      console.log(`🔑 Generating new ${this.config.algorithm.toUpperCase()} key pair...`);

      console.log(
        'Checking Directory Write Permissions:',
        await fs.access(this.config.certPath, fs.constants.W_OK) // undefined
      );

      // Get next version number
      const nextVersion = await this.getNextVersionNumber();

      // Generate keys using the key provider
      const keyGenConfig: KeyGenerationConfig = {
        algorithm: this.config.algorithm,
        keySize: this.config.keySize,
        expiryMonths: this.config.keyExpiryMonths,
      };

      // Only add curve if it's defined (for ECC algorithms)
      if (this.config.curve !== undefined) {
        keyGenConfig.curve = this.config.curve;
      }

      this.currentKeys = this.keyProvider.generateKeyPair(keyGenConfig);
      this.currentKeys.version = nextVersion;

      // Save to filesystem and update rotation history
      if (this.config.enableFileBackup) {
        await this.saveKeysToFile(this.currentKeys);
        await this.updateRotationHistory(this.currentKeys);
      }

      console.log(`✅ Generated and saved new key pair (version ${nextVersion})`);
    } else {
      throw new Error('No keys found and auto-generation is disabled');
    }
  }

  /**
   * Load keys from PEM files
   */
  private async loadKeysFromFile(): Promise<RSAKeyPair | null> {
    const publicKeyPath = path.join(this.config.certPath, 'pub-key.pem');
    const privateKeyPath = path.join(this.config.certPath, 'priv-key.pem');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    try {
      console.log('🚛 Start Loading key files...');
      console.log('');
      const [publicKey, privateKey, metadataStr] = await Promise.all([
        fs.readFile(publicKeyPath, 'utf8'),
        fs.readFile(privateKeyPath, 'utf8'),
        fs.readFile(metadataPath, 'utf8').catch(() => '{}'),
      ]);

      console.log('1. Loaded key files:', {
        publicKey: publicKey ? '✔️' : '❌',
        privateKey: privateKey ? '✔️' : '❌',
        metadata: metadataStr ? '✔️' : '❌',
      });

      let metadata: Partial<RSAKeyPair> = {};
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        // Ignore metadata parsing errors
        console.log('⚠️ Failed to parse key metadata, using defaults');
      }

      if (!publicKey || !privateKey) {
        console.log('⚠️ Missing key material, generating new keys');
        return null;
      }

      if (!metadata.createdAt || !metadata.expiresAt) {
        console.log('⚠️ Missing metadata properties, generating new keys');
        return null;
      }

      const keyPair: RSAKeyPair = {
        publicKey: publicKey.trim(),
        privateKey: privateKey.trim(),
        version: metadata.version || 1,
        createdAt: new Date(metadata.createdAt),
        expiresAt: new Date(metadata.expiresAt),
      };

      console.log('3. Loaded key pair (version):', keyPair.version);
      return keyPair;
    } catch (error) {
      console.log('⚠️ Failed to load keys from filesystem');
      return null;
    }
  }

  /**
   * Save keys to PEM files
   */
  private async saveKeysToFile(keyPair: CryptoKeyPair): Promise<void> {
    const publicKeyPath = path.join(this.config.certPath, 'pub-key.pem');
    const privateKeyPath = path.join(this.config.certPath, 'priv-key.pem');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    // Use the key provider to serialize the key pair
    const serialized = this.keyProvider.serializeKeyPair(keyPair);

    const metadata = {
      ...serialized.metadata,
      keySize: keyPair.keySize || this.config.keySize,
      lastRotation: new Date().toISOString(),
    };

    try {
      await Promise.all([
        fs.writeFile(publicKeyPath, serialized.publicKey, 'utf8'),
        fs.writeFile(privateKeyPath, serialized.privateKey, 'utf8'),
        fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8'),
      ]);

      if (process.platform === 'win32') {
        // Windows: Set file as read-only and try to set NTFS permissions
        try {
          await fs.chmod(privateKeyPath, 0o600);
        } catch (error) {
          console.warn('⚠️ Could not set Windows file permissions:', error);
        }
      } else {
        // Unix-like systems: Set proper octal permissions
        await fs.chmod(privateKeyPath, 0o600);
      }
    } catch (error) {
      console.log('❌ Failed to save keys to filesystem:', error);
      throw new Error(
        `Failed to save keys: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Backup expired keys
   */
  private async backupExpiredKeys(keyPair: CryptoKeyPair): Promise<void> {
    const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const backupDir = path.join(this.config.certPath, 'backup');

    try {
      await fs.mkdir(backupDir, { recursive: true });

      const backupPublicPath = path.join(backupDir, `pub-key-expired-${timestamp}.pem`);
      const backupPrivatePath = path.join(backupDir, `priv-key-expired-${timestamp}.pem`);

      await Promise.all([
        fs.writeFile(backupPublicPath, keyPair.publicKey, 'utf8'),
        fs.writeFile(backupPrivatePath, keyPair.privateKey, 'utf8'),
      ]);

      await fs.chmod(backupPrivatePath, 0o600);
      console.log(`📦 Backed up expired keys to ${backupDir}`);
    } catch (error) {
      console.warn('⚠️ Failed to backup expired keys:', error);
      // Don't throw - backup failure shouldn't stop rotation
    }
  }

  /**
   * Clean up old backup files (older than 3 months)
   */
  public async cleanupOldBackups(): Promise<void> {
    const backupDir = path.join(this.config.certPath, 'backup');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    try {
      const files = await fs.readdir(backupDir);
      const expiredFiles = files.filter(file => {
        const match = file.match(/expired-(\d{4}-\d{2})/);
        if (!match) return false;

        const fileDate = new Date(match[1] + '-01');
        return fileDate < threeMonthsAgo;
      });

      for (const file of expiredFiles) {
        await fs.unlink(path.join(backupDir, file));
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old backups:', error);
    }
  }

  // ============================================================================
  // VALIDATION & STATUS
  // ============================================================================

  /**
   * Validate configuration parameters
   */
  private validateConfig(): void {
    const errors: string[] = [];

    // Use key provider for algorithm-specific validation
    const keyGenConfig: KeyGenerationConfig = {
      algorithm: this.config.algorithm,
      keySize: this.config.keySize,
      expiryMonths: this.config.keyExpiryMonths,
    };

    // Only add curve if it's defined
    if (this.config.curve !== undefined) {
      keyGenConfig.curve = this.config.curve;
    }

    const providerErrors = this.keyProvider.validateConfig(keyGenConfig);
    errors.push(...providerErrors);

    // Validate key expiry months
    if (this.config.keyExpiryMonths <= 0) {
      errors.push(`Key expiry months must be positive (got ${this.config.keyExpiryMonths})`);
    }

    // Validate rotation grace period
    if (this.config.rotationGracePeriod < 0) {
      errors.push(
        `Rotation grace period cannot be negative (got ${this.config.rotationGracePeriod})`
      );
    }

    // Validate cert path
    if (!this.config.certPath || this.config.certPath.trim() === '') {
      errors.push('Certificate path cannot be empty');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate current keys
   */
  private async validateCurrentKeys(): Promise<KeyValidationResult> {
    console.log('🔍 Validating current keys...');

    const result: KeyValidationResult = {
      isValid: false,
      errors: [],
      publicKeyValid: false,
      privateKeyValid: false,
      keyPairMatches: false,
      notExpired: false,
    };

    if (!this.currentKeys) {
      result.errors.push('No keys available');
      return result;
    }

    try {
      // Basic format validation
      if (!this.currentKeys.publicKey.includes('BEGIN PUBLIC KEY')) {
        result.errors.push('Invalid public key format');
      } else {
        result.publicKeyValid = true;
      }

      // Get expected private key format from provider
      const expectedPrivateKeyFormat = this.keyProvider.getPrivateKeyFormat();
      if (!this.currentKeys.privateKey.includes(expectedPrivateKeyFormat)) {
        result.errors.push('Invalid private key format');
      } else {
        result.privateKeyValid = true;
      }

      // Key pair validation using the provider
      if (result.publicKeyValid && result.privateKeyValid) {
        if (this.keyProvider.validateKeyPair(this.currentKeys)) {
          result.keyPairMatches = true;
        } else {
          result.errors.push('Key pair mismatch - public and private keys do not match');
        }
      }

      // Expiry validation using the provider
      if (!this.keyProvider.isKeyPairExpired(this.currentKeys)) {
        result.notExpired = true;
      } else {
        result.errors.push('Keys have expired');
      }

      result.isValid =
        result.publicKeyValid &&
        result.privateKeyValid &&
        result.keyPairMatches &&
        result.notExpired;

      this.lastValidation = new Date();
      return result;
    } catch (error) {
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.log('❌ Key validation failed:', result.errors);
      return result;
    }
  }

  /**
   * Get current status
   */
  public async getStatus(): Promise<KeyManagerStatus> {
    const validation = await this.validateCurrentKeys();

    return {
      hasKeys: this.currentKeys !== null,
      keysValid: validation.isValid,
      keysExpired: this.currentKeys ? this.keyProvider.isKeyPairExpired(this.currentKeys) : false,
      isRotating: this.rotationState.isRotating,
      currentKeyVersion: this.currentKeys?.version || null,
      createdAt: this.currentKeys?.createdAt || null,
      expiresAt: this.currentKeys?.expiresAt || null,
      certPath: this.config.certPath,
      lastRotation: this.rotationState.rotationStartTime,
    };
  }

  /**
   * Health check for monitoring
   */
  public async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      if (!this.isInitialized) {
        issues.push('KeyManager not initialized');
      }

      if (!this.currentKeys) {
        issues.push('No keys available');
      }

      if (this.needsRotation()) {
        issues.push('Keys need rotation');
      }

      const validation = await this.validateCurrentKeys();
      if (!validation.isValid) {
        issues.push(...validation.errors);
      }

      return {
        healthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [
          `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Force key regeneration (for testing/emergency use)
   */
  public async forceRegenerate(): Promise<void> {
    console.log('🔄 Force regenerating keys...');
    this.currentKeys = null;
    await this.loadOrGenerateKeys();
    console.log('✅ Keys force regenerated');
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<KeyManagerConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration (some settings require restart)
   */
  public updateConfig(newConfig: Partial<KeyManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get the global KeyManager instance
 */
export function getKeyManager(config?: KeyManagerConfig): KeyManager {
  return KeyManager.getInstance(config);
}

/**
 * Initialize key management with default settings
 */
export async function initializeKeyManagement(config?: KeyManagerConfig): Promise<KeyManager> {
  const manager = getKeyManager(config);
  await manager.initialize();
  return manager;
}

/**
 * Quick access to public key
 */
export async function getPublicKey(): Promise<string> {
  const manager = getKeyManager();
  return manager.getPublicKey();
}

/**
 * Quick access to private key (server-side only)
 */
export async function getPrivateKey(): Promise<string> {
  const manager = getKeyManager();
  return manager.getPrivateKey();
}

/**
 * Quick health check
 */
export async function healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
  const manager = getKeyManager();
  return manager.healthCheck();
}

/**
 * Get rotation history
 */
export async function getRotationHistory(): Promise<RotationHistory> {
  const manager = getKeyManager();
  return manager.getRotationHistory();
}

/**
 * Get rotation statistics
 */
export async function getRotationStats(): Promise<RotationStats> {
  const manager = getKeyManager();
  return manager.getRotationStats();
}
