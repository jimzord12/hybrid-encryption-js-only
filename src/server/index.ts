/**
 * Server Module - Node.js Backend Decryption & Key Management
 *
 * Provides server-side decryption, key management, Express.js integration,
 * and background key rotation capabilities. Requires Node.js environment
 * with filesystem access.
 *
 * @packageDocumentation
 */

// ============================================================================
// PRIMARY EXPORTS - Core server functionality
// ============================================================================

export { getServerDecryption, ServerDecryption } from './decrypt.js';

// ============================================================================
// EXPRESS.JS INTEGRATION - Middleware and routes
// ============================================================================

export { decryptMiddleware } from './express/middleware/decryption.js';
export { default as decryptionRouter } from './express/routes/index.js';

// Express error handling
export * from './express/errors/express.errors.js';

// ============================================================================
// KEY MANAGEMENT & AUTOMATION - Background processes
// ============================================================================

export { isJobScheduled } from './cron/cron-utils.js';
export { registerRotationJob, registerRotationJob_TEST } from './cron/key-rotation-job.js';

// ============================================================================
// TYPE EXPORTS - Server-specific types
// ============================================================================

// Re-export common types
export { Preset } from '../core/index.js';
export type { Base64, EncryptedData } from '../core/index.js';

// Server-specific types
export type { KeyManagerConfig } from '../core/index.js';

// ============================================================================
// ADVANCED EXPORTS - For complex server setups
// ============================================================================

// Key management classes
export { KeyManager } from '../core/index.js';

// Core encryption for server-side operations
export { HybridEncryption } from '../core/index.js';

// Full utility suite for server operations
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
} from '../core/utils/index.js';
