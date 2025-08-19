import { createAppropriateError } from '../core';
import { Preset } from '../core/common/enums';
import { EncryptedData } from '../core/common/interfaces/encryption.interfaces';
import { HybridEncryption } from '../core/encryption';
import { DEFAULT_ENCRYPTION_OPTIONS } from '../core/encryption/constants/defaults.constants';
import { KeyManager } from '../core/key-management/key-manager';
import { KeyManagerConfig } from '../core/key-management/types/key-manager.types';

export class ServerDecryption {
  private static instance: ServerDecryption | null = null;
  private static isInstantiating = false;
  private encryptionInstance: HybridEncryption | null = null;
  private keyManager: KeyManager | null = null;
  private preset: Preset;
  private isInitialized = false;

  private constructor(config: KeyManagerConfig = {}) {
    // Runtime guard to prevent direct instantiation
    if (!ServerDecryption.isInstantiating) {
      throw new Error(
        'ServerDecryption cannot be instantiated directly. Use ServerDecryption.getInstance() instead.',
      );
    }

    this.preset = config.preset ?? DEFAULT_ENCRYPTION_OPTIONS.preset;
    console.log('🔐 ServerDecryption initializing...');
  }

  public static getInstance(config: KeyManagerConfig = {}): ServerDecryption {
    if (!ServerDecryption.instance) {
      ServerDecryption.isInstantiating = true;
      ServerDecryption.instance = new ServerDecryption(config);
      ServerDecryption.isInstantiating = false;
    }
    return ServerDecryption.instance;
  }

  public static resetInstance(): void {
    if (ServerDecryption.instance) {
      // Clean up key manager
      if (ServerDecryption.instance.keyManager) {
        KeyManager.resetInstance();
      }

      // Clear instance properties
      ServerDecryption.instance.encryptionInstance = null;
      ServerDecryption.instance.keyManager = null;
      ServerDecryption.instance.isInitialized = false;
      ServerDecryption.instance = null;
    }
    ServerDecryption.isInstantiating = false;
  }

  /**
   * Initialize the ServerDecryption instance with KeyManager and HybridEncryption
   * This is called automatically on first decrypt operation
   */
  private async initializeIfNeeded(config: KeyManagerConfig = {}): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create KeyManager Instance with desired Config
      this.keyManager = KeyManager.getInstance({
        preset: this.preset,
        ...config,
      });

      // ⚠️ KeyManager does NOT initialize automatically!
      await this.keyManager.initialize(); // Don't forget to initialize

      // Initialize HybridEncryption with the same preset
      this.encryptionInstance = new HybridEncryption(this.preset);

      this.isInitialized = true;
      console.log('✅ ServerDecryption initialized successfully');
    } catch (error) {
      throw createAppropriateError('ServerDecryption initialization failed', {
        errorType: 'config',
        preset: this.preset,
        operation: 'initialization',
        cause: error instanceof Error ? error : new Error('Unknown initialization error'),
      });
    }
  }

  /**
   * Decrypts the given encrypted data using automatic key management and grace period support.
   * @param encryptedData - The encrypted data to decrypt
   * @returns The decrypted data
   */
  public async decryptData<T = unknown>(encryptedData: EncryptedData): Promise<T> {
    // Ensure initialization
    await this.initializeIfNeeded();

    if (!this.encryptionInstance) {
      throw createAppropriateError('Encryption instance is not initialized', {
        errorType: 'operation',
        preset: this.preset,
        operation: 'decryptData',
      });
    }

    if (!this.keyManager) {
      throw createAppropriateError('Key manager is not initialized', {
        errorType: 'operation',
        preset: this.preset,
        operation: 'decryptData',
      });
    }

    // Validate encrypted data structure
    this.validateEncryptedData(encryptedData);

    try {
      // Get all available decryption keys (current + grace period keys)
      const keyPairs = await this.keyManager.getDecryptionKeys();

      if (keyPairs.length === 0) {
        throw createAppropriateError('No decryption keys available', {
          errorType: 'keymanager',
          preset: this.preset,
          operation: 'decryptData',
        });
      }

      // Extract secret keys for decryption
      const secretKeys = keyPairs
        .map((keyPair) => keyPair.secretKey)
        .filter((key): key is Uint8Array => key !== undefined);

      if (secretKeys.length === 0) {
        throw createAppropriateError('No valid secret keys found in key pairs', {
          errorType: 'keymanager',
          preset: this.preset,
          operation: 'decryptData',
        });
      }

      // Use grace period decryption (tries multiple keys if needed)
      const decryptedData = this.encryptionInstance.decryptWithGracePeriod<T>(
        encryptedData,
        secretKeys,
      );

      return decryptedData;
    } catch (error) {
      throw createAppropriateError('Failed to decrypt data', {
        errorType: 'operation',
        preset: this.preset,
        cause: error instanceof Error ? error : new Error('Unknown error during decryption'),
        operation: 'decryptData',
      });
    }
  }

  /**
   * Validates the structure of encrypted data
   * @param data - The encrypted data to validate
   */
  private validateEncryptedData(data: EncryptedData): void {
    if (data == null || typeof data !== 'object') {
      throw createAppropriateError('Invalid encrypted data: must be an object', {
        errorType: 'validation',
        preset: this.preset,
        operation: 'decryptData',
      });
    }

    const requiredFields = ['preset', 'encryptedContent', 'cipherText', 'nonce'];
    const missingFields = requiredFields.filter((field) => !(field in data));

    if (missingFields.length > 0) {
      throw createAppropriateError(
        `Invalid encrypted data: missing required fields: ${missingFields.join(', ')}`,
        {
          errorType: 'validation',
          preset: this.preset,
          operation: 'decryptData',
        },
      );
    }

    // Validate preset compatibility
    if (data.preset !== this.preset) {
      console.warn(
        `⚠️ Preset mismatch: encrypted data uses ${data.preset}, server configured for ${this.preset}`,
      );
    }
  }

  /**
   * Gets the current status of the ServerDecryption instance
   */
  public async getStatus() {
    if (!this.isInitialized || !this.keyManager) {
      return {
        initialized: false,
        preset: this.preset,
        keyManager: null,
      };
    }

    const keyManagerStatus = await this.keyManager.getStatus();

    return {
      initialized: this.isInitialized,
      preset: this.preset,
      keyManager: keyManagerStatus,
    };
  }

  /**
   * Performs a health check on the ServerDecryption instance
   */
  public async healthCheck() {
    const issues: string[] = [];

    if (!this.isInitialized) {
      issues.push('ServerDecryption not initialized');
    }

    if (!this.encryptionInstance) {
      issues.push('HybridEncryption instance not available');
    }

    if (!this.keyManager) {
      issues.push('KeyManager not available');
    } else {
      const keyManagerHealth = await this.keyManager.healthCheck();
      if (!keyManagerHealth.healthy) {
        issues.push(...keyManagerHealth.issues.map((issue) => `KeyManager: ${issue}`));
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  public async getPublicKey(): Promise<Uint8Array | null> {
    await this.initializeIfNeeded();
    return this.keyManager ? await this.keyManager.getPublicKey() : null;
  }

  public async getPublicKeyBase64(): Promise<string | null> {
    await this.initializeIfNeeded();
    return this.keyManager ? await this.keyManager.getPublicKeyBase64() : null;
  }

  public async rotateKeys(): Promise<void | null> {
    await this.initializeIfNeeded();
    return this.keyManager ? await this.keyManager.rotateKeys() : null;
  }
}

// Direct export of the getInstance method (Option 1)
export const getServerDecryption = ServerDecryption.getInstance;
