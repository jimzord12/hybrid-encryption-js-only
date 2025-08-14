/**
 * Modern Encryption Types - Version 2.0.0
 *
 * These interfaces represent the modernized, algorithm-agnostic encryption system
 * that will replace the legacy RSA-based interfaces in Phase 2.0.0
 */

import { Preset } from '../enums';
import { Base64 } from './branded-types.types';

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

export interface KeyGenerationConfig {
  preset?: 'default' | 'high-security';
}
