import { randomBytes } from '@noble/hashes/utils';
import { KeyMaterial, SymmetricEncryptionResult } from '../types';

export abstract class SymmetricAlgorithm {
  constructor(
    public readonly name: string,
    public readonly keySize: number,
    public readonly nonceSize: number,
    public readonly isAEAD: boolean, // TODO: Learn what this is
  ) {}

  abstract deriveKeyMaterial(
    sharedSecret: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
  ): KeyMaterial;

  abstract encrypt(data: Uint8Array, keyMaterial: KeyMaterial): SymmetricEncryptionResult;

  abstract decrypt(
    encryptedData: Uint8Array,
    keyMaterial: KeyMaterial,
    authData?: Uint8Array,
  ): Uint8Array;

  getAlgorithmId(): string {
    return this.name;
  }

  generateNonce(): Uint8Array {
    return randomBytes(this.nonceSize);
  }
}
