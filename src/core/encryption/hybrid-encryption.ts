import { randomBytes } from '@noble/hashes/utils.js';
import { DEFAULT_ENCRYPTION_OPTIONS } from '../constants.js';
import { Preset } from '../enums/index.js';
import { createAppropriateError, EncryptionError, FormatConversionError } from '../errors/index.js';

import { validateEncryptedData } from '../guards/encryption.guards.js';

import { KeyPair } from '../interfaces/common/index.interface.js';
import { AsymmetricAlgorithm } from '../interfaces/encryption/asymmetric-alg.interface.js';
import {
  AEADParams,
  SymmetricAlgorithm,
} from '../interfaces/encryption/symmetric-alg.interface.js';
import { Base64 } from '../types/branded-types.types.js';
import type { EncryptedData } from '../types/encryption.types.js';
import { KeyDerivation } from '../utils/key-derivation.util.js';
import { Serialization } from '../utils/serialization.util.js';
import { MLKEMAlgorithm } from './asymmetric/implementations/post-quantom/ml-kem-alg.js';
import { AESGCMAlgorithm } from './symmetric/implementations/aes-gcm-alg.js';

/**
 * Modern Hybrid Encryption implementation using KEM + AEAD approach
 * Replaces legacy RSA-based encryption with post-quantum secure algorithms
 */
export class HybridEncryption {
  private asymmetricAlgorithm: AsymmetricAlgorithm;
  private symmetricAlgorithm: SymmetricAlgorithm;

  constructor(public readonly preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset) {
    this.asymmetricAlgorithm =
      preset === Preset.DEFAULT ? new MLKEMAlgorithm() : new MLKEMAlgorithm(Preset.HIGH_SECURITY);
    this.symmetricAlgorithm = new AESGCMAlgorithm();
  }

  /**
   * Static factory method to create with default registries
   */
  static async createDefault(): Promise<HybridEncryption> {
    return new HybridEncryption();
  }

  /**
   * Encrypt data using modern KEM-based hybrid encryption
   *
   * Workflow:
   * 1. Serialize data to binary format
   * 2. Get algorithms from registries based on options
   * 3. Generate shared secret using KEM
   * 4. Derive symmetric key using HKDF
   * 5. Encrypt data with AEAD algorithm
   * 6. Return structured encrypted data
   *
   * @param data - Data to encrypt (any serializable type)
   * @param publicKey - Public key in binary format
   * @param options - Encryption options (algorithms, key size, etc.)
   * @returns Encrypted data with algorithm metadata
   */
  static async encrypt(data: any, publicKey: Uint8Array): Promise<EncryptedData> {
    const instance = await HybridEncryption.createDefault();
    return instance.encrypt(data, publicKey);
  }

  /**
   * Decrypt data using algorithm information embedded in encrypted data
   *
   * Workflow:
   * 1. Parse algorithm identifiers from encrypted data
   * 2. Get algorithms from registries
   * 3. Recover shared secret from KEM ciphertext
   * 4. Derive symmetric key using HKDF
   * 5. Decrypt and verify with AEAD algorithm
   * 6. Deserialize and return typed result
   *
   * @param encryptedData - Encrypted data with algorithm metadata
   * @param privateKey - Private key in binary format
   * @param options - Decryption options (optional, mainly for validation)
   * @returns Decrypted data in original type
   */
  static async decrypt<T = any>(encryptedData: EncryptedData, privateKey: Uint8Array): Promise<T> {
    const instance = await HybridEncryption.createDefault();
    return instance.decrypt<T>(encryptedData, privateKey);
  }

  /**
   * Decrypt data with grace period support during key rotation
   *
   * Workflow:
   * 1. Try decryption with provided private key
   * 2. If decryption fails and fallback keys are provided:
   *    - Attempt decryption with fallback keys
   *    - Return successful result or throw authentication error
   *
   * @param encryptedData - Data to decrypt
   * @param privateKeys - Primary private key and optional fallback keys
   * @param options - Decryption options (optional)
   * @returns Decrypted data in original type
   */
  static async decryptWithGracePeriod<T = any>(
    encryptedData: EncryptedData,
    privateKeys: Uint8Array[],
  ): Promise<T> {
    const instance = await HybridEncryption.createDefault();
    return instance.decryptWithGracePeriod<T>(encryptedData, privateKeys);
  }

  /**
   * Validate a modern key pair for correctness and security
   *
   * @param keyPair - Key pair to validate
   * @returns True if key pair is valid
   */
  static validateKeyPair(keyPair: KeyPair): boolean {
    try {
      return this.validateKeyPair(keyPair);
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
      // TODO: Create Validations for Input
      console.log('Data to Encrypt: ', data);
      console.log('Public Key: ', publicKey);

      // Step 1: Serialize data to binary format
      // 🧪 Needs to be Tested - Check all possible edge cases
      const serializedData = this.serializeData(data);

      console.log('Step 1: Serialized Data: ', serializedData);

      // Step 2: Get algorithms from registries
      // 🧪 Needs to be Tested - Check if they are loaded correctly
      const asymmetric = this.asymmetricAlgorithm;
      const symmetric = this.symmetricAlgorithm;

      // Step 3: Generate shared secret & Ciphertext using KEM
      // 🧪 Needs to be Tested - Check that they have the correct length based on pre
      const { sharedSecret, cipherText: kemCipherText } = asymmetric.createSharedSecret(publicKey);

      console.log('Step 3: KEM Shared Secret: ', sharedSecret);
      console.log('Step 3: KEM Cipher Text: ', kemCipherText);

      // Step 4: Use the Shared Secret to create the Symmetric key
      const derivedKey = KeyDerivation.deriveKey(this.preset, sharedSecret);

      console.log('Step 4: Derived Key: ', derivedKey);

      // Step 5: Create KeyMaterial (Key + Nonce) object for symmetric algorithm
      const keyMaterial: AEADParams = {
        key: derivedKey,
        nonce: randomBytes(12), // AES-GCM standard nonce size
      };

      console.log('Step 5: Key Material: ', keyMaterial);

      // Step 6: Encrypt data with AES-GCM algorithm
      const { encryptedData, nonce } = symmetric.encrypt(serializedData, keyMaterial);

      console.log('Step 6: Encrypted Data: ', encryptedData);
      console.log('Step 6: Nonce: ', nonce);

      // Step 7: Construct result with algorithm metadata
      const result: EncryptedData = {
        preset: this.preset,
        encryptedContent: this.encodeBase64(encryptedData),
        cipherText: this.encodeBase64(kemCipherText),
        nonce: this.encodeBase64(nonce),
      };

      console.log('Step 7: Encrypted Data Structure: ', result);

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
      if (error instanceof EncryptionError) {
        throw error;
      }
      throw createAppropriateError('Encryption failed', {
        preset: this.preset,
        errorType: 'operation',
        operation: 'encrypt',
        cause: error instanceof Error ? error : undefined,
      });
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
        createAppropriateError(`Invalid encrypted data format: ${validation.errors.join(', ')}`, {
          errorType: 'validation',
          preset: this.preset,
          operation: 'decrypt',
        });
      }

      // Validate inputs
      // TODO: Create Validation for Inputs

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
    try {
      return Serialization.encodeBase64(data);
    } catch (error) {
      throw createAppropriateError('Base64 encoding failed', {
        preset: this.preset,
        errorType: 'operation',
        operation: 'encodeBase64',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private decodeBase64(data: Base64): Uint8Array {
    try {
      return Serialization.decodeBase64(data);
    } catch (error) {
      throw new FormatConversionError(
        `Base64 decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'base64',
        'Uint8Array',
        data.length,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
