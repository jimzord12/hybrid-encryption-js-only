import { randomBytes } from '@noble/hashes/utils';
import { Preset } from '../../enums';

export interface AEADParams {
  readonly key: Uint8Array;
  readonly nonce: Uint8Array;
}

export interface SymmetricEncryptionResult {
  readonly encryptedData: Uint8Array;
  readonly nonce: Uint8Array;
}

export abstract class SymmetricAlgorithm {
  constructor(
    public readonly name: string,
    public readonly keySize: number,
    public readonly nonceSize: number,
    public readonly isAEAD: boolean, // Means that it supports Authenticated Encryption with Associated Data
  ) {}

  abstract encrypt(data: Uint8Array, aeadParams: AEADParams): SymmetricEncryptionResult;

  abstract decrypt(
    preset: Preset,
    encryptedData: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
  ): Uint8Array;

  generateNonce(): Uint8Array {
    return randomBytes(this.nonceSize);
  }
}
