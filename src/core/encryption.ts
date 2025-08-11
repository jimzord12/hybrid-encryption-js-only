import { gcm } from '@noble/ciphers/aes';
import forge from 'node-forge';
import {
  EncryptedData,
  EncryptionOptions,
  ForgePaddingType,
  RSAKeyPair,
} from '../types/core.types';
import { forgePadding } from './constants';
import { fromBase64, toBase64 } from './utils/conversion.util';
import { getRandomBytes } from './utils/generation.util';

export class HybridEncryption {
  private static readonly DEFAULT_OPTIONS: Required<EncryptionOptions> = {
    keySize: 256,
    rsaPadding: 'OAEP',
  };

  private static readonly VERSION = '1.0.0';

  /**
   * Encrypt data using hybrid AES-GCM + RSA approach
   * @param data - Data to encrypt (will be JSON stringified)
   * @param publicKeyPem - RSA public key in PEM format
   * @param options - Encryption options
   */
  static encrypt(data: any, publicKeyPem: string, options: EncryptionOptions = {}): EncryptedData {
    if (!publicKeyPem) {
      throw new Error('Public key is required for encryption');
    }

    if (data == null) {
      throw new Error('Invalid data: Data must be a non-null object');
    }

    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      // Check the data's size

      // Step 1: Serialize data to JSON string
      const jsonString = JSON.stringify(data);
      const dataBytes = new TextEncoder().encode(jsonString);

      // Step 2: Generate AES key and IV
      const aesKeySize = opts.keySize / 8; // Convert bits to bytes
      const aesKey = getRandomBytes(aesKeySize);
      const iv = getRandomBytes(12); // 96-bit IV for GCM

      // Step 3: Encrypt data with AES-GCM
      const aesGcm = gcm(aesKey, iv);
      const encryptedContent = aesGcm.encrypt(dataBytes);

      // Extract cipherText and auth tag from AES-GCM result
      const cipherText = encryptedContent.slice(0, -16); // All but last 16 bytes
      const authTag = encryptedContent.slice(-16); // Last 16 bytes

      // Step 4: Encrypt AES key with RSA
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const paddingScheme = opts.rsaPadding === 'OAEP' ? forgePadding.OAEP : forgePadding.PKCS1;
      const encryptedAESKey = publicKey.encrypt(
        forge.util.binary.raw.encode(aesKey),
        paddingScheme as ForgePaddingType
      );

      // Step 5: Return encrypted data structure
      return {
        encryptedContent: toBase64(cipherText),
        encryptedAESKey: toBase64(encryptedAESKey),
        iv: toBase64(iv),
        authTag: toBase64(authTag),
        version: this.VERSION,
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt data using hybrid AES-GCM + RSA approach
   * @param encryptedData - Encrypted data structure
   * @param privateKeyPem - RSA private key in PEM format
   * @param options - Decryption options
   */
  static decrypt<T = any>(
    encryptedData: EncryptedData,
    privateKeyPem: string,
    options: EncryptionOptions = {}
  ): T {
    if (!privateKeyPem) {
      throw new Error('Private key is required for decryption');
    }

    if (encryptedData == null) {
      throw new Error('Encrypted data is required for decryption');
    }

    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };

      // Step 1: Validate version compatibility
      if (encryptedData.version !== this.VERSION) {
        throw new Error(`Unsupported version: ${encryptedData.version}`);
      }

      // Step 2: Decrypt AES key with RSA
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const paddingScheme = opts.rsaPadding === 'OAEP' ? forgePadding.OAEP : forgePadding.PKCS1;
      const encryptedAESKeyBytes = forge.util.decode64(encryptedData.encryptedAESKey);
      const aesKeyRaw = privateKey.decrypt(encryptedAESKeyBytes, paddingScheme as ForgePaddingType);
      const aesKey = new Uint8Array(forge.util.binary.raw.decode(aesKeyRaw));

      // Step 3: Prepare AES-GCM decryption
      const iv = fromBase64(encryptedData.iv);
      const ciphertext = fromBase64(encryptedData.encryptedContent);
      const authTag = fromBase64(encryptedData.authTag);

      // Combine ciphertext and auth tag as expected by noble-ciphers
      const combinedCiphertext = new Uint8Array(ciphertext.length + authTag.length);
      combinedCiphertext.set(ciphertext, 0);
      combinedCiphertext.set(authTag, ciphertext.length);

      // Step 4: Decrypt content with AES-GCM
      const aesGcm = gcm(aesKey, iv);
      const decryptedBytes = aesGcm.decrypt(combinedCiphertext);

      // Step 5: Parse JSON and return typed result
      const jsonString = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate that RSA key pair works correctly
   * @param keyPair - RSA key pair to test
   */
  static validateKeyPair(keyPair: RSAKeyPair): boolean {
    try {
      const testData = { test: 'validation', timestamp: Date.now() };

      // Test encryption/decryption round trip
      const encrypted = this.encrypt(testData, keyPair.publicKey);
      const decrypted = this.decrypt(encrypted, keyPair.privateKey);

      return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a key pair has expired
   * @param keyPair - RSA key pair to check
   */
  static isKeyPairExpired(keyPair: RSAKeyPair): boolean {
    if (!keyPair.expiresAt) return false;
    return new Date() > keyPair.expiresAt;
  }
}
