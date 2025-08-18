import { createAppropriateError } from '../../../core/common/errors';
import { KeyPair, Keys } from '../../../core/common/interfaces/keys.interfaces';
import {
  KeyManagerConfig,
  KeyValidationResult,
} from '../../../core/key-management/types/key-manager.types';
import { MlKemKeyProvider } from '../../../core/providers';
import { KeyProvider } from '../../../core/providers/interfaces/key-provider.interface';

const MONTH = 30 * 24 * 60 * 60 * 1000;

export class KeyLifecycleService {
  private readonly keyProvider: KeyProvider;
  private readonly config: Pick<Required<KeyManagerConfig>, 'preset' | 'keyExpiryMonths'>;

  constructor(config: Pick<Required<KeyManagerConfig>, 'preset' | 'keyExpiryMonths'>) {
    this.config = config;
    this.keyProvider = new MlKemKeyProvider(config.preset);
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
          metadata?.expiresAt || new Date(Date.now() + this.config.keyExpiryMonths * MONTH),
        version: metadata?.version || 1,
      },
    };
  }

  public createNewKeyPair(metadata?: Partial<KeyPair['metadata']>): KeyPair {
    const newKeyPair = this.keyProvider.generateKeyPair(metadata);

    const { ok, errors } = this.keyProvider.validateKeyPair(newKeyPair);

    // Validate new keys using the key provider
    if (!ok) {
      throw createAppropriateError('Generated invalid key pair', {
        preset: this.config.preset,
        errorType: 'keymanager',
        operation: 'generation',
        cause: new Error(`New Keys validation failed: ${errors.join(', ')}`),
      });
    }

    return newKeyPair;
  }

  public haveKeysExpired(keyPair: KeyPair | null): boolean {
    if (keyPair != null) return new Date() > keyPair.metadata.expiresAt;
    return true;
  }

  public async validateKeys(keys: KeyPair | null): Promise<KeyValidationResult> {
    console.log('🔍 Validating keys...');

    const result: KeyValidationResult = {
      isValid: false,
      errors: [],
      publicKeyValid: false,
      secretKeyValid: false,
      keyPairMatches: false,
      hasExpired: false,
    };

    if (!keys) {
      result.errors.push('No keys available');
      return result;
    }

    try {
      // Basic binary format validation
      if (!keys.publicKey || keys.publicKey.length === 0) {
        result.errors.push('Invalid or empty public key data');
      } else {
        result.publicKeyValid = true;
      }

      const hasSecretKey = Boolean(keys.secretKey);
      const secretKey = keys.secretKey;

      console.log('🔍 Key validation debug:', {
        hasSecretKey,
        secretKeyLength: secretKey?.length,
      });

      if (!hasSecretKey || secretKey.length === 0) {
        result.errors.push('Invalid or empty secret key data');
      } else {
        result.secretKeyValid = true;
      }

      // Key pair validation using the provider
      if (result.publicKeyValid && result.secretKeyValid) {
        const { ok, errors: keyProviderErrors } = this.keyProvider.validateKeyPair(keys);
        if (ok) {
          result.keyPairMatches = true;
        } else {
          result.errors.push('Key pair mismatch - public and secret keys do not match');
          result.errors.push(...keyProviderErrors);
        }
      }

      // Expiry validation
      result.hasExpired = this.haveKeysExpired(keys);

      if (result.hasExpired) result.errors.push('Keys have expired');

      result.isValid =
        result.publicKeyValid &&
        result.secretKeyValid &&
        result.keyPairMatches &&
        !result.hasExpired;

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

  public securelyClearKey(keyPair: KeyPair | null): void {
    if (keyPair) {
      // Overwrite secret key data with zeros
      if (keyPair.secretKey) {
        const secretKeyArray = keyPair.secretKey as Uint8Array;
        for (let i = 0; i < secretKeyArray.length; i++) {
          secretKeyArray[i] = 0;
        }
      }

      // Overwrite public key data with zeros
      if (keyPair.publicKey) {
        const publicKeyArray = keyPair.publicKey as Uint8Array;
        for (let i = 0; i < publicKeyArray.length; i++) {
          publicKeyArray[i] = 0;
        }
      }
    }
  }

  public securelyClearKeys(keys: (KeyPair | null)[]): void {
    keys.forEach((key) => this.securelyClearKey(key));
    console.log('🔐 Key material securely cleared from memory');
  }
}
