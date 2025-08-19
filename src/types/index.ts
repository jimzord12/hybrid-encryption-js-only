/**
 * Types Module - TypeScript Definitions Only
 *
 * Convenient access to all TypeScript types and interfaces
 * without importing runtime code. Perfect for type-only imports.
 *
 * @packageDocumentation
 */

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

export type { Base64, EncryptedData, SerializableData } from '../core/index.js';

// ============================================================================
// ALGORITHM INTERFACES
// ============================================================================

export type {
  AlgorithmID,
  AsymmetricAlgorithm,
  SharedSecretResult,
  SymmetricAlgorithm,
  SymmetricEncryptionResult,
} from '../core/index.js';

// ============================================================================
// KEY MANAGEMENT TYPES
// ============================================================================

export type {
  KeyManagerConfig,
  KeyPair,
  KeyProvider,
  Keys,
  SerializedKeyPair,
} from '../core/index.js';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type { DeepComparisonOptions, ValidationResult } from '../core/index.js';

// ============================================================================
// ENUMS (re-exported for convenience)
// ============================================================================

export { Preset } from '../core/index.js';
