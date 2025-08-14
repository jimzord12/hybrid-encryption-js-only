// ============================================================================
// GRACE PERIOD DECRYPTION API
// ============================================================================

import { Preset } from './enums/index.js';
import { createAppropriateError } from './errors/encryption.errors.js';
import { initializeKeyManagement } from './key-management/index.js';
import { EncryptedData } from './types/encryption.types.js';
import { KeyManagerConfig } from './types/key-manager.types.js';

/**
 * Decrypt data with automatic grace period support during key rotation
 *
 * This function automatically handles key rotation scenarios by:
 * 1. Getting all available decryption keys from KeyManager (current + previous during grace period)
 * 2. Attempting decryption with each key until successful
 * 3. Providing seamless zero-downtime decryption during key transitions
 *
 * @param encryptedData - Data to decrypt
 * @param options - Decryption options (optional)
 * @returns Decrypted data in original type
 */
export async function decrypt<T = any>(
  preset: Preset,
  encryptedData: EncryptedData,
  optionsKeyManager?: KeyManagerConfig,
): Promise<T> {
  // Get KeyManager instance
  const keyManager = await initializeKeyManagement(optionsKeyManager);

  // Get all available decryption keys (includes previous keys during grace period)
  const keyPairs = await keyManager.getDecryptionKeys();

  if (keyPairs.length === 0) {
    throw createAppropriateError('No decryption keys available', {
      preset
      errorType: 'keymanager',
      operation: 'retrieval',
    });
  }

  // Extract private keys for decryption
  const privateKeys = keyPairs.map(pair => pair.privateKey);

  // Use grace period decryption
  return ModernHybridEncryption.decryptWithGracePeriod<T>(
    encryptedData,
    privateKeys,
    optionsEncryption,
  );
}

/**
 * Encrypt data using the current public key from KeyManager
 *
 * @param data - Data to encrypt (any serializable type)
 * @param options - Encryption options (optional)
 * @returns Encrypted data structure
 */
export async function encrypt(
  data: any,
  options?: ModernEncryptionOptions,
): Promise<ModernEncryptedData> {
  const { KeyManager } = await import('./key-management/index.js');
  const { ModernHybridEncryption } = await import('./encryption/index.js');

  // Get KeyManager instance
  const keyManager = KeyManager.getInstance();

  // Get current public key
  const publicKey = await keyManager.getPublicKey();

  // Encrypt with current key
  return ModernHybridEncryption.encrypt(data, publicKey, options);
}
