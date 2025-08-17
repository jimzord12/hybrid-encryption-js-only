import fs from 'node:fs/promises';
import path from 'node:path';
// ============================================================================
// KEY STORAGE INTERFACES
// ============================================================================

import { createAppropriateError } from '../../common/errors';
import { FileSystemError } from '../../common/errors/interfaces/filesystem.interfaces';
import { isValidPreset } from '../../common/guards/enum.guards';
import { isFSError } from '../../common/guards/error.guards';
import { KeyPair, Keys, SerializableKeyPair } from '../../common/interfaces/keys.interfaces';
import { MlKemKeyProvider } from '../../providers';
import { KeyProvider } from '../../providers/interfaces/key-provider.interface';
import { BufferUtils } from '../../utils';
import { DEFAULT_KEY_MANAGER_OPTIONS } from '../constants/defaults.constants';
import {
  KeyManagerConfig,
  KeyManagerStatus,
  KeyRotationState,
  KeyValidationResult,
  RotationHistory,
  RotationHistoryEntry,
} from '../types/key-manager.types';

// ============================================================================
// KEY MANAGER SINGLETON CLASS
// ============================================================================

const MONTH = 30 * 24 * 60 * 60 * 1000;

export class KeyManager {
  public static instance: KeyManager | null = null;
  public config: Required<KeyManagerConfig>;
  public currentKeys: KeyPair | null = null;
  public rotationState: KeyRotationState;
  public lastValidation: Date | null = null;
  public isInitialized = false;
  public cleanupTimer: NodeJS.Timeout | null = null;
  private keyProvider: KeyProvider;
  private rotationHistoryCache: RotationHistory | null = null;
  private rotationHistoryCacheTime: number | null = null;
  private readonly ROTATION_HISTORY_CACHE_TTL =
    DEFAULT_KEY_MANAGER_OPTIONS.rotationGracePeriod * 60 * 1000; // 5 minutes

  private constructor(config: KeyManagerConfig = {}) {
    // Set default configuration with modern algorithm support
    this.config = {
      preset: config.preset || DEFAULT_KEY_MANAGER_OPTIONS.preset,
      certPath: config.certPath || DEFAULT_KEY_MANAGER_OPTIONS.certPath,
      keyExpiryMonths: config.keyExpiryMonths || DEFAULT_KEY_MANAGER_OPTIONS.keyExpiryMonths,
      autoGenerate: config.autoGenerate ?? DEFAULT_KEY_MANAGER_OPTIONS.autoGenerate,
      enableFileBackup: config.enableFileBackup ?? DEFAULT_KEY_MANAGER_OPTIONS.enableFileBackup,
      rotationGracePeriod:
        config.rotationGracePeriod || DEFAULT_KEY_MANAGER_OPTIONS.rotationGracePeriod,
    };

    // Initialize the key provider based on algorithm
    this.keyProvider = new MlKemKeyProvider(config.preset);

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
      KeyManager.instance.updateConfig({});
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
    this.config = {} as any;

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
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'initialization',
          cause: new Error('Key validation failed'),
        });
      }

      this.isInitialized = true;
      console.log('✅ KeyManager initialized successfully');
    } catch (error) {
      const initError = createAppropriateError(
        `KeyManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'initialization',
          cause: error instanceof Error ? error : new Error('Unknown initialization error'),
        },
      );

      throw initError;
    }
  }

  /**
   * Check if rotation is needed and wait for completion if in progress
   */
  public async ensureValidKeys(): Promise<KeyPair> {
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
        preset: this.config.preset,
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
    if (!keys.secretKey) {
      throw new Error('No private/secret key found in key pair');
    }
    return keys.secretKey;
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
  public async getKeyPair(): Promise<KeyPair> {
    return await this.ensureValidKeys();
  }

  /**
   * Get keys for decryption (includes previous keys during rotation)
   * This is meant to be used by the Encryption Core Module
   */
  public async getDecryptionKeys(): Promise<KeyPair[]> {
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

  public haveKeysExpired(keyPair?: KeyPair): boolean {
    if (keyPair != null) return new Date() > keyPair.metadata.expiresAt;
    if (this.currentKeys != null) return new Date() > this.currentKeys.metadata.expiresAt;
    return true;
  }

  /**
   * Check if keys need rotation
   */
  public needsRotation(): boolean {
    if (!this.currentKeys) return true;
    const keyPair = this.currentKeys;

    if (!keyPair.metadata.expiresAt) return true;
    if (this.haveKeysExpired(this.currentKeys)) return true;

    return false;
  }

  public addMetaDataToKeys(keys: Keys, metadata?: Partial<KeyPair['metadata']>): KeyPair {
    const { publicKey, secretKey } = keys;

    return {
      publicKey,
      secretKey,
      metadata: {
        preset: this.config.preset,
        createdAt: new Date(),
        expiresAt:
          metadata?.expiresAt ||
          new Date(Date.now() + DEFAULT_KEY_MANAGER_OPTIONS.keyExpiryMonths * MONTH),
        version: metadata?.version || 1,
      },
    };
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
      console.log(`🔑 Generating new key pair (PRESET: ${this.config.preset})...`);

      const nextVersion = (await this.getNextVersionNumber()) ?? 1;

      const newKeyPair = this.createNewKeyPair({ version: nextVersion });

      // Set rotation state only after keys are generated and validated
      this.rotationState.isRotating = true;
      this.rotationState.rotationStartTime = new Date();
      this.rotationState.previousKeys = this.currentKeys;
      this.rotationState.newKeys = newKeyPair;

      // Backup old keys if they exist
      if (this.currentKeys && this.config.enableFileBackup) {
        await this.backupExpiredKeys(this.currentKeys);
      }

      // Save new keys to filesystem and update rotation history
      if (this.config.enableFileBackup) {
        await this.saveKeysToFile(newKeyPair);
        await this.updateRotationHistory(newKeyPair);
      }

      // Update current keys (atomic operation)
      this.currentKeys = newKeyPair;
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
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'rotation',
          keyVersion: this.currentKeys?.metadata.version,
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
  private async getNextVersionNumber(): Promise<number | undefined> {
    const history = await this.getRotationHistory();

    if (history.rotations.length === 0) {
      return;
    }

    // Find the highest version number and increment
    const maxVersion = Math.max(...history.rotations.map(r => r.version));
    return maxVersion + 1;
  }

  /**
   * Update rotation history with new key information
   */
  private async updateRotationHistory(keyPair: KeyPair): Promise<void> {
    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const history = await this.getRotationHistory();

      const { metadata } = keyPair;
      const { createdAt, expiresAt, preset, version } = metadata;

      const rotationEntry: RotationHistoryEntry = {
        preset,
        version,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
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

  public getRotationCache() {
    const now = Date.now();
    const cache =
      this.rotationHistoryCache &&
      this.rotationHistoryCacheTime &&
      now - this.rotationHistoryCacheTime < this.ROTATION_HISTORY_CACHE_TTL;

    return cache ? this.rotationHistoryCache : null;
  }

  /**
   * Get rotation history
   */
  public async getRotationHistory(): Promise<RotationHistory> {
    // Check if we have a valid cache
    const now = Date.now();
    const cache = this.getRotationCache();
    if (cache) {
      return cache;
    }

    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const historyContent = await fs.readFile(historyPath, 'utf8');
      const history = JSON.parse(historyContent);

      // Update cache
      this.rotationHistoryCache = history;
      this.rotationHistoryCacheTime = now;

      return history;
    } catch (error) {
      if (isFSError(error)) {
        const fsError = error as FileSystemError;
        // Handle fs.readFile errors
        if (fsError.code === 'ENOENT') throw new Error(`File not found: ${fsError.path}`);

        if (fsError.code === 'EACCES') throw new Error(`Permission denied: ${fsError.path}`);

        if (fsError.code === 'EISDIR')
          throw new Error(`Path is a directory, not a file: ${fsError.path}`);
      } else if (error instanceof SyntaxError) {
        const jsonError = error as SyntaxError;
        throw new Error(`Invalid JSON, name: ${jsonError.name}, message: ${jsonError.message}`);
      } else {
        throw error;
      }

      // Re-throw unknown errors

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

  // /**
  //  * Get rotation statistics
  //  */
  // public async getRotationStats(): Promise<RotationStats> {
  //   const history = await this.getRotationHistory();

  //   if (history.rotations.length === 0) {
  //     return {
  //       totalRotations: 0,
  //       averageKeyLifetimeDays: 0,
  //       oldestRotation: null,
  //       newestRotation: null,
  //       rotationsThisYear: 0,
  //       rotationsThisMonth: 0,
  //     };
  //   }

  //   const now = new Date();
  //   const thisYear = now.getFullYear();
  //   const thisMonth = now.getMonth();

  //   const rotationsThisYear = history.rotations.filter(
  //     r => new Date(r.createdAt).getFullYear() === thisYear,
  //   ).length;

  //   const rotationsThisMonth = history.rotations.filter(r => {
  //     const date = new Date(r.createdAt);
  //     return date.getFullYear() === thisYear && date.getMonth() === thisMonth;
  //   }).length;

  //   // Calculate average lifetime
  //   let totalLifetime = 0;
  //   for (let i = 1; i < history.rotations.length; i++) {
  //     const prev = new Date(history.rotations[i - 1].createdAt);
  //     const curr = new Date(history.rotations[i].createdAt);
  //     totalLifetime += curr.getTime() - prev.getTime();
  //   }
  //   const averageKeyLifetime =
  //     history.rotations.length > 1
  //       ? Math.round(totalLifetime / (history.rotations.length - 1) / (1000 * 60 * 60 * 24)) // days
  //       : 0;

  //   return {
  //     totalRotations: history.totalRotations,
  //     averageKeyLifetime,
  //     oldestRotation: history.rotations[0],
  //     newestRotation: history.rotations[history.rotations.length - 1],
  //     rotationsThisYear,
  //     rotationsThisMonth,
  //   };
  // }

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
          preset: this.config.preset,
          operation: 'storage',
          filePath: this.config.certPath,
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
        this.currentKeys = loadedKeys;

        console.log('📂 Loaded existing keys from filesystem');
        console.log(`🔢 Current key version: ${loadedKeys.metadata.version}`);
        return;
      }
    } catch (error) {
      console.log('📂 No existing keys found, will generate new ones | ', error);
    }

    // Generate new keys if none found or auto-generate is enabled
    if (this.config.autoGenerate) {
      console.log(`🔑 Generating new key pair (PRESET: ${this.config.preset})...`);

      console.log(
        'Checking Directory Write Permissions:',
        await fs.access(this.config.certPath, fs.constants.W_OK), // undefined
      );

      // Get next version number
      const nextVersion = (await this.getNextVersionNumber()) ?? 1;

      const newKeyPair = this.createNewKeyPair({ version: nextVersion });

      this.currentKeys = newKeyPair;

      // Save to filesystem and update rotation history
      if (this.config.enableFileBackup) {
        await this.saveKeysToFile(this.currentKeys);
        await this.updateRotationHistory(this.currentKeys);
      }

      console.log(`✅ Generated and saved new key pair (version ${nextVersion})`);
    } else {
      throw createAppropriateError('No keys found and auto-generation is disabled', {
        preset: this.config.preset,
        errorType: 'keymanager',
        operation: 'initialization',
      });
    }
  }

  private createNewKeyPair(metadata?: Partial<KeyPair['metadata']>): KeyPair {
    const newKeys = this.keyProvider.generateKeyPair();
    const newKeyPair = this.addMetaDataToKeys(newKeys, metadata);

    const { ok, errors } = this.keyProvider.validateKeyPair(newKeyPair);

    // Validate new keys using the key provider
    if (!ok) {
      throw createAppropriateError('Generated invalid key pair', {
        preset: this.config.preset,
        errorType: 'keymanager',
        operation: 'rotation',
        keyVersion: this.currentKeys?.metadata.version,
        cause: new Error(`New Keys validation failed: ${errors.join(', ')}`),
      });
    }

    return newKeyPair;
  }

  /**
   * Load keys from binary files (modern format)
   */
  private async loadKeysFromFile(): Promise<KeyPair | null> {
    const publicKeyPath = path.join(this.config.certPath, 'public-key.bin');
    const secretKeyPath = path.join(this.config.certPath, 'secret-key.bin');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    try {
      console.log('🚛 Loading modern binary key files...');

      // Read binary key files and JSON metadata
      const [publicKeyBinary, secretKeyBinary, metadataStr] = await Promise.all([
        fs.readFile(publicKeyPath),
        fs.readFile(secretKeyPath),
        fs.readFile(metadataPath, 'utf8').catch(() => '{}'),
      ]);

      console.log('1. Loaded key files:', {
        publicKey: publicKeyBinary.length > 0 ? '✔️' : '❌',
        secretKey: secretKeyBinary.length > 0 ? '✔️' : '❌',
        metadata: metadataStr ? '✔️' : '❌',
      });

      let metadata: Partial<KeyPair['metadata']> = {};
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        console.log('⚠️ Failed to parse key metadata, using defaults');
        return null;
      }

      if (!publicKeyBinary || !secretKeyBinary) {
        console.log('⚠️ Missing key material, generating new keys');
        return null;
      }

      if (!metadata.createdAt || !metadata.preset || !metadata.version || !metadata.expiresAt) {
        console.log('⚠️ Missing metadata properties, generating new keys');
        return null;
      }

      const createdAt = new Date(metadata.createdAt);
      const expiresAt = new Date(metadata.expiresAt);
      const version = metadata.version;

      const keyPair: KeyPair = {
        publicKey: new Uint8Array(publicKeyBinary),
        secretKey: new Uint8Array(secretKeyBinary), // Use secretKey for ML-KEM compatibili]ty
        metadata: {
          preset: metadata.preset,
          version,
          createdAt,
          expiresAt,
        },
      };

      console.log('3. Loaded Key Pair:', keyPair);

      return keyPair;
    } catch (error) {
      console.log('⚠️ Failed to load keys from filesystem:', error);
      return null;
    }
  }

  /**
   * Save keys to binary files with modern format
   * @param keyPair - ModernKeyPair with binary keys as Uint8Array
   */
  private async saveKeysToFile(keyPair: KeyPair): Promise<void> {
    const publicKeyPath = path.join(this.config.certPath, 'public-key.bin');
    const secretPath = path.join(this.config.certPath, 'secret-key.bin');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    const { publicKey, secretKey } = keyPair;

    try {
      // Create metadata with key information
      const metadata: SerializableKeyPair['metadata'] = {
        preset: this.config.preset,
        version: keyPair.metadata.version,
        createdAt: keyPair.metadata.createdAt.toISOString(),
        expiresAt: keyPair.metadata.expiresAt.toISOString(),
      };

      // Write binary key files and metadata
      await Promise.all([
        fs.writeFile(publicKeyPath, publicKey),
        fs.writeFile(secretPath, secretKey),
        fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8'),
      ]);

      // Set secure permissions on private key file
      if (process.platform === 'win32') {
        // Windows: Set file as read-only and try to set NTFS permissions
        try {
          await fs.chmod(secretPath, 0o600);
        } catch (error) {
          console.warn('⚠️ Could not set Windows file permissions:', error);
        }
      } else {
        // Unix-like systems: Set proper octal permissions
        await fs.chmod(secretPath, 0o600);
      }

      console.log('✅ Successfully saved binary keys to filesystem');
    } catch (error) {
      console.log('❌ Failed to save keys to filesystem:', error);
      throw createAppropriateError(
        `Failed to save binary keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'storage',
          filePath: this.config.certPath,
          keyVersion: keyPair.metadata.version,
          cause: error instanceof Error ? error : new Error('Key save operation failed'),
        },
      );
    }
  }

  /**
   * Backup expired keys
   */
  private async backupExpiredKeys(keyPair: KeyPair): Promise<void> {
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
      const backupSecretPath = path.join(backupDir, `secret-key-expired-${timestamp}.pem`);

      if (!keyPair.secretKey) {
        throw new Error('No secret key data found for backup');
      }

      await Promise.all([
        fs.writeFile(backupPublicPath, keyPair.publicKey),
        fs.writeFile(backupSecretPath, keyPair.secretKey),
      ]);

      await fs.chmod(backupSecretPath, 0o600);
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

    if (!isValidPreset(this.config.preset)) {
      errors.push(`Invalid preset (got ${this.config.preset})`);
    }

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
        preset: this.config.preset,
        parameterName: 'configuration',
        validValues: ['Valid preset, positive expiry months, valid cert path'],
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
      secretKeyValid: false,
      keyPairMatches: false,
      hasExpired: false,
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

      const hasSecretKey = Boolean(this.currentKeys.secretKey);
      const secretKey = this.currentKeys.secretKey;

      console.log('🔍 Key validation debug:', {
        hasSecretKey,
        secretKeyLength: secretKey.length,
      });

      if (!hasSecretKey || secretKey.length === 0) {
        result.errors.push('Invalid or empty secret key data');
      } else {
        result.secretKeyValid = true;
      }

      // Key pair validation using the provider
      if (result.publicKeyValid && result.secretKeyValid) {
        const { ok, errors: keyProviderErrors } = this.keyProvider.validateKeyPair(
          this.currentKeys,
        );
        if (ok) {
          result.keyPairMatches = true;
        } else {
          result.errors.push('Key pair mismatch - public and secret keys do not match');
          result.errors.push(...keyProviderErrors);
        }
      }

      // Expiry validation using the provider
      result.hasExpired = this.haveKeysExpired(this.currentKeys);

      if (result.hasExpired) result.errors.push('Keys have expired');

      result.isValid =
        result.publicKeyValid &&
        result.secretKeyValid &&
        result.keyPairMatches &&
        !result.hasExpired;

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
      keysExpired: this.currentKeys ? this.haveKeysExpired(this.currentKeys) : true,
      isRotating: this.rotationState.isRotating,
      currentKeyVersion: this.currentKeys?.metadata.version || null,
      createdAt: this.currentKeys?.metadata.createdAt || null,
      expiresAt: this.currentKeys?.metadata.expiresAt || null,
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
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'validation',
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
      // Overwrite secret key data with zeros
      if (this.currentKeys.secretKey) {
        const secretKeyArray = this.currentKeys.secretKey as Uint8Array;
        for (let i = 0; i < secretKeyArray.length; i++) {
          secretKeyArray[i] = 0;
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
      if (prevKeys.secretKey) {
        const secretKeyArray = prevKeys.secretKey as Uint8Array;
        for (let i = 0; i < secretKeyArray.length; i++) {
          secretKeyArray[i] = 0;
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
      if (newKeys.secretKey) {
        const secretKeyArray = newKeys.secretKey as Uint8Array;
        for (let i = 0; i < secretKeyArray.length; i++) {
          secretKeyArray[i] = 0;
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
