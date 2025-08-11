import { decrypt, encrypt, generateRSAKeyPair, validateKeyPair } from '../../src/client';
import { HybridEncryption } from '../../src/core';
import { RSAKeyPair } from '../../src/types/core.types';

describe('Core Tests | Encryption/Decryption', () => {
  let testKeyPair: RSAKeyPair;

  beforeAll(() => {
    // Generate a test key pair once for all tests
    testKeyPair = generateRSAKeyPair(2048);
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt simple strings', () => {
      const originalData = 'Hello, World!';

      const encrypted = encrypt(originalData, testKeyPair.publicKey);
      const decrypted = decrypt<string>(encrypted, testKeyPair.privateKey);

      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt objects', () => {
      const originalData = {
        message: 'Secret message',
        timestamp: Date.now(),
        user: { id: 123, name: 'John Doe' },
        numbers: [1, 2, 3, 4, 5],
      };

      const encrypted = encrypt(originalData, testKeyPair.publicKey);
      const decrypted = decrypt(encrypted, testKeyPair.privateKey);

      expect(decrypted).toEqual(originalData);
    });

    it('should encrypt and decrypt arrays', () => {
      const originalData = ['apple', 'banana', 'cherry', 123, true, null];

      const encrypted = encrypt(originalData, testKeyPair.publicKey);
      const decrypted = decrypt(encrypted, testKeyPair.privateKey);

      expect(decrypted).toEqual(originalData);
    });

    it('should handle empty data', () => {
      const originalData = '';

      const encrypted = encrypt(originalData, testKeyPair.publicKey);
      const decrypted = decrypt<string>(encrypted, testKeyPair.privateKey);

      expect(decrypted).toBe(originalData);
    });

    it('should handle null and undefined', () => {
      // Encryption
      expect(() => encrypt(null, testKeyPair.publicKey)).toThrowError(
        'Invalid data: Data must be a non-null object'
      );
      expect(() => encrypt(undefined, testKeyPair.publicKey)).toThrowError(
        'Invalid data: Data must be a non-null object'
      );

      // Decryption
      //@ts-ignore
      expect(() => decrypt(null, testKeyPair.privateKey)).toThrowError(
        'Encrypted data is required for decryption'
      );
      //@ts-ignore
      expect(() => decrypt(undefined, testKeyPair.privateKey)).toThrowError(
        'Encrypted data is required for decryption'
      );
    });
  });

  describe('Encrypted Data Structure', () => {
    it('should produce consistent encrypted data structure', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);

      expect(encrypted).toHaveProperty('encryptedContent');
      expect(encrypted).toHaveProperty('encryptedAESKey');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('version');

      expect(typeof encrypted.encryptedContent).toBe('string');
      expect(typeof encrypted.encryptedAESKey).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.authTag).toBe('string');
      expect(encrypted.version).toBe('1.0.0');
    });

    it('should produce different encrypted content for same data', () => {
      const data = { test: 'data' };

      const encrypted1 = encrypt(data, testKeyPair.publicKey);
      const encrypted2 = encrypt(data, testKeyPair.publicKey);

      // Content should be different due to random IV and AES key
      expect(encrypted1.encryptedContent).not.toBe(encrypted2.encryptedContent);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedAESKey).not.toBe(encrypted2.encryptedAESKey);

      // But both should decrypt to the same original data
      const decrypted1 = decrypt(encrypted1, testKeyPair.privateKey);
      const decrypted2 = decrypt(encrypted2, testKeyPair.privateKey);
      expect(decrypted1).toEqual(data);
      expect(decrypted2).toEqual(data);
    });

    it('should have proper base64 encoding in all fields', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);

      // Test that all fields are valid base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(encrypted.encryptedContent).toMatch(base64Regex);
      expect(encrypted.encryptedAESKey).toMatch(base64Regex);
      expect(encrypted.iv).toMatch(base64Regex);
      expect(encrypted.authTag).toMatch(base64Regex);
    });
  });

  describe('Encryption Options', () => {
    it('should support different AES key sizes', () => {
      const data = { test: 'data' };

      const encrypted128 = encrypt(data, testKeyPair.publicKey, { keySize: 128 });
      const encrypted192 = encrypt(data, testKeyPair.publicKey, { keySize: 192 });
      const encrypted256 = encrypt(data, testKeyPair.publicKey, { keySize: 256 });

      // All should decrypt correctly
      expect(decrypt(encrypted128, testKeyPair.privateKey)).toEqual(data);
      expect(decrypt(encrypted192, testKeyPair.privateKey)).toEqual(data);
      expect(decrypt(encrypted256, testKeyPair.privateKey)).toEqual(data);
    });

    it('should support different RSA padding schemes', () => {
      const data = { test: 'data' };

      const encryptedOAEP = encrypt(data, testKeyPair.publicKey, { rsaPadding: 'OAEP' });
      const encryptedPKCS1 = encrypt(data, testKeyPair.publicKey, { rsaPadding: 'PKCS1' });

      // Should decrypt with matching padding
      expect(decrypt(encryptedOAEP, testKeyPair.privateKey, { rsaPadding: 'OAEP' })).toEqual(data);
      expect(decrypt(encryptedPKCS1, testKeyPair.privateKey, { rsaPadding: 'PKCS1' })).toEqual(
        data
      );
    });

    it('should fail with mismatched padding schemes', () => {
      const data = { test: 'data' };
      const encryptedOAEP = encrypt(data, testKeyPair.publicKey, { rsaPadding: 'OAEP' });

      expect(() => {
        decrypt(encryptedOAEP, testKeyPair.privateKey, { rsaPadding: 'PKCS1' });
      }).toThrow();
    });
  });

  describe('Unicode Compatibility', () => {
    it('should produce consistent results across multiple runs', () => {
      // This test ensures deterministic behavior where it should be deterministic
      const keyPair1 = generateRSAKeyPair(2048);
      const keyPair2 = generateRSAKeyPair(2048);

      // Key pairs should be different
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);

      // But validation should work consistently
      expect(validateKeyPair(keyPair1)).toBe(true);
      expect(validateKeyPair(keyPair2)).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const unicodeData = {
        emoji: '🔐🚀💯',
        chinese: '你好世界',
        arabic: 'مرحبا بالعالم',
        russian: 'Привет, мир!',
        mixed: 'Hello 世界 🌍 مرحبا',
      };

      const encrypted = encrypt(unicodeData, testKeyPair.publicKey);
      const decrypted = decrypt(encrypted, testKeyPair.privateKey);

      expect(decrypted).toEqual(unicodeData);
    });

    it('should handle special JSON characters', () => {
      const specialChars = {
        quotes: 'He said "Hello" and she said \'Hi\'',
        backslashes: 'Path: C:\\Users\\Test\\',
        newlines: 'Line 1\nLine 2\r\nLine 3',
        tabs: 'Column 1\tColumn 2',
        control: '\u0000\u0001\u0002',
        escape: '\b\f\n\r\t',
      };

      const encrypted = encrypt(specialChars, testKeyPair.publicKey);
      const decrypted = decrypt(encrypted, testKeyPair.privateKey);

      expect(decrypted).toEqual(specialChars);
    });
  });

  describe('Class vs Function API', () => {
    it('should produce identical results with class and function APIs', () => {
      const data = { api: 'test' };

      // Test with function API
      const encryptedFunc = encrypt(data, testKeyPair.publicKey);
      const decryptedFunc = decrypt(encryptedFunc, testKeyPair.privateKey);

      // Test with class API
      const encryptedClass = HybridEncryption.encrypt(data, testKeyPair.publicKey);
      const decryptedClass = HybridEncryption.decrypt(encryptedClass, testKeyPair.privateKey);

      expect(decryptedFunc).toEqual(data);
      expect(decryptedClass).toEqual(data);
      expect(decryptedFunc).toEqual(decryptedClass);
    });

    it('should work with mixed API usage', () => {
      const data = { mixed: 'api test' };

      // Encrypt with function, decrypt with class
      const encrypted = encrypt(data, testKeyPair.publicKey);
      const decrypted = HybridEncryption.decrypt(encrypted, testKeyPair.privateKey);

      expect(decrypted).toEqual(data);
    });
  });
});

// Export test helper functions for integration tests
export function createTestKeyPair(): RSAKeyPair {
  return generateRSAKeyPair(2048);
}

export function createTestData() {
  return {
    message: 'Test message',
    timestamp: Date.now(),
    user: { id: 123, name: 'Test User' },
    data: [1, 2, 3, { nested: true }],
  };
}
