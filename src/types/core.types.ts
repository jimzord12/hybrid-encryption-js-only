// DEPRECATED: Legacy types - these will be replaced with modern types in Phase 1.2
// These are kept temporarily to avoid breaking existing imports

// Legacy interfaces for backward compatibility during transition
export interface LegacyRSAKeyPair {
  publicKey: string; // PEM format (DEPRECATED)
  privateKey: string; // PEM format (DEPRECATED)
  version?: number;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface LegacyEncryptedData {
  encryptedContent: string; // Base64 encoded AES-GCM encrypted data
  encryptedAESKey: string; // Base64 encoded RSA encrypted AES key (DEPRECATED)
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded GCM authentication tag
  version: string; // For future compatibility
}

export interface LegacyEncryptionOptions {
  keySize?: 128 | 192 | 256; // AES key size in bits
}

// Type aliases for backward compatibility
export type RSAKeyPair = LegacyRSAKeyPair;
export type EncryptedData = LegacyEncryptedData;
export type EncryptionOptions = LegacyEncryptionOptions;

export type ForgePaddingType = 'RSA-OAEP' | 'RSAES-PKCS1-V1_5';
