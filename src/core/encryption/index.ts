// TEMPORARY FILE - Will be replaced with ModernHybridEncryption in Phase 2.1
// This file is kept minimal to avoid RSA dependencies while maintaining basic structure

import { LegacyEncryptedData, LegacyEncryptionOptions } from '../types/encryption.types';

/**
 * DEPRECATED: Legacy HybridEncryption class
 * This class will be replaced with ModernHybridEncryption in Phase 2.1
 * Currently only provides basic structure without RSA functionality
 */
export class HybridEncryption {
  private static readonly DEFAULT_OPTIONS: Required<LegacyEncryptionOptions> = {
    keySize: 256,
  };

  private static readonly VERSION = '1.0.0';

  /**
   * DEPRECATED: Legacy encrypt method - RSA functionality removed
   * Will be replaced with KEM-based encryption in Phase 2.1
   */
  static encrypt(
    data: any,
    publicKey: string,
    options: LegacyEncryptionOptions = {},
  ): LegacyEncryptedData {
    throw new Error(
      'RSA-based encryption has been removed. Please use the new ModernHybridEncryption class (available in Phase 2.1)',
    );
  }

  /**
   * DEPRECATED: Legacy decrypt method - RSA functionality removed
   * Will be replaced with KEM-based decryption in Phase 2.1
   */
  static decrypt<T = any>(encryptedData: LegacyEncryptedData, privateKey: string): T {
    throw new Error(
      'RSA-based decryption has been removed. Please use the new ModernHybridEncryption class (available in Phase 2.1)',
    );
  }

  /**
   * DEPRECATED: Legacy key validation - RSA functionality removed
   * Will be replaced with modern key validation in Phase 2.1
   */
  static validateKeyPair(keyPair: any): boolean {
    throw new Error(
      'RSA key validation has been removed. Please use the new ModernHybridEncryption.validateKeyPair method (available in Phase 2.1)',
    );
  }

  /**
   * DEPRECATED: Multiple key decryption - RSA functionality removed
   * Will be replaced with grace period decryption in Phase 3.2
   */
  static decryptWithMultipleKeys<T = any>(
    encryptedData: LegacyEncryptedData,
    privateKeys: string[],
  ): T {
    throw new Error(
      'RSA-based multi-key decryption has been removed. Please use the new grace period functionality (available in Phase 3.2)',
    );
  }

  /**
   * DEPRECATED: Key expiry check - RSA functionality removed
   * Will be replaced with modern key lifecycle management in Phase 3.1
   */
  static isKeyPairExpired(keyPair: any): boolean {
    throw new Error(
      'RSA key expiry checking has been removed. Please use the new KeyManager functionality (available in Phase 3.1)',
    );
  }
}

// Re-export for backward compatibility
export { LegacyEncryptedData as EncryptedData, LegacyEncryptionOptions as EncryptionOptions };
