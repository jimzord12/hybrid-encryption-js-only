import * as constants from './constants.js';
import { HybridEncryption } from './encryption';
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

export {
  KeyFormatUtils,
} from './types/crypto-provider.types';

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
  ModernEncryptedData,
  ModernKeyPair,
  ModernEncryptionOptions,
  ModernKeyGenerationConfig,
  ModernKeyDerivationConfig,
  AlgorithmCapabilities,
} from './types/modern-encryption.types';

export {
  isModernEncryptedData,
  isModernKeyPair,
  ModernEncryptionError,
  KeyValidationError,
  AlgorithmNotFoundError,
  DEFAULT_MODERN_OPTIONS,
  MODERN_ENCRYPTION_VERSION,
} from './types/modern-encryption.types';

export { constants, HybridEncryption, utils };
