import { isJobScheduled } from '../../server/cron/cron-utils.js';
import { registerRotationJob } from '../../server/cron/key-rotation-job.js';
import { createAppropriateError } from '../common/errors/encryption.errors.js';
import { KeyPair } from '../common/interfaces/keys.interfaces.js';
import { BufferUtils } from '../utils/index.js';
import { DEFAULT_KEY_MANAGER_OPTIONS } from './constants/defaults.constants.js';
import { KeyConfigurationService } from './services/key-configuration.service.js';
import { KeyLifecycleService } from './services/key-lifecycle.service.js';
import { KeyRotationService } from './services/key-rotation.service.js';
import { KeyStorageService } from './services/key-storage.service.js';
import { RotationHistoryService } from './services/rotation-history.service.js';
import { KeyManagerConfig, KeyManagerStatus, KeyRotationState } from './types/key-manager.types.js';

export class KeyManager {
  public static instance: KeyManager | null = null;

  private config: Required<KeyManagerConfig>;

  // Services
  private readonly configService: KeyConfigurationService;
  private readonly storageService: KeyStorageService;
  private readonly lifecycleService: KeyLifecycleService;
  private readonly rotationService: KeyRotationService;
  private readonly historyService: RotationHistoryService;

  // State
  public currentKeys: KeyPair | null = null;
  public rotationState: KeyRotationState;
  public isInitialized = false;
  public lastValidation: Date | null = null;
  public cleanupTimer: NodeJS.Timeout | null = null;

  private constructor(config: KeyManagerConfig = {}) {
    this.config = { ...DEFAULT_KEY_MANAGER_OPTIONS, ...config };

    // Instantiate services
    this.configService = new KeyConfigurationService();
    this.storageService = new KeyStorageService(this.config);
    this.lifecycleService = new KeyLifecycleService(this.config);
    this.rotationService = new KeyRotationService(this.config);
    this.historyService = new RotationHistoryService(this.config);

    this.rotationState = {
      isRotating: false,
      rotationPromise: null,
      rotationStartTime: null,
      previousKeys: null,
      newKeys: null,
    };
  }

  public static getInstance(config?: KeyManagerConfig): KeyManager {
    KeyManager.instance ??= new KeyManager(config);
    return KeyManager.instance;
  }

  public static resetInstance(): void {
    if (KeyManager.instance) {
      KeyManager.instance.cleanup();
    }
    KeyManager.instance = null;
  }

  private cleanup(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.lifecycleService.securelyClearKeys([
      this.currentKeys,
      this.rotationState.previousKeys,
      this.rotationState.newKeys,
    ]);
    this.currentKeys = null;
    this.lastValidation = null;
    this.isInitialized = false;
    this.rotationState = {
      isRotating: false,
      rotationPromise: null,
      rotationStartTime: null,
      previousKeys: null,
      newKeys: null,
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔑 KeyManager initializing...');

    if (!isJobScheduled('Key Rotation Job')) {
      console.log('🔑 KeyManager | Registering Rotation Cron Job');
      registerRotationJob(this.config.rotationIntervalInWeeks);
    }

    try {
      console.log('🔑 Config to Validate: ', this.config);
      // 1. Validate configuration
      this.configService.validateConfig(this.config);

      // 2. Ensure cert directory exists
      await this.storageService.ensureCertDirectory();

      // 3. Load existing keys or generate new ones
      let keys = await this.storageService.loadKeysFromFile();
      if (!keys) {
        if (this.config.autoGenerate) {
          console.log(`🔑 Generating new key pair (PRESET: ${this.config.preset})...`);
          const nextVersion = (await this.historyService.getNextVersionNumber()) ?? 1;
          keys = this.lifecycleService.createNewKeyPair({ version: nextVersion });
          if (this.config.enableFileBackup) {
            await this.storageService.saveKeysToFile(keys);
            await this.historyService.updateRotationHistory(keys);
          }
        } else {
          throw createAppropriateError('No keys found and auto-generation is disabled', {
            preset: this.config.preset,
            errorType: 'keymanager',
            operation: 'initialization',
          });
        }
      }
      this.currentKeys = keys;

      // 4. Validate current keys
      const validation = await this.lifecycleService.validateKeys(this.currentKeys);
      if (!validation.isValid) {
        throw createAppropriateError(`Key validation failed: ${validation.errors.join(', ')}`, {
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'initialization',
          cause: new Error('Key validation failed'),
        });
      }

      this.isInitialized = true;
      this.lastValidation = new Date();
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

  public async ensureValidKeys(): Promise<KeyPair> {
    if (this.rotationState.isRotating && this.rotationState.rotationPromise !== null) {
      await this.rotationState.rotationPromise;
    }

    if (this.rotationService.needsRotation(this.currentKeys)) {
      await this.rotateKeys();
    }

    if (this.currentKeys === null) {
      throw createAppropriateError('No valid keys available after rotation attempt', {
        errorType: 'keymanager',
        operation: 'retrieval',
        preset: this.config.preset,
        rotationState: this.rotationState.isRotating ? 'rotating' : 'idle',
      });
    }

    return this.currentKeys;
  }

  public async getPublicKey(): Promise<Uint8Array> {
    const keys = await this.ensureValidKeys();
    return keys.publicKey;
  }

  public async getPublicKeyBase64(): Promise<string> {
    const publicKey = await this.getPublicKey();
    return BufferUtils.encodeBase64(publicKey);
  }

  public async getSecretKey(): Promise<Uint8Array> {
    const keys = await this.ensureValidKeys();
    if (!keys.secretKey) {
      throw new Error('No secret key found in key pair');
    }
    return keys.secretKey;
  }

  public async getSecretKeyBase64(): Promise<string> {
    const secretKey = await this.getSecretKey();
    return BufferUtils.encodeBase64(secretKey);
  }

  public async getKeyPair(): Promise<KeyPair> {
    return await this.ensureValidKeys();
  }

  public async getDecryptionKeys(): Promise<KeyPair[]> {
    const keys = [await this.ensureValidKeys()];

    if (
      this.rotationState.previousKeys &&
      this.rotationService.isInGracePeriod(this.rotationState)
    ) {
      keys.push(this.rotationState.previousKeys);
    }

    return keys;
  }

  public async rotateKeys(): Promise<void> {
    if (this.rotationState.isRotating && this.rotationState.rotationPromise) {
      return this.rotationState.rotationPromise;
    }

    const rotationLogic = async () => {
      this.rotationState.isRotating = true;
      this.rotationState.rotationStartTime = new Date();

      const { newKeys, previousKeys } = await this.rotationService.performKeyRotation(
        this.currentKeys,
        this.lifecycleService,
        this.storageService,
        this.historyService,
      );

      this.rotationState.previousKeys = previousKeys;
      this.rotationState.newKeys = newKeys;
      this.currentKeys = newKeys;
      this.lastValidation = new Date();

      // Clean up rotation state after grace period
      this.cleanupTimer = setTimeout(
        () => {
          const clearedState = this.rotationService.cleanupRotationState();
          this.lifecycleService.securelyClearKey(this.rotationState.previousKeys);
          this.rotationState = clearedState;
        },
        this.config.rotationGracePeriodInMinutes * 60 * 1000 + 100,
      );

      this.rotationState.isRotating = false;
      this.rotationState.rotationPromise = null;
    };

    this.rotationState.rotationPromise = rotationLogic().catch((error) => {
      this.rotationState.isRotating = false;
      this.rotationState.rotationPromise = null;
      this.rotationState.rotationStartTime = null;
      this.rotationState.newKeys = null;

      if (this.cleanupTimer != null) {
        clearTimeout(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      throw error; // re-throw the error from performKeyRotation
    });

    return this.rotationState.rotationPromise;
  }

  public async getStatus(): Promise<KeyManagerStatus> {
    const validation = this.currentKeys
      ? await this.lifecycleService.validateKeys(this.currentKeys)
      : { isValid: false, hasExpired: true };

    return {
      hasKeys: this.currentKeys !== null,
      keysValid: validation.isValid,
      keysExpired: this.currentKeys ? validation.hasExpired : true,
      isRotating: this.rotationState.isRotating,
      currentKeyVersion: this.currentKeys?.metadata.version || null,
      createdAt: this.currentKeys?.metadata.createdAt || null,
      expiresAt: this.currentKeys?.metadata.expiresAt || null,
      certPath: this.config.certPath,
      lastRotation: this.rotationState.rotationStartTime,
    };
  }

  public async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      if (!this.isInitialized) {
        issues.push('KeyManager not initialized');
      }

      if (!this.currentKeys) {
        issues.push('No keys available');
      } else {
        const validation = await this.lifecycleService.validateKeys(this.currentKeys);
        if (!validation.isValid) {
          issues.push(...validation.errors);
        }
      }

      if (this.rotationService.needsRotation(this.currentKeys)) {
        issues.push('Keys need rotation');
      }

      return {
        healthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        healthy: false,
        issues: [`Health check failed: ${message}`],
      };
    }
  }

  public getConfig(): Required<KeyManagerConfig> {
    return { ...this.config };
  }
}
