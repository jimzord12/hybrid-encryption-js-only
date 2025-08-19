/**
 * Client Module - Browser/Frontend Encryption
 *
 * Optimized for client-side environments with minimal dependencies.
 * This module provides secure hybrid encryption capabilities without
 * requiring Node.js built-ins like 'fs' or 'path'.
 *
 * @packageDocumentation
 */

// ============================================================================
// PRIMARY EXPORTS - Main client functionality
// ============================================================================

export { ClientEncryption } from './encrypt.js';

// ============================================================================
// TYPE EXPORTS - Client-specific types and interfaces
// ============================================================================

// Re-export common types for convenience
export { Preset } from '../core/common/enums/index.js';
export type { EncryptedData } from '../core/common/interfaces/encryption.interfaces.js';
export type { Base64 } from '../core/common/types/branded-types.types.js';

// ============================================================================
// UTILITIES - Client-specific utilities
// ============================================================================

// Re-export client-safe utilities (no Node.js dependencies)
export {
  arraysDeepEqual,
  binaryToString,
  constantTimeEqual,
  decodeBase64,
  deepEqual,
  encodeBase64,
  getSecureRandomBytes,
  objectsDeepEqual,
  stringToBinary,
} from '../core/utils/index.js';

// Client-specific error handling
export { createAppropriateError } from '../core/common/errors/encryption.errors.js';
