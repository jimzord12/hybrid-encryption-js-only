import { KeyProvider, SupportedAlgorithms } from '../types/crypto-provider.types';
import { RSAKeyProvider } from './rsa-key-provider';

/**
 * Factory for creating key providers based on algorithm
 * This allows easy extension for new cryptographic algorithms
 */
export class KeyProviderFactory {
  private static providers: Map<SupportedAlgorithms, () => KeyProvider> = new Map([
    ['rsa', () => new RSAKeyProvider()],
    // Future algorithms can be added here:
    // ['ecc', () => new ECCKeyProvider()],
    // ['ed25519', () => new Ed25519KeyProvider()],
  ]);

  /**
   * Create a key provider for the specified algorithm
   */
  static createProvider(algorithm: SupportedAlgorithms): KeyProvider {
    const providerFactory = this.providers.get(
      algorithm.toLocaleLowerCase() as SupportedAlgorithms
    );

    if (!providerFactory) {
      throw new Error(
        `Unsupported algorithm: ${algorithm}. Supported algorithms: ${Array.from(this.providers.keys()).join(', ')}`
      );
    }

    return providerFactory();
  }

  /**
   * Get list of supported algorithms
   */
  static getSupportedAlgorithms(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Register a new key provider (for future extensibility)
   */
  static registerProvider(algorithm: string, providerFactory: () => KeyProvider): void {
    this.providers.set(algorithm.toLowerCase() as SupportedAlgorithms, providerFactory);
  }

  /**
   * Validate that an algorithm is supported
   */
  static isAlgorithmSupported(algorithm: string): boolean {
    return this.providers.has(algorithm.toLowerCase() as SupportedAlgorithms);
  }
}
