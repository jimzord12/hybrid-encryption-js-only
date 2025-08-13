import { fromBase64, toBase64 } from './conversion.util';
import { ModernFormatUtils } from './modern-format.util';
import { 
  KeyDerivation, 
  type SupportedKDFAlgorithms, 
  type KeyDerivationConfig, 
  type KeyDerivationResult 
} from './key-derivation.util';

// Note: Other utility functions will be added in subsequent phases
// - getRandomBytes will be replaced with crypto.getRandomValues
// - generateKeyPair will be moved to algorithm-specific providers
// - validation utils will be added for modern key formats

export { 
  fromBase64, 
  ModernFormatUtils, 
  toBase64,
  KeyDerivation,
  type SupportedKDFAlgorithms,
  type KeyDerivationConfig,
  type KeyDerivationResult,
};
