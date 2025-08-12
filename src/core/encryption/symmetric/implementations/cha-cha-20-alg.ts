import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { KeyMaterial, SymmetricEncryptionResult } from '../../types';
import { SymmetricAlgorithm } from '../base';

export class ChaCha20Poly1305Algorithm extends SymmetricAlgorithm {
  constructor() {
    super('ChaCha20-Poly1305', 32, 12, true);
  }

  deriveKeyMaterial(sharedSecret: Uint8Array, salt: Uint8Array, info: Uint8Array): KeyMaterial {
    const key = hkdf(sha256, sharedSecret, salt, info, this.keySize);
    const nonce = this.generateNonce();

    return {
      key,
      nonce,
      info,
    } as const;
  }

  encrypt(data: Uint8Array, keyMaterial: KeyMaterial): SymmetricEncryptionResult {
    const cipher = chacha20poly1305(keyMaterial.key, keyMaterial.nonce);
    const encryptedData = cipher.encrypt(data);

    return {
      encryptedData,
      nonce: keyMaterial.nonce,
    } as const;
  }

  decrypt(encryptedData: Uint8Array, keyMaterial: KeyMaterial): Uint8Array {
    const cipher = chacha20poly1305(keyMaterial.key, keyMaterial.nonce);
    return cipher.decrypt(encryptedData);
  }
}
