/**
 * @fileoverview Type definitions for the Client Encryption Module
 *
 * This module provides client-side hybrid encryption capabilities using
 * ML-KEM (post-quantum) asymmetric encryption combined with AES-GCM symmetric encryption.
 *
 * @author Hybrid Encryption Library Team
 * @version 1.0.0
 */

import { Preset } from '../core/common/enums';
import { EncryptedData } from '../core/common/interfaces/encryption.interfaces';
import { HybridEncryption } from '../core/encryption';

/**
 * Client-side encryption class implementing the Singleton pattern.
 *
 * This class provides a high-level interface for encrypting data using hybrid
 * cryptography. It ensures consistent encryption configuration across your
 * application through the singleton pattern.
 *
 * @example
 * ```typescript
 * import { ClientEncryption, Preset } from 'hybrid-encryption-library/client';
 *
 * const encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
 * const encrypted = encryption.encryptData(userData, publicKey);
 * ```
 */
export declare class ClientEncryption {
  /**
   * The singleton instance of ClientEncryption.
   * @private
   */
  private static instance: ClientEncryption | null;

  /**
   * Flag to control instantiation during singleton creation.
   * @private
   */
  private static isInstantiating: boolean;

  /**
   * The hybrid encryption engine instance.
   * @private
   */
  private encryptionInstance: HybridEncryption | null;

  /**
   * The security preset being used.
   * @private
   */
  private preset: Preset | null;

  /**
   * Private constructor to enforce singleton pattern.
   *
   * @param preset - The security preset to use for encryption
   * @throws {Error} When called directly instead of through getInstance()
   * @private
   */
  private constructor(preset?: Preset);

  /**
   * Gets or creates the singleton instance of ClientEncryption.
   *
   * This method ensures that only one instance of ClientEncryption exists
   * throughout the application lifecycle. If called multiple times with
   * different presets, the first preset will be used.
   *
   * @param preset - The security preset to use (defaults to NORMAL)
   * @returns The singleton ClientEncryption instance
   *
   * @example
   * ```typescript
   * // Default preset (NORMAL)
   * const encryption = ClientEncryption.getInstance();
   *
   * // High security preset
   * const encryptionHS = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
   *
   * // Both variables reference the same instance
   * console.log(encryption === encryptionHS); // true
   * ```
   */
  public static getInstance(preset?: Preset): ClientEncryption;

  /**
   * Resets the singleton instance.
   *
   * This method cleans up the current instance and allows a new one to be
   * created with potentially different configuration. Primarily useful for
   * testing scenarios or when you need to change the security preset.
   *
   * @example
   * ```typescript
   * // Create instance with NORMAL preset
   * const encryption1 = ClientEncryption.getInstance(Preset.NORMAL);
   *
   * // Reset and create with HIGH_SECURITY preset
   * ClientEncryption.resetInstance();
   * const encryption2 = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
   * ```
   */
  public static resetInstance(): void;

  /**
   * Encrypts data using hybrid encryption.
   *
   * This method encrypts the provided data using a combination of ML-KEM
   * (asymmetric) and AES-GCM (symmetric) encryption. The data is first
   * serialized to JSON, then encrypted using the symmetric cipher with a
   * randomly generated key. The symmetric key is then encrypted using the
   * provided public key via ML-KEM.
   *
   * @param data - The data to encrypt (any serializable value)
   * @param publicKey - The public key for encryption (Base64 string or Uint8Array)
   * @returns The encrypted data object containing all necessary components
   * @throws {Error} When encryption fails or inputs are invalid
   *
   * @example
   * ```typescript
   * const encryption = ClientEncryption.getInstance();
   *
   * // Encrypt user data
   * const userData = {
   *   id: 12345,
   *   email: 'user@example.com',
   *   preferences: { theme: 'dark' }
   * };
   *
   * const publicKey = 'LS0tLS1CRUdJTi...'; // Base64 public key
   * const encrypted = encryption.encryptData(userData, publicKey);
   *
   * // Result structure:
   * // {
   * //   preset: 'normal',
   * //   encryptedContent: 'base64-encrypted-data...',
   * //   cipherText: 'base64-kem-ciphertext...',
   * //   nonce: 'base64-nonce...'
   * // }
   * ```
   */
  public encryptData(data: unknown, publicKey: string | Uint8Array): EncryptedData;

  /**
   * Converts string keys to binary format.
   *
   * @param key - The key to convert (string or Uint8Array)
   * @returns The key as Uint8Array
   * @throws {Error} When Base64 decoding fails
   * @private
   */
  private keyAdapter(key: string | Uint8Array): Uint8Array;
}

/**
 * Security presets for encryption configuration.
 *
 * @example
 * ```typescript
 * import { Preset } from 'hybrid-encryption-library/client';
 *
 * const normalSecurity = ClientEncryption.getInstance(Preset.NORMAL);
 * const highSecurity = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
 * ```
 */
export { Preset } from '../core/common/enums';

/**
 * Structure of encrypted data returned by the encryption methods.
 *
 * @example
 * ```typescript
 * const encrypted: EncryptedData = {
 *   preset: 'high_security',
 *   encryptedContent: 'eyJjaXBoZXJ0ZXh0IjoiLi4u...',
 *   cipherText: 'LS0tLS1CRUdJTi...',
 *   nonce: 'YWJjZGVmZ2hpams...'
 * };
 * ```
 */
export { EncryptedData } from '../core/common/interfaces/encryption.interfaces';

/**
 * Utility function for creating appropriate error instances.
 *
 * @param message - The error message
 * @param context - Additional error context
 * @returns A properly formatted error instance
 */
export declare function createAppropriateError(
  message: string,
  context: {
    errorType: string;
    preset: Preset;
    operation: string;
    cause?: Error;
  }
): Error;

/**
 * Utility function for converting strings to binary data.
 *
 * @param input - The string to convert
 * @returns The binary representation as Uint8Array
 */
export declare function stringToBinary(input: string): Uint8Array;

/**
 * Configuration options for different security presets.
 */
export interface SecurityPresetConfig {
  /** Key size for ML-KEM encryption */
  readonly kemKeySize: number;
  /** Key size for AES-GCM encryption */
  readonly aeadKeySize: number;
  /** Algorithm identifier */
  readonly algorithm: string;
  /** Security level description */
  readonly securityLevel: 'standard' | 'high';
}

/**
 * Available security presets and their configurations.
 */
export declare const SECURITY_PRESETS: {
  readonly [Preset.NORMAL]: SecurityPresetConfig;
  readonly [Preset.HIGH_SECURITY]: SecurityPresetConfig;
};

/**
 * Type guard for checking if a value is a valid EncryptedData object.
 *
 * @param value - The value to check
 * @returns True if the value is a valid EncryptedData object
 */
export declare function isEncryptedData(value: unknown): value is EncryptedData;

/**
 * Error types that can be thrown by the client encryption module.
 */
export interface ClientEncryptionError extends Error {
  /** The type of error that occurred */
  readonly errorType: 'validation' | 'operation' | 'initialization';
  /** The preset being used when the error occurred */
  readonly preset?: Preset;
  /** The operation that was being performed */
  readonly operation?: string;
  /** The underlying cause of the error */
  readonly cause?: Error;
}

// Re-export commonly used types from core
export { Base64 } from '../core/common/types/branded-types.types';
