// Export modern ModernHybridEncryption (Phase 2.1)
export { HybridEncryption } from './hybrid-encryption.js';

// Export algorithm registry

// Export base classes
export * from './interfaces/asymmetric-alg.interfaces.js';
export * from './interfaces/symmetric-alg.interfaces.js';

export { Preset } from '../common/enums/index.js';
export { createAppropriateError } from '../common/errors/encryption.errors.js';
export type { EncryptedData } from '../common/interfaces/encryption.interfaces.js';
export type { Base64 } from '../common/types/branded-types.types.js';
export { decodeBase64 } from '../utils/buffer.utils.js';
