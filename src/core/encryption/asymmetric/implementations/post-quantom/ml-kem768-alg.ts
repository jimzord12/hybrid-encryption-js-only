import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { AsymmetricAlgorithm } from '../../base';

/**
 * ML-KEM (Post-Quantum) implementation using Key Encapsulation
 */
export class MLKEMAlgorithm extends AsymmetricAlgorithm {
  constructor() {
    super('ML-KEM', '768');
  }

  generateKeyPair() {
    const keyPair = ml_kem768.keygen();
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
    };
  }

  createSharedSecret(publicKey: Uint8Array) {
    // ML-KEM uses encapsulation - generates random shared secret
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKey);
    return {
      sharedSecret: sharedSecret,
      keyMaterial: cipherText, // This is what gets transmitted
    };
  }

  recoverSharedSecret(keyMaterial: Uint8Array, privateKey: Uint8Array) {
    // ML-KEM uses decapsulation to recover the shared secret
    return ml_kem768.decapsulate(keyMaterial, privateKey);
  }
}
