// Export legacy HybridEncryption for backward compatibility (deprecated)
export { HybridEncryption } from './legacy-hybrid-encryption';

// Export modern ModernHybridEncryption (Phase 2.1)
export { ModernHybridEncryption } from './modern-hybrid-encryption.js';

// Export algorithm registry
export * from './algorithm-registry.js';

// Export base classes
export * from './asymmetric/base.js';
export * from './symmetric/base.js';

// Export types
export * from './types.js';
