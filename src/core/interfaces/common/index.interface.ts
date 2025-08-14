import { Preset } from '../../enums';

export interface Keys {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface KeyPair extends Keys {
  preset: Preset;
  metadata: {
    version: number; // Key format version
    createdAt: Date; // When the key was generated
    expiresAt?: Date; // Optional expiration
  };
}
