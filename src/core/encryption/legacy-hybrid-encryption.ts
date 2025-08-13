// TEMPORARY FILE - Legacy HybridEncryption class for backward compatibility
// This class will be replaced with ModernHybridEncryption in Phase 2.1

import { LegacyEncryptedData, LegacyEncryptionOptions } from '../types/encryption.types.js';

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
      '🚧 Legacy RSA encryption has been removed in Phase 1.1\n' +
        '📋 Use ModernHybridEncryption.encrypt() with ML-KEM algorithms instead\n' +
        '🔄 This will be available in Phase 2.1 - Create ModernHybridEncryption Class\n' +
        '📖 See TODO.md for implementation timeline',
    );
  }

  static decrypt<T = any>(encryptedData: LegacyEncryptedData, privateKey: string): T {
    throw new Error(
      '🚧 Legacy RSA decryption has been removed in Phase 1.1\n' +
        '📋 Use ModernHybridEncryption.decrypt() with ML-KEM algorithms instead\n' +
        '🔄 This will be available in Phase 2.1 - Create ModernHybridEncryption Class\n' +
        '📖 See TODO.md for implementation timeline',
    );
  }

  /**
   * DEPRECATED: Legacy key pair validation - RSA functionality removed
   * Will be replaced with modern algorithm validation in Phase 2.1
   */
  static validateKeyPair(keyPair: any): boolean {
    throw new Error(
      '🚧 Legacy RSA key validation has been removed in Phase 1.1\n' +
        '📋 Use ModernHybridEncryption.validateKeyPair() instead\n' +
        '🔄 This will be available in Phase 2.1 - Create ModernHybridEncryption Class\n' +
        '📖 See TODO.md for implementation timeline',
    );
  }

  /**
   * DEPRECATED: Legacy bulk decryption - RSA functionality removed
   * Will be replaced with modern decryption in Phase 2.1
   */
  static decryptWithKeys<T = any>(encryptedData: LegacyEncryptedData, privateKeys: string[]): T {
    throw new Error(
      '🚧 Legacy RSA bulk decryption has been removed in Phase 1.1\n' +
        '📋 Use ModernHybridEncryption with grace period support instead\n' +
        '🔄 This will be available in Phase 3.2 - Grace Period Decryption Logic\n' +
        '📖 See TODO.md for implementation timeline',
    );
  }

  /**
   * DEPRECATED: Legacy key pair expiry check - RSA functionality removed
   * Will be replaced with modern key management in Phase 3.1
   */
  static isKeyPairExpired(keyPair: any): boolean {
    throw new Error(
      '🚧 Legacy RSA key expiry checking has been removed in Phase 1.1\n' +
        '📋 Use KeyManager with modern key rotation instead\n' +
        '🔄 This will be available in Phase 3.1 - Update KeyManager Core\n' +
        '📖 See TODO.md for implementation timeline',
    );
  }
}
