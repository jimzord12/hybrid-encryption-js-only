import { KeyPair } from '../../../core/common/interfaces/keys.interfaces';
import {
  KeyManagerConfig,
  KeyRotationState,
} from '../../../core/key-management/types/key-manager.types';
import { createAppropriateError } from '../../common/errors/encryption.errors';
import { KeyLifecycleService } from './key-lifecycle.service.js';
import { KeyStorageService } from './key-storage.service.js';
import { RotationHistoryService } from './rotation-history.service.js';

export class KeyRotationService {
  private readonly config: Pick<
    Required<KeyManagerConfig>,
    'rotationGracePeriodInMinutes' | 'preset' | 'enableFileBackup'
  >;

  constructor(
    config: Pick<
      Required<KeyManagerConfig>,
      'rotationGracePeriodInMinutes' | 'preset' | 'enableFileBackup'
    >,
  ) {
    this.config = config;
  }

  public haveKeysExpired(keyPair: KeyPair | null): boolean {
    if (keyPair != null) return new Date() > keyPair.metadata.expiresAt;
    return true;
  }

  public needsRotation(currentKeys: KeyPair | null): boolean {
    if (!currentKeys) return true;
    if (!currentKeys.metadata.expiresAt) return true;
    if (this.haveKeysExpired(currentKeys)) return true;

    return false;
  }

  public isInGracePeriod(rotationState: KeyRotationState): boolean {
    if (!rotationState.rotationStartTime) return false;

    const gracePeriodMs = this.config.rotationGracePeriodInMinutes * 60 * 1000;
    const elapsed = Date.now() - rotationState.rotationStartTime.getTime();

    return elapsed < gracePeriodMs;
  }

  public cleanupRotationState(): KeyRotationState {
    console.log('🧹 Rotation state cleaned up');
    return {
      isRotating: false,
      rotationPromise: null,
      rotationStartTime: null,
      previousKeys: null,
      newKeys: null,
    };
  }

  public async performKeyRotation(
    currentKeys: KeyPair | null,
    lifecycleService: KeyLifecycleService,
    storageService: KeyStorageService,
    historyService: RotationHistoryService,
  ): Promise<{ newKeys: KeyPair; previousKeys: KeyPair | null }> {
    console.log('🔄 Starting key rotation...');

    console.log('Current Keys | PK: ', currentKeys?.publicKey.length || -1, 'bytes');
    console.log('Current Keys | SK: ', currentKeys?.secretKey.length || -1, 'bytes');

    try {
      // Generate new keys
      console.log(`🔑 Generating new key pair (PRESET: ${this.config.preset})...`);
      const nextVersion = (await historyService.getNextVersionNumber()) ?? 1;
      const newKeyPair = lifecycleService.createNewKeyPair({ version: nextVersion });

      console.log('New Keys | PK: ', newKeyPair.publicKey.length || -1, 'bytes');
      console.log('New Keys | SK: ', newKeyPair.secretKey.length || -1, 'bytes');

      // Backup old keys if they exist
      if (currentKeys && this.config.enableFileBackup) {
        await storageService.backupExpiredKeys(currentKeys);
      }

      // Save new keys to filesystem and update rotation history
      if (this.config.enableFileBackup) {
        await storageService.saveKeysToFile(newKeyPair);
        await historyService.updateRotationHistory(newKeyPair);
      }

      console.log(`✅ Key rotation completed successfully (version ${nextVersion})`);

      return {
        newKeys: newKeyPair,
        previousKeys: currentKeys,
      };
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      throw createAppropriateError(
        `Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'rotation',
          keyVersion: currentKeys?.metadata.version,
          rotationState: 'failed',
          cause: error instanceof Error ? error : new Error('Unknown rotation error'),
        },
      );
    }
  }
}
