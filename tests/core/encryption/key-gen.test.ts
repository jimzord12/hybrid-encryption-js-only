import { generateRSAKeyPair, validateKeyPair } from '../../../src/client';
import { HybridEncryption } from '../../../src/core';
import { RSAKeyPair } from '../../../src/core/types/encryption.types';

describe('Core Tests | Key Management', () => {
  let testKeyPair: RSAKeyPair;

  beforeAll(() => {
    // Generate a test key pair once for all tests
    testKeyPair = generateRSAKeyPair(2048);
  });

  describe('Key Generation', () => {
    it('should generate valid RSA PKCS#1 key pairs', () => {
      const keyPair = generateRSAKeyPair(); // default size = 2048

      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keyPair.privateKey).toContain('-----BEGIN RSA PRIVATE KEY-----');
      expect(keyPair.version).toBe(1);
      expect(keyPair.createdAt).toBeInstanceOf(Date);
      expect(keyPair.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = generateRSAKeyPair(2048);
      const keyPair2 = generateRSAKeyPair(2048);

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });

    it('should reject key sizes smaller than 2048', () => {
      expect(() => generateRSAKeyPair(1024)).toThrow('RSA key size must be at least 2048 bits');
    });

    it('should generate keys with different sizes', () => {
      const keyPair2048 = generateRSAKeyPair(2048);
      const keyPair4096 = generateRSAKeyPair(4096);

      // 4096-bit keys should have longer private keys
      expect(keyPair4096.privateKey.length).toBeGreaterThan(keyPair2048.privateKey.length);
    });
  });

  describe('Key Validation', () => {
    it('should validate correct key pairs', () => {
      expect(validateKeyPair(testKeyPair)).toBe(true);
    });

    it('should reject mismatched key pairs', () => {
      const keyPair1 = generateRSAKeyPair(2048);
      const keyPair2 = generateRSAKeyPair(2048);

      const mismatchedPair: RSAKeyPair = {
        publicKey: keyPair1.publicKey,
        privateKey: keyPair2.privateKey, // Wrong private key
      };

      expect(validateKeyPair(mismatchedPair)).toBe(false);
    });

    it('should handle invalid key formats', () => {
      const invalidKeyPair: RSAKeyPair = {
        publicKey: 'invalid-key',
        privateKey: 'invalid-key',
      };

      expect(validateKeyPair(invalidKeyPair)).toBe(false);
    });

    it('should check key expiry correctly', () => {
      const expiredKeyPair: RSAKeyPair = {
        ...testKeyPair,
        expiresAt: new Date('2020-01-01'), // Past date
      };

      expect(HybridEncryption.isKeyPairExpired(expiredKeyPair)).toBe(true);
      expect(HybridEncryption.isKeyPairExpired(testKeyPair)).toBe(false);
    });
  });
});
