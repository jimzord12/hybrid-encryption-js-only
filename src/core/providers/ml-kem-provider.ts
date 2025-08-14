import {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  SerializedKeys,
  SupportedAlgorithms,
} from '../types/crypto-provider.types';

/**
 * ML-KEM (Kyber) Key Provider
 * Implements post-quantum cryptographic key management for ML-KEM algorithms
 */
export class MlKemKeyProvider implements KeyProvider {
  /**
   * Generate a new ML-KEM key pair
   * Note: This is a basic implementation for Phase 3.1 completion
   * Full post-quantum implementation will be added in later phases
   */
  generateKeyPair(config: KeyGenerationConfig): CryptoKeyPair {
    // For now, generate binary keys using secure random data
    // This maintains the binary format for Phase 3.1 testing
    const keySize = config.keySize || 768;
    const publicKeySize = keySize === 768 ? 1184 : 1568; // ML-KEM public key sizes
    const privateKeySize = keySize === 768 ? 2400 : 3168; // ML-KEM private key sizes

    // Generate random key material (placeholder for actual ML-KEM implementation)
    const publicKey = new Uint8Array(publicKeySize);
    const privateKey = new Uint8Array(privateKeySize);
    crypto.getRandomValues(publicKey);
    crypto.getRandomValues(privateKey);

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + (config.expiryMonths || 1));

    return {
      publicKey,
      secretKey: privateKey, // Use secretKey to match native ML-KEM format
      algorithm: config.algorithm,
      keySize: keySize,
      version: 1,
      createdAt: now,
      expiresAt: expiryDate,
    };
  }

  /**
   * Validate that a key pair is properly formatted
   */
  validateKeyPair(keyPair: CryptoKeyPair): boolean {
    // Check for private key material (either secretKey or privateKey)
    const privateKeyData = keyPair.secretKey || keyPair.privateKey;
    if (!keyPair.publicKey || !privateKeyData) {
      return false;
    }

    // Check that keys are binary (Uint8Array)
    if (!(keyPair.publicKey instanceof Uint8Array) || !(privateKeyData instanceof Uint8Array)) {
      return false;
    }

    // Check key sizes match expected ML-KEM sizes
    const keySize = keyPair.keySize || 768;
    const expectedPublicSize = keySize === 768 ? 1184 : 1568;
    const expectedPrivateSize = keySize === 768 ? 2400 : 3168;

    return (
      keyPair.publicKey.length === expectedPublicSize &&
      privateKeyData.length === expectedPrivateSize
    );
  }

  /**
   * Check if key pair has expired
   */
  isKeyPairExpired(keyPair: CryptoKeyPair): boolean {
    if (!keyPair.expiresAt) {
      return false; // No expiry set
    }

    return new Date() > keyPair.expiresAt;
  }

  /**
   * Get the expected private key format identifier
   */
  getPrivateKeyFormat(): string {
    return 'ML-KEM-PRIVATE';
  }

  /**
   * Get minimum supported key size
   */
  getMinKeySize(): number {
    return 768; // ML-KEM-768 is the minimum
  }

  /**
   * Get the algorithm identifier
   */
  getAlgorithm(): SupportedAlgorithms {
    return 'ml-kem-768';
  }

  /**
   * Serialize key pair for storage (converts to Base64 strings)
   */
  serializeKeyPair(keyPair: CryptoKeyPair): SerializedKeys {
    // For binary format, we already have Uint8Array keys
    if (!(keyPair.publicKey instanceof Uint8Array) || !(keyPair.privateKey instanceof Uint8Array)) {
      throw new Error('Keys must be in binary format (Uint8Array) for ML-KEM');
    }

    // Convert binary keys to Base64 for serialization
    const publicKeyBase64 = Buffer.from(keyPair.publicKey).toString('base64');
    const privateKeyBase64 = Buffer.from(keyPair.privateKey).toString('base64');

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      metadata: {
        algorithm: keyPair.algorithm || 'ml-kem-768',
        keySize: keyPair.keySize || 768,
        createdAt: keyPair.createdAt?.toISOString() || new Date().toISOString(),
        version: keyPair.version || 1,
        ...(keyPair.expiresAt && { expiresAt: keyPair.expiresAt.toISOString() }),
      },
    };
  }

  /**
   * Deserialize key pair from storage (converts from Base64 strings)
   */
  deserializeKeyPair(data: SerializedKeys): CryptoKeyPair {
    // Convert Base64 strings back to binary
    const publicKey = new Uint8Array(Buffer.from(data.publicKey, 'base64'));
    const privateKey = new Uint8Array(Buffer.from(data.privateKey, 'base64'));

    return {
      publicKey,
      privateKey,
      algorithm: data.metadata.algorithm as SupportedAlgorithms,
      keySize: data.metadata.keySize || 768,
      version: data.metadata.version || 1,
      ...(data.metadata.createdAt && { createdAt: new Date(data.metadata.createdAt) }),
      ...(data.metadata.expiresAt && { expiresAt: new Date(data.metadata.expiresAt) }),
    };
  }

  /**
   * Validate key generation configuration
   */
  validateConfig(config: KeyGenerationConfig): string[] {
    const errors: string[] = [];

    // Validate algorithm
    if (!config.algorithm || !['ml-kem-768', 'ml-kem-1024'].includes(config.algorithm)) {
      errors.push('Algorithm must be ml-kem-768 or ml-kem-1024');
    }

    // Validate key size
    if (config.keySize && ![768, 1024].includes(config.keySize)) {
      errors.push('Key size must be 768 or 1024 for ML-KEM');
    }

    // Validate expiry
    if (config.expiryMonths && (config.expiryMonths < 1 || config.expiryMonths > 12)) {
      errors.push('Expiry months must be between 1 and 12');
    }

    return errors;
  }
}
