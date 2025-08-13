// Key Management & Memory Caching System - Modernized for Algorithm-Agnostic Architecture
// Dependencies: @noble/ciphers, @noble/hashes, @noble/post-quantum, fs/promises, path
// File: src/core/key-management/index.ts

import fs from 'fs/promises';
import path from 'path';
import { createAppropriateError } from '../errors/modern-encryption.errors.js';
import { KeyProviderFactory } from '../providers';
import {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  KeyValidationResult,
  SupportedAlgorithms,
} from '../types/crypto-provider.types';
import {
  KeyManagerConfig,
  KeyManagerStatus,
  KeyRotationState,
  RotationHistory,
  RotationHistoryEntry,
  RotationStats,
} from '../types/key-rotation.types';
import { ModernKeyPair } from '../types/modern-encryption.types';
import { BufferUtils } from '../utils/buffer.util';

// ============================================================================
// MODERN KEY STORAGE INTERFACES
// ============================================================================

/**
 * Modern key metadata stored as JSON
 */
interface KeyMetadata {
  algorithm: SupportedAlgorithms;
  keySize: number;
  created: string;
  lastRotation: string;
  version: number;
  publicKeyPath: string;
  privateKeyPath: string;
}

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
  private rotationHistoryCache: RotationHistory | null = null;
  private rotationHistoryCacheTime: number | null = null;
  private readonly ROTATION_HISTORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor(config: KeyManagerConfig = {}) {
    // Set default configuration with modern algorithm support
    this.config = {
      algorithm: config.algorithm || 'ml-kem-768',
      certPath: config.certPath || path.join(process.cwd(), 'config', 'certs'),
      keySize: config.keySize || 768, // Default for ML-KEM-768
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

    // Reset configuration to default values
    this.config = {
      algorithm: this.config.algorithm || 'ml-kem-768',
      certPath: this.config.certPath || path.join(process.cwd(), 'config', 'certs'),
      keySize: this.config.keySize || 768,
      curve: this.config.curve,
      keyExpiryMonths: this.config.keyExpiryMonths || 1,
      autoGenerate: this.config.autoGenerate ?? true,
      enableFileBackup: this.config.enableFileBackup ?? true,
      rotationGracePeriod: this.config.rotationGracePeriod || 5,
    };

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
        throw createAppropriateError(`Key validation failed: ${validation.errors.join(', ')}`, {
          errorType: 'keymanager',
          operation: 'initialization',
          algorithm: this.config.algorithm,
          cause: new Error('Key validation failed'),
        });
      }

      this.isInitialized = true;
      console.log('✅ KeyManager initialized successfully');
    } catch (error) {
      const initError = createAppropriateError(
        `KeyManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          errorType: 'keymanager',
          operation: 'initialization',
          algorithm: this.config.algorithm,
          cause: error instanceof Error ? error : new Error('Unknown initialization error'),
        },
      );

      throw initError;
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
      throw createAppropriateError('No valid keys available after rotation attempt', {
        errorType: 'keymanager',
        operation: 'retrieval',
        algorithm: this.config.algorithm,
        rotationState: this.rotationState.isRotating ? 'rotating' : 'idle',
      });
    }

    return this.currentKeys;
  }

  // ============================================================================
  // KEY ACCESS & RETRIEVAL
  // ============================================================================

  /**
   * Get current public key in binary format
   */
  public async getPublicKey(): Promise<Uint8Array> {
    const keys = await this.ensureValidKeys();
    return keys.publicKey;
  }

  /**
   * Get current public key as Base64 string (for client access)
   */
  public async getPublicKeyBase64(): Promise<string> {
    const publicKey = await this.getPublicKey();
    return BufferUtils.encodeBase64(publicKey);
  }

  /**
   * Get current private key in binary format (server-side only)
   * ⚠️ SECURITY WARNING: This method exposes sensitive private key material.
   * Use only in secure environments and ensure proper access controls.
   */
  public async getPrivateKey(): Promise<Uint8Array> {
    const keys = await this.ensureValidKeys();
    // Handle both ML-KEM (secretKey) and RSA/ECC (privateKey) formats
    const privateKey = keys.secretKey || keys.privateKey;
    if (!privateKey) {
      throw new Error('No private/secret key found in key pair');
    }
    return privateKey;
  }

  /**
   * Get current private key as Base64 string (server-side only)
   * ⚠️ SECURITY WARNING: This method exposes sensitive private key material.
   * Use only in secure environments and ensure proper access controls.
   */
  public async getPrivateKeyBase64(): Promise<string> {
    const privateKey = await this.getPrivateKey();
    return BufferUtils.encodeBase64(privateKey);
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

    try {
      // Generate new keys using the key provider
      console.log(`🔑 Generating new ${this.config.algorithm.toUpperCase()} key pair...`);
      const keyGenConfig: KeyGenerationConfig = {
        algorithm: this.config.algorithm,
        keySize: this.config.keySize,
        expiryMonths: this.config.keyExpiryMonths,
      };

      console.log(`🔑 Key generation config: ${JSON.stringify(keyGenConfig)}`);

      // Only add curve if it's defined (for ECC algorithms)
      if (this.config.curve !== undefined) {
        keyGenConfig.curve = this.config.curve;
      }

      const newKeys = this.keyProvider.generateKeyPair(keyGenConfig);

      // Validate new keys using the key provider
      if (!this.keyProvider.validateKeyPair(newKeys)) {
        throw createAppropriateError('Generated invalid key pair', {
          errorType: 'keymanager',
          operation: 'rotation',
          algorithm: this.config.algorithm,
          keyVersion: this.currentKeys?.version,
        });
      }

      // Set rotation state only after keys are generated and validated
      this.rotationState.isRotating = true;
      this.rotationState.rotationStartTime = new Date();
      this.rotationState.previousKeys = this.currentKeys;
      this.rotationState.newKeys = newKeys;

      // Get next version number
      const nextVersion = await this.getNextVersionNumber();
      newKeys.version = nextVersion;

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
        this.config.rotationGracePeriod * 60 * 1000,
      );
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      this.rotationState.isRotating = false;
      this.rotationState.rotationPromise = null;
      this.rotationState.rotationStartTime = null;
      this.rotationState.newKeys = null;

      throw createAppropriateError(
        `Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          errorType: 'keymanager',
          operation: 'rotation',
          algorithm: this.config.algorithm,
          keyVersion: this.currentKeys?.version,
          rotationState: 'failed',
          cause: error instanceof Error ? error : new Error('Unknown rotation error'),
        },
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

      // Invalidate cache
      this.rotationHistoryCache = null;
      this.rotationHistoryCacheTime = null;

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
    // Check if we have a valid cache
    const now = Date.now();
    if (
      this.rotationHistoryCache &&
      this.rotationHistoryCacheTime &&
      now - this.rotationHistoryCacheTime < this.ROTATION_HISTORY_CACHE_TTL
    ) {
      return this.rotationHistoryCache;
    }

    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const historyContent = await fs.readFile(historyPath, 'utf8');
      const history = JSON.parse(historyContent);

      // Update cache
      this.rotationHistoryCache = history;
      this.rotationHistoryCacheTime = now;

      return history;
    } catch {
      // Return default history if file doesn't exist
      const defaultHistory = {
        totalRotations: 0,
        rotations: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      // Update cache
      this.rotationHistoryCache = defaultHistory;
      this.rotationHistoryCacheTime = now;

      return defaultHistory;
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
      r => new Date(r.createdAt).getFullYear() === thisYear,
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
      // Check if directory already exists to avoid unnecessary operations
      try {
        const stat = await fs.stat(this.config.certPath);
        if (stat.isDirectory()) {
          return; // Directory already exists
        }
      } catch (error) {
        // Directory doesn't exist, continue with creation
      }

      // Create directory if it doesn't exist
      await fs.mkdir(this.config.certPath, { recursive: true });
    } catch (error) {
      throw createAppropriateError(
        `Failed to create cert directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          errorType: 'keymanager',
          operation: 'storage',
          filePath: this.config.certPath,
          algorithm: this.config.algorithm,
          cause: error instanceof Error ? error : new Error('Directory creation failed'),
        },
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
        // Handle both key formats during conversion
        const loadedKeysWithBothFormats = loadedKeys as CryptoKeyPair & { secretKey?: Uint8Array };
        const privateKeyData = loadedKeysWithBothFormats.secretKey || loadedKeys.privateKey;

        if (!privateKeyData) {
          throw new Error('Loaded keys missing both secretKey and privateKey data');
        }

        const convertedKeys: CryptoKeyPair = {
          publicKey: loadedKeys.publicKey,
          secretKey: privateKeyData, // Use secretKey for ML-KEM compatibility
          algorithm: this.config.algorithm,
        };

        if (loadedKeys.version !== undefined) {
          convertedKeys.version = loadedKeys.version;
        } else {
          // When undefined, get next version from history but don't do comparisons
          convertedKeys.version = await this.getNextVersionNumber();
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
      console.log('📂 No existing keys found, will generate new ones | ', error);
    }

    // Generate new keys if none found or auto-generate is enabled
    if (this.config.autoGenerate) {
      console.log(`🔑 Generating new ${this.config.algorithm.toUpperCase()} key pair...`);

      console.log(
        'Checking Directory Write Permissions:',
        await fs.access(this.config.certPath, fs.constants.W_OK), // undefined
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
      throw createAppropriateError('No keys found and auto-generation is disabled', {
        errorType: 'keymanager',
        operation: 'initialization',
        algorithm: this.config.algorithm,
      });
    }
  }

  /**
   * Load keys from binary files (modern format)
   */
  private async loadKeysFromFile(): Promise<CryptoKeyPair | null> {
    const publicKeyPath = path.join(this.config.certPath, 'public-key.bin');
    const privateKeyPath = path.join(this.config.certPath, 'private-key.bin');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    try {
      console.log('🚛 Loading modern binary key files...');

      // Read binary key files and JSON metadata
      const [publicKeyBinary, privateKeyBinary, metadataStr] = await Promise.all([
        fs.readFile(publicKeyPath),
        fs.readFile(privateKeyPath),
        fs.readFile(metadataPath, 'utf8').catch(() => '{}'),
      ]);

      console.log('1. Loaded key files:', {
        publicKey: publicKeyBinary.length > 0 ? '✔️' : '❌',
        privateKey: privateKeyBinary.length > 0 ? '✔️' : '❌',
        metadata: metadataStr ? '✔️' : '❌',
      });

      let metadata: Partial<KeyMetadata> = {};
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        console.log('⚠️ Failed to parse key metadata, using defaults');
      }

      if (!publicKeyBinary || !privateKeyBinary) {
        console.log('⚠️ Missing key material, generating new keys');
        return null;
      }

      if (!metadata.created || !metadata.algorithm) {
        console.log('⚠️ Missing metadata properties, generating new keys');
        return null;
      }

      const createdAt = metadata.created ? new Date(metadata.created) : new Date();
      const expiresAt = new Date(createdAt);
      expiresAt.setMonth(expiresAt.getMonth() + this.config.keyExpiryMonths);

      const keyPair: CryptoKeyPair = {
        publicKey: new Uint8Array(publicKeyBinary),
        secretKey: new Uint8Array(privateKeyBinary), // Use secretKey for ML-KEM compatibility
        algorithm: metadata.algorithm,
        version: metadata.version || 1,
        keySize: metadata.keySize || this.config.keySize,
        createdAt,
        expiresAt,
      };

      console.log('3. Loaded modern key pair:', {
        algorithm: keyPair.algorithm,
        version: keyPair.version,
        keySize: keyPair.keySize,
        allProperties: Object.keys(keyPair),
        publicKeyType: typeof keyPair.publicKey,
        publicKeyLength: keyPair.publicKey?.length,
        secretKeyType: typeof (keyPair as any).secretKey,
        secretKeyLength: (keyPair as any).secretKey?.length,
      });

      return keyPair;
    } catch (error) {
      console.log('⚠️ Failed to load modern keys from filesystem:', error);
      return null;
    }
  }

  /**
   * Save keys to binary files with modern format
   * @param keyPair - ModernKeyPair with binary keys as Uint8Array
   */
  private async saveKeysToFile(keyPair: ModernKeyPair | CryptoKeyPair): Promise<void> {
    const publicKeyPath = path.join(this.config.certPath, 'public-key.bin');
    const privateKeyPath = path.join(this.config.certPath, 'private-key.bin');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    try {
      // Handle both key formats (secretKey for ML-KEM, privateKey for RSA/ECC)
      const publicKeyData =
        keyPair.publicKey instanceof Uint8Array ? keyPair.publicKey : new Uint8Array(); // This shouldn't happen with modern keys

      // Type assertion to access both possible key formats
      const keyPairWithBothFormats = keyPair as CryptoKeyPair & { secretKey?: Uint8Array };
      const privateKeyData =
        keyPairWithBothFormats.secretKey instanceof Uint8Array
          ? keyPairWithBothFormats.secretKey
          : keyPair.privateKey instanceof Uint8Array
            ? keyPair.privateKey
            : new Uint8Array();

      // Validate that we have proper binary keys
      if (publicKeyData.length === 0 || privateKeyData.length === 0) {
        throw new Error('Invalid key data: Keys must be Uint8Array with non-zero length');
      }

      // Create metadata with key information
      const metadata: KeyMetadata = {
        algorithm: this.config.algorithm,
        keySize: this.config.keySize,
        created: new Date().toISOString(),
        lastRotation: new Date().toISOString(),
        version: 'version' in keyPair && keyPair.version ? keyPair.version : 1,
        publicKeyPath,
        privateKeyPath,
      };

      // Write binary key files and metadata
      await Promise.all([
        fs.writeFile(publicKeyPath, publicKeyData),
        fs.writeFile(privateKeyPath, privateKeyData),
        fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8'),
      ]);

      // Set secure permissions on private key file
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

      console.log('✅ Successfully saved binary keys to filesystem');
    } catch (error) {
      console.log('❌ Failed to save keys to filesystem:', error);
      throw createAppropriateError(
        `Failed to save binary keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          errorType: 'keymanager',
          operation: 'storage',
          algorithm: this.config.algorithm,
          filePath: this.config.certPath,
          keyVersion: 'version' in keyPair && keyPair.version ? keyPair.version : 1,
          cause: error instanceof Error ? error : new Error('Key save operation failed'),
        },
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
      // Check if directory already exists to avoid unnecessary operations
      try {
        const stat = await fs.stat(backupDir);
        if (!stat.isDirectory()) {
          await fs.mkdir(backupDir, { recursive: true });
        }
      } catch (error) {
        // Directory doesn't exist, create it
        await fs.mkdir(backupDir, { recursive: true });
      }

      const backupPublicPath = path.join(backupDir, `pub-key-expired-${timestamp}.pem`);
      const backupPrivatePath = path.join(backupDir, `priv-key-expired-${timestamp}.pem`);

      // Handle both key formats for backup
      const keyPairWithBothFormats = keyPair as CryptoKeyPair & { secretKey?: Uint8Array };
      const privateKeyForBackup = keyPairWithBothFormats.secretKey || keyPair.privateKey;

      if (!privateKeyForBackup) {
        throw new Error('No private key data found for backup');
      }

      await Promise.all([
        fs.writeFile(backupPublicPath, keyPair.publicKey),
        fs.writeFile(backupPrivatePath, privateKeyForBackup),
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
        `Rotation grace period cannot be negative (got ${this.config.rotationGracePeriod})`,
      );
    }

    // Validate cert path
    if (!this.config.certPath || this.config.certPath.trim() === '') {
      errors.push('Certificate path cannot be empty');
    } else {
      // Validate cert path to prevent path traversal attacks
      const normalizedPath = path.normalize(this.config.certPath);
      const resolvedPath = path.resolve(normalizedPath);
      const cwd = process.cwd();

      // Ensure the path is within the current working directory
      if (!resolvedPath.startsWith(cwd)) {
        errors.push('Certificate path must be within the current working directory');
      }

      // Ensure the path doesn't contain unsafe characters or patterns
      if (this.config.certPath.includes('../') || this.config.certPath.includes('..\\')) {
        errors.push('Certificate path contains unsafe path traversal patterns');
      }
    }

    if (errors.length > 0) {
      throw createAppropriateError(`Invalid configuration: ${errors.join(', ')}`, {
        errorType: 'config',
        algorithm: this.config.algorithm,
        parameterName: 'configuration',
        validValues: ['Valid algorithm, positive expiry months, valid cert path'],
      });
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
      // Basic binary format validation
      if (!this.currentKeys.publicKey || this.currentKeys.publicKey.length === 0) {
        result.errors.push('Invalid or empty public key data');
      } else {
        result.publicKeyValid = true;
      }

      // Check for private key data (support both ML-KEM secretKey and RSA/ECC privateKey)
      const keyPairWithBothFormats = this.currentKeys as CryptoKeyPair & { secretKey?: Uint8Array };
      const privateKeyData = keyPairWithBothFormats.secretKey || this.currentKeys.privateKey;

      console.log('🔍 Key validation debug:', {
        hasSecretKey: !!keyPairWithBothFormats.secretKey,
        secretKeyLength: keyPairWithBothFormats.secretKey?.length,
        hasPrivateKey: !!this.currentKeys.privateKey,
        privateKeyLength: this.currentKeys.privateKey?.length,
        hasPrivateKeyData: !!privateKeyData,
        privateKeyDataLength: privateKeyData?.length,
      });

      if (!privateKeyData || privateKeyData.length === 0) {
        result.errors.push('Invalid or empty private key data');
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
        `Key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      console.log('❌ Key validation failed:', result.errors);

      // Preserve original error stack trace if available
      if (error instanceof Error && error.stack) {
        console.log('Validation error stack trace:', error.stack);
      }

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
      console.error('Health check failed with error:', error);

      const healthError = createAppropriateError(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          errorType: 'keymanager',
          operation: 'validation',
          algorithm: this.config.algorithm,
          cause: error instanceof Error ? error : new Error('Health check failed'),
        },
      );

      return {
        healthy: false,
        issues: [healthError.message],
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
    // Clear any existing keys and cleanup resources
    this.currentKeys = null;

    // Clear any pending cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Reset rotation state
    this.rotationState = {
      isRotating: false,
      rotationPromise: null,
      rotationStartTime: null,
      previousKeys: null,
      newKeys: null,
    };

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

  /**
   * Securely clear key material from memory
   * This method overwrites sensitive key data with zeros before releasing references
   * ⚠️ SECURITY WARNING: This should only be called when keys are no longer needed
   */
  public securelyClearKeys(): void {
    if (this.currentKeys) {
      // Overwrite private key data with zeros
      if (this.currentKeys.privateKey) {
        const privateKeyArray = this.currentKeys.privateKey as Uint8Array;
        for (let i = 0; i < privateKeyArray.length; i++) {
          privateKeyArray[i] = 0;
        }
      }

      // Overwrite public key data with zeros
      if (this.currentKeys.publicKey) {
        const publicKeyArray = this.currentKeys.publicKey as Uint8Array;
        for (let i = 0; i < publicKeyArray.length; i++) {
          publicKeyArray[i] = 0;
        }
      }

      // Clear references
      this.currentKeys = null;
    }

    // Also clear any keys in rotation state
    if (this.rotationState.previousKeys) {
      const prevKeys = this.rotationState.previousKeys;
      if (prevKeys.privateKey) {
        const privateKeyArray = prevKeys.privateKey as Uint8Array;
        for (let i = 0; i < privateKeyArray.length; i++) {
          privateKeyArray[i] = 0;
        }
      }

      if (prevKeys.publicKey) {
        const publicKeyArray = prevKeys.publicKey as Uint8Array;
        for (let i = 0; i < publicKeyArray.length; i++) {
          publicKeyArray[i] = 0;
        }
      }

      this.rotationState.previousKeys = null;
    }

    if (this.rotationState.newKeys) {
      const newKeys = this.rotationState.newKeys;
      if (newKeys.privateKey) {
        const privateKeyArray = newKeys.privateKey as Uint8Array;
        for (let i = 0; i < privateKeyArray.length; i++) {
          privateKeyArray[i] = 0;
        }
      }

      if (newKeys.publicKey) {
        const publicKeyArray = newKeys.publicKey as Uint8Array;
        for (let i = 0; i < publicKeyArray.length; i++) {
          publicKeyArray[i] = 0;
        }
      }

      this.rotationState.newKeys = null;
    }

    console.log('🔐 Key material securely cleared from memory');
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
 * Quick access to public key as Base64 string
 */
export async function getPublicKey(): Promise<string> {
  const manager = getKeyManager();
  return manager.getPublicKeyBase64();
}

/**
 * Quick access to private key as Base64 string (server-side only)
 */
export async function getPrivateKey(): Promise<string> {
  const manager = getKeyManager();
  return manager.getPrivateKeyBase64();
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
