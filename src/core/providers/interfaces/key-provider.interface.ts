import { KeyPair } from '../../common/interfaces/keys.interfaces';
import { SerializedKeyPair } from '../../common/interfaces/serialization.interfaces';
import { ValidationResult } from '../../common/interfaces/validation.interfaces';

/**
 * ML-KEM Key Provider Interface
 */
export abstract class KeyProvider {
  /**
   * Generate a new key pair
   */
  generateKeyPair(_metadata?: Partial<KeyPair['metadata']>): KeyPair {
    throw new Error('generateKeyPair method not implemented');
  }

  addMetaDataToKeys(_metadata?: Partial<KeyPair['metadata']>): KeyPair['metadata'] {
    throw new Error('addMetaDataToKeys method not implemented');
  }

  /**
   * Validate that a key pair works correctly (encryption/decryption round trip)
   */
  validateKeyPair(_keyPair: KeyPair): ValidationResult {
    throw new Error('validateKeyPair method not implemented');
  }

  /**
   * Serialize key pair for storage
   */
  serializeKeyPair(_keyPair: KeyPair): SerializedKeyPair {
    throw new Error('serializeKeyPair method not implemented');
  }

  /**
   * Deserialize key pair from storage
   */
  deserializeKeyPair(_data: SerializedKeyPair): KeyPair {
    throw new Error('deserializeKeyPair method not implemented');
  }
}
