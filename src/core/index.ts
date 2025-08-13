import * as constants from './constants.js';
import { ModernHybridEncryption } from './encryption';
import { createAppropriateError } from './errors/modern-encryption.errors.js';
import { initializeKeyManagement } from './key-management/index.js';
import { KeyManagerConfig } from './types/key-rotation.types';
import { ModernEncryptedData, ModernEncryptionOptions } from './types/modern-encryption.types.js';
import * as utils from './utils/index.js';

// Export key management with Strategy Pattern support
export {
  getKeyManager,
  getPrivateKey,
  getPublicKey,
  getRotationHistory,
  getRotationStats,
  healthCheck,
  initializeKeyManagement,
  KeyManager,
} from './key-management/index.js';

// Export provider system for extensibility
export { KeyProviderFactory, MlKemKeyProvider } from './providers';

// Export types for algorithm development
export type {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  SerializedKeyMetadata,
  SerializedKeys,
  SupportedAlgorithms,
} from './types/crypto-provider.types';

export type {
  KeyManagerConfig,
  KeyManagerStatus,
  KeyRotationState,
  RotationHistory,
  RotationHistoryEntry,
  RotationStats,
} from './types/key-rotation.types';

// Export key derivation utilities
export type {
  KeyDerivationConfig,
  KeyDerivationResult,
  SupportedKDFAlgorithms,
} from './utils/key-derivation.util.js';

export { KeyDerivation } from './utils/key-derivation.util.js';

// Export serialization utilities
export type {
  SerializableData,
  SerializationMetadata,
  SerializationOptions,
  SerializationResult,
} from './utils/serialization.util.js';

export { ModernSerialization } from './utils/serialization.util.js';

// Export modern encryption types (Phase 2.0)
export type {
  AlgorithmCapabilities,
  ModernEncryptedData,
  ModernEncryptionOptions,
  ModernKeyDerivationConfig,
  ModernKeyGenerationConfig,
  ModernKeyPair,
} from './types/modern-encryption.types.js';

// Export type guards
export {
  isModernEncryptedData,
  isModernEncryptionOptions,
  isModernKeyGenerationConfig,
  isModernKeyPair,
  isSerializable,
  isValidAlgorithmName,
  isValidBinaryKey,
  validateModernEncryptedData,
  validateModernKeyPair,
} from './guards/index.js';

// Export custom errors
export {
  AlgorithmConfigurationError,
  AlgorithmNotFoundError,
  createAppropriateError,
  CryptographicOperationError,
  FormatConversionError,
  KeyDerivationError,
  KeyValidationError,
  ModernEncryptionError,
} from './errors/index.js';

export { constants, ModernHybridEncryption, utils };

// ============================================================================
// GRACE PERIOD DECRYPTION API
// ============================================================================

/**
 * Decrypt data with automatic grace period support during key rotation
 *
 * This function automatically handles key rotation scenarios by:
 * 1. Getting all available decryption keys from KeyManager (current + previous during grace period)
 * 2. Attempting decryption with each key until successful
 * 3. Providing seamless zero-downtime decryption during key transitions
 *
 * @param encryptedData - Data to decrypt
 * @param options - Decryption options (optional)
 * @returns Decrypted data in original type
 */
export async function decrypt<T = any>(
  encryptedData: ModernEncryptedData,
  optionsKeyManager?: KeyManagerConfig,
  optionsEncryption?: ModernEncryptionOptions,
): Promise<T> {
  // Get KeyManager instance
  const keyManager = await initializeKeyManagement(optionsKeyManager);

  // Get all available decryption keys (includes previous keys during grace period)
  const keyPairs = await keyManager.getDecryptionKeys();

  if (keyPairs.length === 0) {
    throw createAppropriateError('No decryption keys available', {
      errorType: 'keymanager',
      operation: 'retrieval',
    });
  }

  // Extract private keys for decryption
  const privateKeys = keyPairs.map(pair => pair.privateKey);

  // Use grace period decryption
  return ModernHybridEncryption.decryptWithGracePeriod<T>(
    encryptedData,
    privateKeys,
    optionsEncryption,
  );
}

/**
 * Encrypt data using the current public key from KeyManager
 *
 * @param data - Data to encrypt (any serializable type)
 * @param options - Encryption options (optional)
 * @returns Encrypted data structure
 */
export async function encrypt(
  data: any,
  options?: ModernEncryptionOptions,
): Promise<ModernEncryptedData> {
  const { KeyManager } = await import('./key-management/index.js');
  const { ModernHybridEncryption } = await import('./encryption/index.js');

  // Get KeyManager instance
  const keyManager = KeyManager.getInstance();

  // Get current public key
  const publicKey = await keyManager.getPublicKey();

  // Encrypt with current key
  return ModernHybridEncryption.encrypt(data, publicKey, options);
}
