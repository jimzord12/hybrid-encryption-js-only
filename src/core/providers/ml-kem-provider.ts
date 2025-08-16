import { Preset } from '../common/enums';
import { isValidPreset } from '../common/guards/enum.guards';
import { KeyPair } from '../common/interfaces/keys.interfaces';
import { SerializedKeys } from '../common/interfaces/serialization.interfaces';
import { ValidationResult } from '../common/interfaces/validation.interfaces';
import { MLKEMAlgorithm } from '../encryption/asymmetric/implementations/post-quantom/ml-kem-alg';
import { DEFAULT_KEY_MANAGER_OPTIONS } from '../key-management/constants/defaults.constants';
import { BufferUtils } from '../utils';
import { KeyProvider } from './interfaces/key-provider.interface';

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
  static generateKeyPair(
    preset: Preset = DEFAULT_KEY_MANAGER_OPTIONS.preset,
    keyVersion?: number,
  ): KeyPair {
    const mlKem = new MLKEMAlgorithm(preset);

    const { publicKey, secretKey } = mlKem.generateKeyPair();

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + (DEFAULT_KEY_MANAGER_OPTIONS.keyExpiryMonths || 1));

    return {
      publicKey,
      secretKey: secretKey,
      metadata: {
        preset: preset,
        createdAt: now,
        expiresAt: expiryDate,
        version: keyVersion || 1,
      },
    };
  }

  /**
   * Validate that a key pair is properly formatted
   */
  validateKeyPair(keyPair: KeyPair): ValidationResult {
    const errors: string[] = [];

    const sk = keyPair.secretKey;
    const pk = keyPair.publicKey;

    const isSkValid = sk && sk instanceof Uint8Array;
    const isPkValid = pk && pk instanceof Uint8Array;

    if (!isSkValid) errors.push('Invalid Secret Key, Uint8Array is expected');
    if (!isPkValid) errors.push('Invalid Public Key, Uint8Array is expected');

    const { preset } = keyPair.metadata;

    if (!isValidPreset(preset)) {
      errors.push(`Invalid Preset, supported only: ${Object.values(Preset)}`);
    } else {
      const expectedPublicSize = preset === Preset.NORMAL ? 1184 : 1568;
      const expectedSecretSize = preset === Preset.NORMAL ? 2400 : 3168;

      if (isSkValid && sk.length !== expectedSecretSize) {
        errors.push(`Secret Key Length is=${sk.length}, should be=${expectedSecretSize}`);
      }

      if (isPkValid && pk.length !== expectedPublicSize) {
        errors.push(`Public Key Length is=${pk.length}, should be=${expectedPublicSize}`);
      }
    }

    const { createdAt, version, expiresAt } = keyPair.metadata;
    if (!createdAt || !(createdAt instanceof Date)) errors.push('Invalid createdAt date');
    if (!expiresAt || !(expiresAt instanceof Date)) errors.push('Invalid expiresAt date');
    if (!version || typeof version !== 'number') errors.push('Invalid version');

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  // /**
  //  * Check if key pair has expired
  //  */
  // isKeyPairExpired(keyPair: KeyPair): ValidationResult {
  //   const errors: string[] = [];

  //   if (!keyPair.metadata.expiresAt) {
  //     errors.push('Keypair does not have an expiry date set');
  //   } else if (new Date() > keyPair.metadata.expiresAt) {
  //     errors.push('Keypair has expired');
  //   }

  //   return {
  //     ok: errors.length === 0,
  //     errors,
  //   };
  // }

  /**
   * Serialize key pair for storage (converts to Base64 strings)
   */
  serializeKeyPair(keyPair: KeyPair): SerializedKeys {
    const { secretKey: sk, publicKey: pk, metadata } = keyPair;
    // For binary format, we already have Uint8Array keys
    if (!(pk instanceof Uint8Array) || !(sk instanceof Uint8Array)) {
      throw new Error('Keys must be in binary format in order to be Serialized');
    }

    // Convert binary keys to Base64 for serialization
    const pk_base64 = BufferUtils.encodeBase64(pk);
    const sk_base64 = BufferUtils.encodeBase64(sk);

    const { createdAt, expiresAt, version, preset } = metadata;

    return {
      publicKey: pk_base64,
      secretKey: sk_base64,
      metadata: {
        preset,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt?.toISOString(),
        version,
      },
    };
  }

  /**
   * Deserialize key pair from storage (converts from Base64 strings)
   */
  deserializeKeyPair(data: SerializedKeys): KeyPair {
    const { publicKey, secretKey, metadata } = data;

    const pk = BufferUtils.decodeBase64(publicKey);
    const sk = BufferUtils.decodeBase64(secretKey);

    const { createdAt, expiresAt, preset, version } = metadata;

    return {
      publicKey: pk,
      secretKey: sk,
      metadata: {
        createdAt: new Date(createdAt),
        expiresAt: new Date(expiresAt),
        version,
        preset,
      },
    };
  }
}
