import { Preset } from '../../common/enums';

export const DEFAULT_ENCRYPTION_OPTIONS = {
  preset: Preset.NORMAL,
  // Other default options can be added here
};

export const AES_GCM_STATS = {
  keySizeBits: {
    [Preset.NORMAL]: 256,
    [Preset.HIGH_SECURITY]: 256,
  },
  nonceLength: {
    [Preset.NORMAL]: 12,
    [Preset.HIGH_SECURITY]: 16,
  },
};

export const ML_KEM_STATS = {
  keySize: {
    [Preset.NORMAL]: '768',
    [Preset.HIGH_SECURITY]: '1024',
  },
  publicKeyLength: {
    [Preset.NORMAL]: 1184,
    [Preset.HIGH_SECURITY]: 1568,
  },
  secretKeyLength: {
    [Preset.NORMAL]: 2400,
    [Preset.HIGH_SECURITY]: 3168,
  },
  ciphertextLength: {
    [Preset.NORMAL]: 1088,
    [Preset.HIGH_SECURITY]: 1568,
  },
  sharedSecretLength: 32,
};
