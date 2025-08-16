import { randomBytes } from '@noble/hashes/utils.js';

import { Preset } from '../common/enums/index.js';
import {
  createAppropriateError,
  EncryptionError,
  FormatConversionError,
} from '../common/errors/encryption.errors.js';
import { validateEncryptedData } from '../common/guards/encryption.guards.js';
import { EncryptedData } from '../common/interfaces/encryption.interfaces.js';
import { KeyPair } from '../common/interfaces/keys.interfaces.js';
import { Base64 } from '../common/types/branded-types.types.js';
import { KeyDerivation } from '../utils/key-derivation.utils.js';
import { Serialization } from '../utils/serialization.utils.js';
import { MLKEMAlgorithm } from './asymmetric/implementations/post-quantom/ml-kem-alg.js';
import {
  AES_GCM_STATS,
  DEFAULT_ENCRYPTION_OPTIONS,
  ML_KEM_STATS,
} from './constants/defaults.constants.js';
import { AsymmetricAlgorithm } from './interfaces/asymmetric-alg.interfaces.js';
import { AEADParams, SymmetricAlgorithm } from './interfaces/symmetric-alg.interfaces.js';
import { AESGCMAlgorithm } from './symmetric/implementations/aes-gcm-alg.js';

/**
 * Modern Hybrid Encryption implementation using KEM + AEAD approach
 * Replaces legacy RSA-based encryption with post-quantum secure algorithms
 */
export class HybridEncryption {
  private asymmetricAlgorithm: AsymmetricAlgorithm;
  private symmetricAlgorithm: SymmetricAlgorithm;

  constructor(public readonly preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset) {
    // Initialize asymmetric algorithm based on preset
    this.asymmetricAlgorithm =
      preset === Preset.NORMAL ? new MLKEMAlgorithm() : new MLKEMAlgorithm(Preset.HIGH_SECURITY);

    // Use AES-GCM as the symmetric algorithm for all presets
    this.symmetricAlgorithm = new AESGCMAlgorithm(preset);
  }

  /**
   * Validate a modern key pair for correctness and security
   *
   * @param keyPair - Key pair to validate
   * @returns True if key pair is valid
   */
  static validateKeyPair(keyPair: KeyPair): boolean {
    try {
      // Validate that keyPair exists and has required properties
      if (!keyPair || typeof keyPair !== 'object') {
        return false;
      }

      // Check for required properties
      if (!keyPair.publicKey || !keyPair.secretKey) {
        return false;
      }

      // Validate that keys are Uint8Arrays with expected lengths
      if (
        !(keyPair.publicKey instanceof Uint8Array) ||
        !(keyPair.secretKey instanceof Uint8Array)
      ) {
        return false;
      }

      // Basic length validation for ML-KEM keys using constants
      const { publicKey: pk, secretKey: sk, metadata } = keyPair;
      const hasValidPkLength = pk.length === ML_KEM_STATS.publicKeyLength[metadata.preset];
      const hasValidSkLength = sk.length === ML_KEM_STATS.secretKeyLength[metadata.preset];

      return hasValidPkLength && hasValidSkLength;
    } catch (error) {
      return false;
    }
  }

  /**
   * Instance method for encryption with specific registry configuration
   */
  encrypt(data: any, publicKey: Uint8Array): EncryptedData {
    try {
      // Validate inputs
      // Note: null and undefined are valid JSON values, so we don't reject them

      if (!publicKey || !(publicKey instanceof Uint8Array)) {
        throw createAppropriateError('Public key must be a valid Uint8Array', {
          errorType: 'validation',
          preset: this.preset,
          operation: 'encrypt',
        });
      }

      // Validate public key length using constants - use AlgorithmAsymmetricError for key issues
      const expectedLength = ML_KEM_STATS.publicKeyLength[this.preset];
      if (publicKey.length !== expectedLength) {
        throw createAppropriateError(
          `Invalid ML-KEM-${this.preset === Preset.NORMAL ? '768' : '1024'} public key length`,
          {
            errorType: 'algorithm-asymmetric',
            preset: this.preset,
            operation: 'encrypt',
          },
        );
      }

      // Step 1: Serialize data to binary format
      // 🧪 Needs to be Tested - Check all possible edge cases
      const serializedData = this.serializeData(data);

      // console.log('Step 1: Serialized Data: ', serializedData);

      // Step 2: Get algorithms from registries
      // 🧪 Needs to be Tested - Check if they are loaded correctly
      const asymmetric = this.asymmetricAlgorithm;
      const symmetric = this.symmetricAlgorithm;

      // Step 3: Generate shared secret & Ciphertext using KEM
      // 🧪 Needs to be Tested - Check that they have the correct length based on pre
      const { sharedSecret, cipherText: kemCipherText } = asymmetric.createSharedSecret(publicKey);

      // console.log('Step 3: KEM Shared Secret: ', sharedSecret);
      // console.log('Step 3: KEM Cipher Text: ', kemCipherText);

      // Step 4: Use the Shared Secret to create the Symmetric key
      const derivedKey = KeyDerivation.deriveKey(this.preset, sharedSecret);

      // console.log('Step 4: Derived Key: ', derivedKey);

      // Step 5: Create KeyMaterial (Key + Nonce) object for symmetric algorithm
      const nonceSize = AES_GCM_STATS.nonceLength[this.preset];
      const keyMaterial: AEADParams = {
        key: derivedKey,
        nonce: randomBytes(nonceSize), // AES-GCM nonce size based on preset
      };

      // console.log('Step 5: Key Material: ', keyMaterial);

      // Step 6: Encrypt data with AES-GCM algorithm
      const { encryptedData, nonce } = symmetric.encrypt(serializedData, keyMaterial);

      // console.log('Step 6: Encrypted Data: ', encryptedData);
      // console.log('Step 6: Nonce: ', nonce);

      // Step 7: Construct result with algorithm metadata
      const result: EncryptedData = {
        preset: this.preset,
        encryptedContent: this.encodeBase64(encryptedData),
        cipherText: this.encodeBase64(kemCipherText),
        nonce: this.encodeBase64(nonce),
      };

      // console.log('Step 7: Encrypted Data Structure: ', result);

      // Validate result structure
      const validation = validateEncryptedData(result);
      if (!validation.isValid) {
        console.log('[Encryption Validation Errors: ', validation.errors);
        throw createAppropriateError('Generated encrypted data is invalid', {
          preset: this.preset,
          errorType: 'validation',
          operation: 'encrypt',
          cause: new Error(validation.errors.join(', ')),
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Instance method for decryption with specific registry configuration
   */
  decrypt<T = any>(encryptedData: EncryptedData, privateKey: Uint8Array): T {
    try {
      // Validate encrypted data structure
      const validation = validateEncryptedData(encryptedData);
      if (!validation.isValid) {
        throw createAppropriateError(
          `Invalid encrypted data format: ${validation.errors.join(', ')}`,
          {
            errorType: 'validation',
            preset: this.preset,
            operation: 'decrypt',
          },
        );
      }

      // Validate inputs
      if (!privateKey || !(privateKey instanceof Uint8Array)) {
        throw createAppropriateError('Private key must be a valid Uint8Array', {
          errorType: 'validation',
          preset: this.preset,
          operation: 'decrypt',
        });
      }

      // Validate private key length using constants - use AlgorithmAsymmetricError for key issues
      const expectedLength = this.preset === Preset.NORMAL ? 2400 : 3168;
      if (privateKey.length !== expectedLength) {
        throw createAppropriateError(
          `Invalid ML-KEM-${this.preset === Preset.NORMAL ? '768' : '1024'} secret key length`,
          {
            errorType: 'algorithm-asymmetric',
            preset: this.preset,
            operation: 'decrypt',
          },
        );
      }

      // Step 1: Get algorithms from registries based on metadata
      const asymmetric = this.asymmetricAlgorithm;
      const symmetric = this.symmetricAlgorithm;

      // Step 2: Decode binary data: Base64 -> Uint8Array
      const cipherText = this.decodeBase64(encryptedData.cipherText as Base64);
      const encryptedContent = this.decodeBase64(encryptedData.encryptedContent as Base64);
      const nonce = this.decodeBase64(encryptedData.nonce as Base64);

      // Step 3: Recover shared secret from KEM key material
      const sharedSecret = asymmetric.recoverSharedSecret(cipherText, privateKey);

      const derivedKey = KeyDerivation.deriveKey(this.preset, sharedSecret);

      // Step 6: Decrypt with symmetric algorithm
      const decryptionResult = symmetric.decrypt(this.preset, encryptedContent, derivedKey, nonce);

      // Step 7: Deserialize data to original format
      const deserializedData = this.deserializeData<T>(decryptionResult);

      return deserializedData;
    } catch (error) {
      if (error instanceof EncryptionError) {
        throw error;
      } else {
        throw createAppropriateError(
          `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            preset: this.preset,
            errorType: 'operation',
            operation: 'decrypt',
            cause: error instanceof Error ? error : undefined,
          },
        );
      }
    }
  }

  /**
   * Instance method for decryption with grace period support
   */
  decryptWithGracePeriod<T = any>(encryptedData: EncryptedData, privateKeys: Uint8Array[]): T {
    if (!privateKeys || privateKeys.length === 0) {
      createAppropriateError('At least one private key must be provided', {
        preset: this.preset,
        errorType: 'operation',
        operation: 'decrypt',
      });
      throw new EncryptionError('At least one private key must be provided', undefined, 'decrypt');
    }

    // Try each key until one works (primary key first, then fallback keys)
    let lastError: Error | null = null;

    for (let i = 0; i < privateKeys.length; i++) {
      try {
        const result = this.decrypt<T>(encryptedData, privateKeys[i]);

        // Log successful fallback if not using primary key
        if (i > 0) {
          console.log(`🔄 Decryption successful with fallback key ${i} during grace period`);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown decryption error');

        // Continue to next key if available
        if (i < privateKeys.length - 1) {
          console.log(`⚠️ Decryption failed with key ${i}, trying next key...`);
          continue;
        }
      }
    }

    // All keys failed, throw the last error
    throw createAppropriateError(
      `Grace period decryption failed with all ${privateKeys.length} available keys: ${lastError?.message}`,
      {
        preset: this.preset,
        errorType: 'operation',
        operation: 'decrypt',
        cause: lastError instanceof Error ? lastError : undefined,
      },
    );
  }

  private serializeData(data: any): Uint8Array {
    try {
      return Serialization.serializeForEncryption(data);
    } catch (error) {
      throw new FormatConversionError(
        `Data serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        typeof data,
        'Uint8Array',
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private deserializeData<T>(data: Uint8Array): T {
    try {
      return Serialization.deserializeFromDecryption<T>(data);
    } catch (error) {
      throw new FormatConversionError(
        `Data deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Uint8Array',
        'object',
        data.length,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private encodeBase64(data: Uint8Array): Base64 {
    return Serialization.encodeBase64(data) as Base64;
  }

  private decodeBase64(data: Base64): Uint8Array {
    return Serialization.decodeBase64(data);
  }
}
