import { Preset } from '../enums';
import { Base64 } from '../types/branded-types.types';

/**
 * Modern encrypted data format using KEM + AEAD approach
 * Replaces the legacy RSA + AES approach with post-quantum security
 */
export interface EncryptedData {
  preset: Preset;
  encryptedContent: Base64; // Base64 encrypted data
  cipherText: Base64; // Base64 KEM ciphertext/key material
  nonce: Base64; // Base64 nonce/IV
}
