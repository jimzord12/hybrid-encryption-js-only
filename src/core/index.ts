import * as constants from './constants.js';
import { HybridEncryption, ModernHybridEncryption } from './encryption';
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

export { KeyFormatUtils } from './types/crypto-provider.types';

export type {
  KeyManagerConfig,
  KeyManagerStatus,
  KeyRotationState,
  RotationHistory,
  RotationHistoryEntry,
  RotationStats,
} from './types/key-rotation.types';

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

export { constants, HybridEncryption, ModernHybridEncryption, utils };
