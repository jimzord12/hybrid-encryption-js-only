import forge from 'node-forge';
import { RSAKeyPair } from '../../types/core.types';

export function getRandomBytes(size: number): Uint8Array {
  // Try crypto.getRandomValues first (available in browsers and modern Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(size));
  }

  // Fallback to forge random bytes
  const randomString = forge.random.getBytesSync(size);
  return new Uint8Array(forge.util.binary.raw.decode(randomString));
}

/**
 * Generate RSA key pair
 * @param keySize - RSA key size in bits
 */
export function generateRSAKeyPair(keySize: number = 2048): RSAKeyPair {
  try {
    if (keySize < 2048) {
      throw new Error('RSA key size must be at least 2048 bits for security');
    }

    const keyPair = forge.pki.rsa.generateKeyPair({ bits: keySize });
    const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // Default 1 month expiry

    return {
      publicKey: publicKeyPem.trim(),
      privateKey: privateKeyPem.trim(),
      version: 1,
      createdAt: now,
      expiresAt,
    };
  } catch (error) {
    console.log('Error generating RSA key pair:', error);
    throw new Error(
      `Key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
