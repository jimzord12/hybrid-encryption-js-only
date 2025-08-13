/**
 * Modern Hybrid Encryption Class - Version 2.0.0
 *
 * This class implements the modernized hybrid encryption system using:
 * - KEM (Key Encapsulation Mechanism) in      // Step 5: Encrypt data with AEAD algorithm
      const encryptionResult = symmetricAlg.encrypt(serializedData, keyMaterial);

      // Step 6: Construct result with algorithm metadata
      const result: ModernEncryptedData = {
        algorithms: {
          asymmetric: finalOptions.asymmetricAlgorithm,
          symmetric: finalOptions.symmetricAlgorithm,
          kdf: finalOptions.keyDerivation,
        },
        encryptedContent: this.encodeBase64(encryptionResult.encryptedData),
        keyMaterial: this.encodeBase64(kemKeyMaterial),
        nonce: this.encodeBase64(encryptionResult.nonce),
        version: finalOptions.version,
      };

      // Add optional fields only if they exist
      if (encryptionResult.authData) {
        result.authTag = this.encodeBase64(encryptionResult.authData);
      }erial: this.encodeBase64(kemKeyMaterial),f RSA
 * - AEAD (Authen      // Step 5: Decrypt and verify with AEAD algorithm
      const decryptionResult = symmetricAlg.decrypt(
        encryptedContent,
        keyMaterial,
        authData
      );ncryption with Associated Data) for symmetric encryption
 * - HKDF for key derivation
 * - Algorithm-agnostic design with pluggable algorithms
 */

import { hkdf } from '@noble/hashes/hkdf';
import { sha256, sha512 } from '@noble/hashes/sha2';
import { randomBytes } from '@noble/hashes/utils';
import { DEFAULT_MODERN_OPTIONS } from '../constants.js';
import {
  AlgorithmNotFoundError,
  CryptographicOperationError,
  FormatConversionError,
  KeyValidationError,
  ModernEncryptionError,
} from '../errors/index.js';
import {
  isModernEncryptedData,
  validateModernEncryptedData,
  validateModernKeyPair,
} from '../guards/index.js';
import type {
  ModernEncryptedData,
  ModernEncryptionOptions,
  ModernKeyPair,
} from '../types/modern-encryption.types.js';
import { AlgorithmRegistry } from './algorithm-registry.js';
import { AsymmetricAlgorithm } from './asymmetric/base.js';
import { SymmetricAlgorithm } from './symmetric/base.js';
import type { KeyMaterial } from './types.js';

/**
 * Modern Hybrid Encryption implementation using KEM + AEAD approach
 * Replaces legacy RSA-based encryption with post-quantum secure algorithms
 */
export class ModernHybridEncryption {
  private static readonly VERSION = '2.0.0';

  constructor(
    private readonly asymmetricRegistry: AlgorithmRegistry<AsymmetricAlgorithm>,
    private readonly symmetricRegistry: AlgorithmRegistry<SymmetricAlgorithm>,
    private readonly defaultOptions: Required<
      Omit<ModernEncryptionOptions, 'associatedData' | 'metadata'>
    >,
  ) {}

  /**
   * Static factory method to create with default registries
   */
  static async createDefault(): Promise<ModernHybridEncryption> {
    const { asymmetricRegistry, symmetricRegistry } = await import('./algorithm-registry.js');
    return new ModernHybridEncryption(asymmetricRegistry, symmetricRegistry, {
      asymmetricAlgorithm: DEFAULT_MODERN_OPTIONS.asymmetricAlgorithm,
      symmetricAlgorithm: DEFAULT_MODERN_OPTIONS.symmetricAlgorithm,
      keyDerivation: DEFAULT_MODERN_OPTIONS.keyDerivation,
      keySize: DEFAULT_MODERN_OPTIONS.keySize,
    });
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
  static async encrypt(
    data: any,
    publicKey: Uint8Array,
    options?: ModernEncryptionOptions,
  ): Promise<ModernEncryptedData> {
    const instance = await ModernHybridEncryption.createDefault();
    return instance.encrypt(data, publicKey, options);
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
  static async decrypt<T = any>(
    encryptedData: ModernEncryptedData,
    privateKey: Uint8Array,
    options?: ModernEncryptionOptions,
  ): Promise<T> {
    const instance = await ModernHybridEncryption.createDefault();
    return instance.decrypt<T>(encryptedData, privateKey, options);
  }

  /**
   * Validate a modern key pair for correctness and security
   *
   * @param keyPair - Key pair to validate
   * @returns True if key pair is valid
   */
  static validateKeyPair(keyPair: ModernKeyPair): boolean {
    try {
      const validation = validateModernKeyPair(keyPair);
      return validation.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Instance method for encryption with specific registry configuration
   */
  encrypt(
    data: any,
    publicKey: Uint8Array,
    options?: ModernEncryptionOptions,
  ): ModernEncryptedData {
    try {
      // Merge options with defaults
      const finalOptions = {
        ...this.defaultOptions,
        ...options,
      };

      // Validate inputs
      this.validateEncryptionInputs(data, publicKey, finalOptions);

      // Step 1: Serialize data to binary format
      const serializedData = this.serializeData(data);

      // Step 2: Get algorithms from registries
      const asymmetricAlg = this.getAsymmetricAlgorithm(finalOptions.asymmetricAlgorithm);
      const symmetricAlg = this.getSymmetricAlgorithm(finalOptions.symmetricAlgorithm);

      // Step 3: Generate shared secret using KEM
      const { sharedSecret, cipherText: kemCipherText } =
        asymmetricAlg.createSharedSecret(publicKey);

      // Step 4: Derive symmetric key using HKDF
      const keyMaterial = this.deriveKeyMaterial(
        sharedSecret,
        finalOptions.keySize,
        finalOptions.keyDerivation,
        serializedData,
        options?.associatedData,
      );

      // Step 5: Encrypt data with AEAD algorithm
      const encryptionResult = symmetricAlg.encrypt(serializedData, keyMaterial);

      // Step 6: Construct result with algorithm metadata
      const result: ModernEncryptedData = {
        algorithms: {
          asymmetric: finalOptions.asymmetricAlgorithm,
          symmetric: finalOptions.symmetricAlgorithm,
          kdf: finalOptions.keyDerivation,
        },
        encryptedContent: this.encodeBase64(encryptionResult.encryptedData),
        keyMaterial: this.encodeBase64(kemCipherText),
        nonce: this.encodeBase64(encryptionResult.nonce),
        version: ModernHybridEncryption.VERSION,
      };

      // Add optional fields only if they exist
      if (encryptionResult.authData) {
        result.authTag = this.encodeBase64(encryptionResult.authData);
      }

      if (options?.metadata) {
        result.metadata = options.metadata;
      }

      // Validate result structure
      const validation = validateModernEncryptedData(result);
      if (!validation.isValid) {
        throw new ModernEncryptionError(
          `Generated encrypted data is invalid: ${validation.errors.join(', ')}`,
          finalOptions.asymmetricAlgorithm,
          'encrypt',
        );
      }

      return result;
    } catch (error) {
      if (error instanceof ModernEncryptionError) {
        throw error;
      }
      throw new CryptographicOperationError(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'encrypt',
        options?.asymmetricAlgorithm,
        undefined,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Instance method for decryption with specific registry configuration
   */
  decrypt<T = any>(
    encryptedData: ModernEncryptedData,
    privateKey: Uint8Array,
    options?: ModernEncryptionOptions,
  ): T {
    try {
      // Validate encrypted data structure
      const validation = validateModernEncryptedData(encryptedData);
      if (!validation.isValid) {
        throw new ModernEncryptionError(
          `Invalid encrypted data format: ${validation.errors.join(', ')}`,
          undefined,
          'decrypt',
        );
      }

      // Validate inputs
      this.validateDecryptionInputs(encryptedData, privateKey);

      // Step 1: Get algorithms from registries based on metadata
      const asymmetricAlg = this.getAsymmetricAlgorithm(encryptedData.algorithms.asymmetric);
      const symmetricAlg = this.getSymmetricAlgorithm(encryptedData.algorithms.symmetric);

      // Step 2: Decode binary data
      const kemKeyMaterial = this.decodeBase64(encryptedData.keyMaterial);
      const encryptedContent = this.decodeBase64(encryptedData.encryptedContent);
      const nonce = this.decodeBase64(encryptedData.nonce);

      // Step 3: Recover shared secret from KEM key material
      const sharedSecret = asymmetricAlg.recoverSharedSecret(kemKeyMaterial, privateKey);

      // Step 4: Derive symmetric key using same parameters as encryption
      const keySize = this.getKeySizeFromAlgorithm(encryptedData.algorithms.symmetric);
      const keyMaterial = this.deriveKeyMaterial(
        sharedSecret,
        keySize,
        encryptedData.algorithms.kdf,
        encryptedContent, // Use encrypted content for info parameter
        options?.associatedData,
      );

      // Step 5: Create KeyMaterial object with nonce
      const keyMaterialWithNonce: KeyMaterial = {
        key: keyMaterial,
        nonce: nonce,
      };

      // Step 6: Decrypt with symmetric algorithm
      const decryptionResult = symmetricAlg.decrypt(encryptedContent, keyMaterialWithNonce);

      // Step 7: Deserialize data to original format
      const deserializedData = this.deserializeData<T>(decryptionResult);

      return deserializedData;
    } catch (error) {
      if (error instanceof ModernEncryptionError) {
        throw error;
      }
      throw new CryptographicOperationError(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'decrypt',
        encryptedData?.algorithms?.asymmetric,
        undefined,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Private helper methods

  private validateEncryptionInputs(
    data: any,
    publicKey: Uint8Array,
    options: Required<Omit<ModernEncryptionOptions, 'associatedData' | 'metadata'>>,
  ): void {
    if (data == null) {
      throw new ModernEncryptionError('Data cannot be null or undefined', undefined, 'encrypt');
    }

    if (!(publicKey instanceof Uint8Array) || publicKey.length === 0) {
      throw new KeyValidationError(
        'Public key must be a non-empty Uint8Array',
        'public',
        options.asymmetricAlgorithm,
      );
    }

    if (!this.asymmetricRegistry.has(options.asymmetricAlgorithm)) {
      throw new AlgorithmNotFoundError(options.asymmetricAlgorithm, 'asymmetric', [
        ...this.asymmetricRegistry.list('asymmetric'),
      ]);
    }

    if (!this.symmetricRegistry.has(options.symmetricAlgorithm)) {
      throw new AlgorithmNotFoundError(options.symmetricAlgorithm, 'symmetric', [
        ...this.symmetricRegistry.list('symmetric'),
      ]);
    }
  }

  private validateDecryptionInputs(
    encryptedData: ModernEncryptedData,
    privateKey: Uint8Array,
  ): void {
    if (!isModernEncryptedData(encryptedData)) {
      throw new ModernEncryptionError('Invalid encrypted data format', undefined, 'decrypt');
    }

    if (!(privateKey instanceof Uint8Array) || privateKey.length === 0) {
      throw new KeyValidationError(
        'Private key must be a non-empty Uint8Array',
        'private',
        encryptedData.algorithms.asymmetric,
      );
    }

    if (encryptedData.version !== ModernHybridEncryption.VERSION) {
      throw new ModernEncryptionError(
        `Unsupported encrypted data version: ${encryptedData.version}. Expected: ${ModernHybridEncryption.VERSION}`,
        undefined,
        'decrypt',
      );
    }
  }

  private getAsymmetricAlgorithm(algorithmId: string): AsymmetricAlgorithm {
    try {
      return this.asymmetricRegistry.get(algorithmId);
    } catch (error) {
      throw new AlgorithmNotFoundError(algorithmId, 'asymmetric', [
        ...this.asymmetricRegistry.list('asymmetric'),
      ]);
    }
  }

  private getSymmetricAlgorithm(algorithmId: string): SymmetricAlgorithm {
    try {
      return this.symmetricRegistry.get(algorithmId);
    } catch (error) {
      throw new AlgorithmNotFoundError(algorithmId, 'symmetric', [
        ...this.symmetricRegistry.list('symmetric'),
      ]);
    }
  }

  private deriveKeyMaterial(
    sharedSecret: Uint8Array,
    keySize: number,
    kdfAlgorithm: string,
    info: Uint8Array,
    associatedData?: Uint8Array,
  ): any {
    try {
      // Generate random salt for each operation
      const salt = randomBytes(32);

      // Combine info and associated data if provided
      let derivationInfo = info;
      if (associatedData) {
        const combined = new Uint8Array(info.length + associatedData.length);
        combined.set(info);
        combined.set(associatedData, info.length);
        derivationInfo = combined;
      }

      // Derive key using HKDF
      let derivedKey: Uint8Array;
      const keyLengthBytes = Math.ceil(keySize / 8);

      if (kdfAlgorithm === 'HKDF-SHA256') {
        derivedKey = hkdf(sha256, sharedSecret, salt, derivationInfo, keyLengthBytes);
      } else if (kdfAlgorithm === 'HKDF-SHA512') {
        derivedKey = hkdf(sha512, sharedSecret, salt, derivationInfo, keyLengthBytes);
      } else {
        throw new ModernEncryptionError(
          `Unsupported KDF algorithm: ${kdfAlgorithm}`,
          undefined,
          'key-derivation',
        );
      }

      // Return key material in format expected by symmetric algorithms
      return {
        key: derivedKey,
        salt,
        info: derivationInfo,
      };
    } catch (error) {
      throw new CryptographicOperationError(
        `Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'key-generation',
        kdfAlgorithm,
        sharedSecret.length,
        keySize,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private getKeySizeFromAlgorithm(algorithmId: string): number {
    // Extract key size from algorithm identifier
    const match = algorithmId.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Default key sizes for known algorithms
    switch (algorithmId) {
      case 'AES-GCM-256':
        return 256;
      case 'AES-GCM-192':
        return 192;
      case 'AES-GCM-128':
        return 128;
      case 'ChaCha20-Poly1305':
        return 256;
      default:
        return this.defaultOptions.keySize;
    }
  }

  private serializeData(data: any): Uint8Array {
    try {
      if (data instanceof Uint8Array) {
        return data;
      }

      const jsonString = JSON.stringify(data);
      return new TextEncoder().encode(jsonString);
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
      const jsonString = new TextDecoder().decode(data);
      return JSON.parse(jsonString) as T;
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

  private encodeBase64(data: Uint8Array): string {
    try {
      // Use Buffer for Node.js environment
      return Buffer.from(data).toString('base64');
    } catch (error) {
      throw new FormatConversionError(
        `Base64 encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Uint8Array',
        'base64',
        data.length,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private decodeBase64(data: string): Uint8Array {
    try {
      // Use Buffer for Node.js environment
      return new Uint8Array(Buffer.from(data, 'base64'));
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
