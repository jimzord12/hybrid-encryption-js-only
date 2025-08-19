/**
 * Core Module - Cryptographic Primitives & Key Management
 *
 * Contains the fundamental encryption algorithms, key management,
 * and utility functions that power both client and server modules.
 *
 * @packageDocumentation
 */

// ============================================================================
// PRIMARY EXPORTS - Core encryption functionality
// ============================================================================

export { HybridEncryption } from './encryption/index.js';
export { KeyManager } from './key-management/key-manager.js';

// ============================================================================
// TYPE DEFINITIONS - Core interfaces and types
// ============================================================================

// Common data structures
export type { EncryptedData } from './common/interfaces/encryption.interfaces.js';
export type { KeyPair, Keys } from './common/interfaces/keys.interfaces.js';
export type {
  SerializableData,
  SerializedKeyPair,
} from './common/interfaces/serialization.interfaces.js';
export type { ValidationResult } from './common/interfaces/validation.interfaces.js';
export type { Base64 } from './common/types/branded-types.types.js';

// Enumerations
export { Preset } from './common/enums/index.js';

// Key management types
export type { KeyManagerConfig } from './key-management/types/key-manager.types.js';

// Algorithm interfaces for extensibility
export type {
  AlgorithmID,
  AsymmetricAlgorithm,
  SharedSecretResult,
} from './encryption/interfaces/asymmetric-alg.interfaces.js';
export type {
  SymmetricAlgorithm,
  SymmetricEncryptionResult,
} from './encryption/interfaces/symmetric-alg.interfaces.js';

// Provider interfaces
export type { KeyProvider } from './providers/interfaces/key-provider.interface.js';

// Validation and utility types
export type { DeepComparisonOptions } from './utils/comparison.utils.js';

// ============================================================================
// ERROR HANDLING - Custom error classes and utilities
// ============================================================================

export * from './common/errors/index.js';

// ============================================================================
// UTILITIES - Cryptographic and general utilities
// ============================================================================

// Buffer operations (cryptographic)
export {
  binaryToString,
  BufferUtils,
  constantTimeEqual,
  decodeBase64,
  encodeBase64,
  getSecureRandomBytes,
  stringToBinary,
} from './utils/index.js';

// Comparison utilities
export { arraysDeepEqual, ComparisonUtils, deepEqual, objectsDeepEqual } from './utils/index.js';

// Cryptographic utilities
export { KeyDerivation, Serialization } from './utils/index.js';

// ============================================================================
// PROVIDERS - Strategy pattern implementations
// ============================================================================

export { MlKemKeyProvider } from './providers/ml-kem-provider.js';

// ============================================================================
// GUARDS - Type guards for runtime validation
// ============================================================================

export * from './common/guards/index.js';
