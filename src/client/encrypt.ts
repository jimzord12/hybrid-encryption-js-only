import { DEFAULT_ENCRYPTION_OPTIONS } from '../core/encryption/constants/defaults.constants';
import {
  Base64,
  createAppropriateError,
  decodeBase64,
  EncryptedData,
  HybridEncryption,
  Preset,
} from '../core/encryption/index.js';

export class ClientEncryption {
  private static instance: ClientEncryption | null = null;
  private static isInstantiating = false;
  private encryptionInstance: HybridEncryption | null = null;
  private preset: Preset | null = null;

  private constructor(preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset) {
    if (!ClientEncryption.isInstantiating) {
      throw new Error(
        'ClientEncryption cannot be instantiated directly. Use ClientEncryption.getInstance() instead.',
      );
    }

    this.preset = preset;
    this.encryptionInstance = new HybridEncryption(preset);
  }

  public static getInstance(preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset): ClientEncryption {
    if (!ClientEncryption.instance) {
      ClientEncryption.isInstantiating = true;
      ClientEncryption.instance = new ClientEncryption(preset);
      ClientEncryption.isInstantiating = false;
    }
    return ClientEncryption.instance;
  }

  public static resetInstance(): void {
    if (ClientEncryption.instance) {
      ClientEncryption.instance.encryptionInstance = null;
      ClientEncryption.instance.preset = null;
      ClientEncryption.instance = null;
    }
    ClientEncryption.isInstantiating = false;
  }

  /**
   * Encrypts the given data using the specified public key.
   * @param data - The data to encrypt.
   * @param publicKey - The public key to use for encryption. Can be `Uint8Array` or a Base64-encoded string.
   * @returns The encrypted data.
   */
  public encryptData(data: unknown, publicKey: string | Uint8Array): EncryptedData {
    const binaryPublicKey = this.keyAdapter(publicKey);

    if (this.preset == null) {
      throw createAppropriateError('Preset is not set', {
        errorType: 'operation',
        preset: Preset.NORMAL, // fallback preset for error reporting
        operation: 'encryptData',
      });
    }

    if (this.encryptionInstance == null) {
      throw createAppropriateError('Encryption instance is not initialized', {
        errorType: 'operation',
        preset: this.preset,
        operation: 'encryptData',
      });
    }

    try {
      const encryptedObject = this.encryptionInstance.encrypt(data, binaryPublicKey);
      return encryptedObject;
    } catch (error) {
      throw createAppropriateError('Failed to encrypt data', {
        errorType: 'operation',
        preset: this.preset,
        cause: error instanceof Error ? error : new Error('Unknown error during encryption'),
        operation: 'encryptData',
      });
    }
  }

  private keyAdapter(key: string | Uint8Array): Uint8Array {
    if (typeof key === 'string') {
      return decodeBase64(key as Base64);
    }
    return key;
  }
}
