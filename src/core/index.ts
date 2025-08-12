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
export { KeyProviderFactory, RSAKeyProvider } from './providers';

// Export types for algorithm development
export type {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  SerializedKeyMetadata,
  SerializedKeys,
} from './types/crypto-provider.types';

export type {
  KeyManagerConfig,
  KeyManagerStatus,
  KeyRotationState,
  RotationHistory,
  RotationHistoryEntry,
  RotationStats,
} from './types/key-rotation.types';

export { constants, HybridEncryption, utils };
