/**
 * Abstract base class for asymmetric encryption algorithms
 * Defines the interface that all algorithms must implement
 */
export abstract class AsymmetricAlgorithm {
  constructor(
    protected readonly name: string,
    protected readonly version: string,
  ) {}

  /**
   * Generate a key pair for this algorithm
   * @returns {Object} { publicKey: Uint8Array, privateKey: Uint8Array }
   */
  abstract generateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array };

  /**
   * Generate or derive a shared secret that can be used for symmetric encryption
   * @param publicKey - The recipient's public key
   * @param privateKey - Optional: sender's private key (for ECDH)
   * @returns {Object} { sharedSecret: Uint8Array, keyMaterial: Uint8Array }
   */
  abstract createSharedSecret(
    publicKey: Uint8Array,
    privateKey?: Uint8Array | null,
  ): { sharedSecret: Uint8Array; keyMaterial: Uint8Array };

  /**
   * Recover the shared secret from key material
   * @param keyMaterial - The transmitted key material
   * @param privateKey - The recipient's private key
   * @returns The shared secret
   */
  abstract recoverSharedSecret(keyMaterial: Uint8Array, privateKey: Uint8Array): Uint8Array;

  /**
   * Get algorithm identifier for transmission
   * @returns Algorithm identifier
   */
  getAlgorithmId(): string {
    return `${this.name}@${this.version}`;
  }
}
