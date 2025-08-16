import { Preset } from '../../common/enums';
import { KeyPair, Keys } from '../../common/interfaces/keys.interfaces';
import { SerializedKeys } from '../../common/interfaces/serialization.interfaces';
import { ValidationResult } from '../../common/interfaces/validation.interfaces';

/**
 * Generic interface for cryptographic key providers
 * This allows the KeyManager to work with different algorithms (RSA, ECC, Ed25519, etc.)
 */
export abstract class KeyProvider {
  /**
   * Generate a new key pair
   */
  static generateKeyPair(_preset: Preset): Keys {
    throw new Error('generateKeyPair method not implemented');
  }

  /**
   * Validate that a key pair works correctly (encryption/decryption round trip)
   */
  static validateKeyPair(_keyPair: KeyPair): ValidationResult {
    throw new Error('validateKeyPair method not implemented');
  }

  /**
   * Check if a key pair has expired
   */
  static isKeyPairExpired(_keyPair: KeyPair): ValidationResult {
    throw new Error('isKeyPairExpired method not implemented');
  }

  /**
   * Serialize key pair for storage
   */
  static serializeKeyPair(_keyPair: KeyPair): SerializedKeys {
    throw new Error('serializeKeyPair method not implemented');
  }

  /**
   * Deserialize key pair from storage
   */
  static deserializeKeyPair(_data: SerializedKeys): KeyPair {
    throw new Error('deserializeKeyPair method not implemented');
  }
}
