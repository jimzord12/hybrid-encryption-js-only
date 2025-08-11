export interface RSAKeyPair {
  publicKey: string; // PEM format
  privateKey: string; // PEM format
  version?: number;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface EncryptedData {
  encryptedContent: string; // Base64 encoded AES-GCM encrypted data
  encryptedAESKey: string; // Base64 encoded RSA encrypted AES key
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded GCM authentication tag
  version: string; // For future compatibility
}

export interface EncryptionOptions {
  keySize?: 128 | 192 | 256; // AES key size in bits
  rsaPadding?: 'OAEP' | 'PKCS1'; // RSA padding scheme
}

export type ForgePaddingType = 'RSA-OAEP' | 'RSAES-PKCS1-V1_5';
