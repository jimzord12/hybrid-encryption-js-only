import {
  CryptoKeyPair,
  KeyGenerationConfig,
  KeyProvider,
  SerializedKeys,
  SupportedAlgorithms,
} from '../types/crypto-provider.types';

export class MlKemKeyProvider implements KeyProvider {
  generateKeyPair(_config: KeyGenerationConfig): CryptoKeyPair {
    throw new Error('Method not implemented.');
  }
  validateKeyPair(_keyPair: CryptoKeyPair): boolean {
    throw new Error('Method not implemented.');
  }
  isKeyPairExpired(_keyPair: CryptoKeyPair): boolean {
    throw new Error('Method not implemented.');
  }
  getPrivateKeyFormat(): string {
    throw new Error('Method not implemented.');
  }
  getMinKeySize(): number {
    throw new Error('Method not implemented.');
  }
  getAlgorithm(): SupportedAlgorithms {
    throw new Error('Method not implemented.');
  }
  serializeKeyPair(_keyPair: CryptoKeyPair): SerializedKeys {
    throw new Error('Method not implemented.');
  }
  deserializeKeyPair(_data: SerializedKeys): CryptoKeyPair {
    throw new Error('Method not implemented.');
  }
  validateConfig(_config: KeyGenerationConfig): string[] {
    throw new Error('Method not implemented.');
  }
}
