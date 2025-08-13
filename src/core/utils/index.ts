import {
  BufferUtils,
  binaryToString,
  constantTimeEqual,
  decodeBase64,
  encodeBase64,
  getSecureRandomBytes,
  stringToBinary,
} from './buffer.util';
import {
  KeyDerivation,
  type KeyDerivationConfig,
  type KeyDerivationResult,
  type SupportedKDFAlgorithms,
} from './key-derivation.util';
import {
  ModernSerialization,
  type SerializableData,
  type SerializationMetadata,
  type SerializationOptions,
  type SerializationResult,
} from './serialization.util';

// Note: Other utility functions will be added in subsequent phases
// - Random bytes generation now uses @noble/hashes for cryptographic security
// - generateKeyPair will be moved to algorithm-specific providers
// - validation utils will be added for modern key formats

export {
  BufferUtils,
  KeyDerivation,
  ModernSerialization,
  binaryToString,
  constantTimeEqual,
  decodeBase64,
  encodeBase64,
  getSecureRandomBytes,
  stringToBinary,
  type KeyDerivationConfig,
  type KeyDerivationResult,
  type SerializableData,
  type SerializationMetadata,
  type SerializationOptions,
  type SerializationResult,
  type SupportedKDFAlgorithms,
};
