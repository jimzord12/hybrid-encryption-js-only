import { decrypt, encrypt, generateRSAKeyPair } from '../../../src/client';
import { EncryptedData, RSAKeyPair } from '../../../src/core/types/encryption.types';

describe('Core Tests | Error Handling', () => {
  let testKeyPair: RSAKeyPair;

  beforeAll(() => {
    // Generate a test key pair once for all tests
    testKeyPair = generateRSAKeyPair(2048);
  });

  describe('Error Handling', () => {
    it('should throw error with invalid public key for encryption', () => {
      const data = { test: 'data' };
      const invalidPublicKey = 'invalid-public-key';

      expect(() => {
        encrypt(data, invalidPublicKey);
      }).toThrow('Encryption failed');
    });

    it('should throw error with invalid private key for decryption', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);
      const invalidPrivateKey = 'invalid-private-key';

      expect(() => {
        decrypt(encrypted, invalidPrivateKey);
      }).toThrow('Decryption failed');
    });

    it('should throw error with wrong private key', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);
      const wrongKeyPair = generateRSAKeyPair(2048);

      expect(() => {
        decrypt(encrypted, wrongKeyPair.privateKey);
      }).toThrow('Decryption failed');
    });

    it('should throw error with corrupted encrypted data', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);

      // Corrupt the encrypted content
      const corruptedData: EncryptedData = {
        ...encrypted,
        encryptedContent: 'corrupted-data',
      };

      expect(() => {
        decrypt(corruptedData, testKeyPair.privateKey);
      }).toThrow('Decryption failed');
    });

    it('should throw error with unsupported version', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);

      const futureVersionData: EncryptedData = {
        ...encrypted,
        version: '2.0.0', // Future version
      };

      expect(() => {
        decrypt(futureVersionData, testKeyPair.privateKey);
      }).toThrow('Unsupported version: 2.0.0');
    });

    it('should throw error with tampered auth tag', () => {
      const data = { test: 'data' };
      const encrypted = encrypt(data, testKeyPair.publicKey);

      // Tamper with auth tag
      const tamperedData: EncryptedData = {
        ...encrypted,
        authTag: 'dGFtcGVyZWRhdXRodGFn', // "tamperedauthtag" in base64
      };

      expect(() => {
        decrypt(tamperedData, testKeyPair.privateKey);
      }).toThrow('Decryption failed');
    });
  });
});
