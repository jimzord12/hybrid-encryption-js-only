/**
 * Hybrid Encryption Library - Main Entry Point
 *
 * This library provides secure hybrid encryption using post-quantum ML-KEM
 * and symmetric AES-GCM algorithms with automatic key management.
 *
 * @packageDocumentation
 */

// ============================================================================
// CORE EXPORTS - Fundamental types and utilities
// ============================================================================

// Core types and interfaces
export type { Base64, EncryptedData, KeyPair, Keys, SerializableData } from './core/index.js';

// Enums
export { Preset } from './core/index.js';

// Core encryption classes
export { HybridEncryption, KeyManager } from './core/index.js';

// Core utilities (tree-shakable)
export {
  arraysDeepEqual,
  binaryToString,
  BufferUtils,
  ComparisonUtils,
  constantTimeEqual,
  decodeBase64,
  deepEqual,
  encodeBase64,
  getSecureRandomBytes,
  KeyDerivation,
  objectsDeepEqual,
  Serialization,
  stringToBinary,
} from './core/utils/index.js';

// Error classes
export * from './core/index.js';

// ============================================================================
// CLIENT EXPORTS - Browser/Frontend optimized
// ============================================================================

export { ClientEncryption } from './client/index.js';

// ============================================================================
// SERVER EXPORTS - Node.js backend features
// ============================================================================

export { getServerDecryption, ServerDecryption } from './server/index.js';

// Express.js integration
export { decryptionRouter, decryptMiddleware } from './server/index.js';

// Key rotation and cron utilities
export { isJobScheduled, registerRotationJob, registerRotationJob_TEST } from './server/index.js';

// ============================================================================
// ADVANCED EXPORTS - Internal APIs for advanced usage
// ============================================================================

// Providers (Strategy Pattern implementations)
export { MlKemKeyProvider } from './core/index.js';
export type { KeyProvider } from './core/index.js';

// Type definitions for advanced usage
export type { DeepComparisonOptions, KeyManagerConfig } from './core/index.js';

// Algorithm interfaces for extensibility
export type {
  AlgorithmID,
  AsymmetricAlgorithm,
  SharedSecretResult,
  SymmetricAlgorithm,
  SymmetricEncryptionResult,
} from './core/index.js';

// ============================================================================
// NOTE: For advanced usage patterns, import specific modules:
//
// import { ClientEncryption } from 'hybrid-encryption-js-only/client';
// import { ServerDecryption } from 'hybrid-encryption-js-only/server';
// import { HybridEncryption } from 'hybrid-encryption-js-only/core';
// ============================================================================
