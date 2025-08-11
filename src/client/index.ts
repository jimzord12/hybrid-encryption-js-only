import { HybridEncryption, utils } from '../core';
import { EncryptedData, EncryptionOptions, RSAKeyPair } from '../types/core.types';

/**
 * Encrypt data using hybrid encryption
 */
export const encrypt = (
  data: any,
  publicKeyPem: string,
  options?: EncryptionOptions
): EncryptedData => {
  return HybridEncryption.encrypt(data, publicKeyPem, options);
};

/**
 * Decrypt data using hybrid encryption
 */
export const decrypt = <T = any>(
  encryptedData: EncryptedData,
  privateKeyPem: string,
  options?: EncryptionOptions
): T => {
  return HybridEncryption.decrypt<T>(encryptedData, privateKeyPem, options);
};

/**
 * Generate RSA key pair
 */
export const generateRSAKeyPair = (keySize?: number): RSAKeyPair => {
  return utils.generateRSAKeyPair(keySize);
};

/**
 * Validate key pair functionality
 */
export const validateKeyPair = (keyPair: RSAKeyPair): boolean => {
  return HybridEncryption.validateKeyPair(keyPair);
};
