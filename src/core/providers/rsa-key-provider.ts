import { HybridEncryption } from '../encryption';
import {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  SerializedKeyMetadata,
  SerializedKeys,
} from '../types/crypto-provider.types';
import { RSAKeyPair } from '../types/encryption.types';
import { generateRSAKeyPair } from '../utils';

/**
 * RSA Key Provider - implements KeyProvider interface for RSA algorithm
 * This maintains backward compatibility with existing RSA-based encryption
 */
export class RSAKeyProvider implements KeyProvider {
  getAlgorithm(): 'rsa' {
    return 'rsa';
  }

  generateKeyPair(config: KeyGenerationConfig): CryptoKeyPair {
    const keySize = config.keySize || this.getMinKeySize();
    const rsaKeys = generateRSAKeyPair(keySize);

    // Create the result object with required properties first
    const result: CryptoKeyPair = {
      publicKey: rsaKeys.publicKey,
      privateKey: rsaKeys.privateKey,
      algorithm: 'rsa',
    };

    // Only set optional properties if they exist
    if (rsaKeys.version !== undefined) {
      result.version = rsaKeys.version;
    }

    if (rsaKeys.createdAt !== undefined) {
      result.createdAt = rsaKeys.createdAt;
    }

    if (rsaKeys.expiresAt !== undefined) {
      result.expiresAt = rsaKeys.expiresAt;
    } else if (config.expiryMonths) {
      // Set expiry based on config if not already set
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + config.expiryMonths);
      result.expiresAt = expiresAt;
    }

    result.keySize = keySize;

    return result;
  }

  validateKeyPair(keyPair: CryptoKeyPair): boolean {
    try {
      // Create RSAKeyPair compatible object for HybridEncryption
      const rsaKeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        version: keyPair.version,
        createdAt: keyPair.createdAt,
        expiresAt: keyPair.expiresAt,
      } as RSAKeyPair;

      return HybridEncryption.validateKeyPair(rsaKeyPair);
    } catch (error) {
      return false;
    }
  }

  isKeyPairExpired(keyPair: CryptoKeyPair): boolean {
    // Create RSAKeyPair compatible object for HybridEncryption
    const rsaKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      version: keyPair.version,
      createdAt: keyPair.createdAt,
      expiresAt: keyPair.expiresAt,
    } as RSAKeyPair;

    return HybridEncryption.isKeyPairExpired(rsaKeyPair);
  }

  getPrivateKeyFormat(): string {
    return 'BEGIN RSA PRIVATE KEY';
  }

  getMinKeySize(): number {
    return 2048;
  }

  serializeKeyPair(keyPair: CryptoKeyPair): SerializedKeys {
    const metadata: SerializedKeyMetadata = {
      algorithm: keyPair.algorithm,
    };

    // Only set properties if they're defined
    if (keyPair.keySize !== undefined) {
      metadata.keySize = keyPair.keySize;
    }

    if (keyPair.version !== undefined) {
      metadata.version = keyPair.version;
    }

    if (keyPair.createdAt !== undefined) {
      metadata.createdAt = keyPair.createdAt.toISOString();
    }

    if (keyPair.expiresAt !== undefined) {
      metadata.expiresAt = keyPair.expiresAt.toISOString();
    }

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      metadata,
    };
  }

  deserializeKeyPair(data: SerializedKeys): CryptoKeyPair {
    const result: CryptoKeyPair = {
      publicKey: data.publicKey,
      privateKey: data.privateKey,
      algorithm: data.metadata.algorithm,
    };

    // Only set optional properties if they exist
    if (data.metadata.keySize !== undefined) {
      result.keySize = data.metadata.keySize;
    }

    if (data.metadata.version !== undefined) {
      result.version = data.metadata.version;
    }

    if (data.metadata.createdAt !== undefined) {
      result.createdAt = new Date(data.metadata.createdAt);
    }

    if (data.metadata.expiresAt !== undefined) {
      result.expiresAt = new Date(data.metadata.expiresAt);
    }

    return result;
  }

  validateConfig(config: KeyGenerationConfig): string[] {
    const errors: string[] = [];

    // Validate algorithm
    if (config.algorithm !== 'rsa') {
      errors.push(`Algorithm must be 'rsa' for RSAKeyProvider (got '${config.algorithm}')`);
    }

    // Validate key size
    const keySize = config.keySize || this.getMinKeySize();
    if (keySize < this.getMinKeySize()) {
      errors.push(`RSA key size must be at least ${this.getMinKeySize()} bits (got ${keySize})`);
    }

    // Validate expiry months
    if (config.expiryMonths !== undefined && config.expiryMonths <= 0) {
      errors.push(`Expiry months must be positive (got ${config.expiryMonths})`);
    }

    // RSA doesn't use curve parameter
    if (config.curve) {
      errors.push('RSA algorithm does not use curve parameter');
    }

    return errors;
  }
}
