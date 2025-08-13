// Legacy interfaces - these will be replaced in Phase 1.2 with modern interfaces
export interface LegacyEncryptedData {
  encryptedContent: string; // Base64 encoded AES-GCM encrypted data
  encryptedAESKey: string; // Base64 encoded RSA encrypted AES key (DEPRECATED)
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded GCM authentication tag
  version: string; // For future compatibility
}

// Will be removed in Phase 1.2 - replaced with ModernEncryptionOptions
export interface LegacyEncryptionOptions {
  keySize?: 128 | 192 | 256; // AES key size in bits
}

// Legacy type aliases for backward compatibility during transition
export type EncryptedData = LegacyEncryptedData;
export type EncryptionOptions = LegacyEncryptionOptions;
