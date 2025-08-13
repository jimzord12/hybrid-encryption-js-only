import { fromBase64, toBase64 } from './conversion.util';
import {
  KeyDerivation,
  type KeyDerivationConfig,
  type KeyDerivationResult,
  type SupportedKDFAlgorithms,
} from './key-derivation.util';
import { ModernFormatUtils } from './modern-format.util';

// Note: Other utility functions will be added in subsequent phases
// - getRandomBytes will be replaced with crypto.getRandomValues
// - generateKeyPair will be moved to algorithm-specific providers
// - validation utils will be added for modern key formats

export {
  fromBase64,
  KeyDerivation,
  ModernFormatUtils,
  toBase64,
  type KeyDerivationConfig,
  type KeyDerivationResult,
  type SupportedKDFAlgorithms,
};
