import { Preset } from './enums';

export const DEFAULT_ENCRYPTION_OPTIONS = {
  preset: Preset.DEFAULT,
  // Other default options can be added here
};

export const DEFAULT_KEY_MANAGER_OPTIONS = {
  preset: Preset.DEFAULT,
  certPath: './config/certs',
  keyExpiryMonths: 1,
  autoGenerate: true,
  enableFileBackup: true,
  rotationGracePeriod: 15,
  // Other default options can be added here
};

export const AES_GCM_STATS = {
  keySizeBits: {
    [Preset.DEFAULT]: 256,
    [Preset.HIGH_SECURITY]: 256,
  },
  nonceLength: {
    [Preset.DEFAULT]: 12,
    [Preset.HIGH_SECURITY]: 16,
  },
};

export const ML_KEM_STATS = {
  keySize: {
    [Preset.DEFAULT]: '768',
    [Preset.HIGH_SECURITY]: '1024',
  },
  publicKeyLength: {
    [Preset.DEFAULT]: 1184,
    [Preset.HIGH_SECURITY]: 1568,
  },
  secretKeyLength: {
    [Preset.DEFAULT]: 2400,
    [Preset.HIGH_SECURITY]: 3168,
  },
  ciphertextLength: {
    [Preset.DEFAULT]: 1088,
    [Preset.HIGH_SECURITY]: 1568,
  },
  sharedSecretLength: 32,
};
