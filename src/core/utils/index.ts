import { SerializableData } from '../common/interfaces/serialization.interfaces.js';
import {
  BufferUtils,
  binaryToString,
  constantTimeEqual,
  decodeBase64,
  encodeBase64,
  getSecureRandomBytes,
  stringToBinary,
} from './buffer.utils.js';
import {
  ComparisonUtils,
  arraysDeepEqual,
  deepEqual,
  objectsDeepEqual,
  type DeepComparisonOptions,
} from './comparison.utils.js';
import { KeyDerivation } from './key-derivation.utils.js';
import { Serialization } from './serialization.utils.js';

// Note: Other utility functions will be added in subsequent phases
// - Random bytes generation now uses @noble/hashes for cryptographic security
// - generateKeyPair will be moved to algorithm-specific providers
// - validation utils will be added for modern key formats

export {
  BufferUtils,
  ComparisonUtils,
  KeyDerivation,
  Serialization,
  arraysDeepEqual,
  binaryToString,
  constantTimeEqual,
  decodeBase64,
  deepEqual,
  encodeBase64,
  getSecureRandomBytes,
  objectsDeepEqual,
  stringToBinary,
  type DeepComparisonOptions,
  type SerializableData,
};
