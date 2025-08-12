import { EncryptionOptions } from '../types/core.types';

export const defaults = {
  DEFAULT_KEY_SIZE: 256, // Default AES key size in bits
  DEFAULT_RSA_KEY_SIZE: 2048, // Default RSA key size in bits
  DEFAULT_RSA_PADDING: 'OAEP', // Default RSA padding scheme
};

export const options = {
  SUPPORTED_AES_KEY_SIZES: [128, 192, 256], // Supported AES key sizes in bits
  SUPPORTED_RSA_PADDING_SCHEMES: ['OAEP', 'PKCS1'], // Supported RSA padding schemes
};

export const forgePadding: Record<Required<EncryptionOptions>['rsaPadding'], string> = {
  OAEP: 'RSA-OAEP',
  PKCS1: 'RSAES-PKCS1-V1_5',
} as const;
