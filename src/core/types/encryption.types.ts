/**
 * Modern Encryption Types - Version 2.0.0
 *
 * These interfaces represent the modernized, algorithm-agnostic encryption system
 * that will replace the legacy RSA-based interfaces in Phase 2.0.0
 */

import { Preset } from '../enums';

/**
 * Modern encrypted data format using KEM + AEAD approach
 * Replaces the legacy RSA + AES approach with post-quantum security
 */
export interface EncryptedData {
  preset: Preset;
  encryptedContent: string; // Base64 encrypted data
  cipherText: string; // Base64 KEM ciphertext/key material
  nonce: string; // Base64 nonce/IV
}

export interface KeyGenerationConfig {
  algorithm: string; // Target algorithm
  preset?: 'default' | 'high-security';
  metadata?: Record<string, any>; // Custom metadata
}
