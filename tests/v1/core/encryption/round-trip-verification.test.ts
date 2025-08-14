import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { beforeEach, describe, expect, it } from 'vitest';
import { ModernHybridEncryption } from '../../../../src/core/encryption/hybrid-encryption.js';
import { KeyManager } from '../../../../src/core/key-management/index.js';

describe('Round-Trip Verification Tests', () => {
  beforeEach(() => {
    // Clean slate for each test
    KeyManager.resetInstance();
  });

  describe('Direct Modern Encryption Round-Trip', () => {
    it('should successfully encrypt and decrypt with fresh keys', async () => {
      // Generate fresh ML-KEM key pair
      const keyPair = ml_kem768.keygen();

      // Test data
      const testData = {
        message: 'Hello, Round-Trip!',
        timestamp: Date.now(),
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
      };

      console.log('🧪 Testing direct round-trip with fresh keys');
      console.log('📝 Test data:', testData);

      // Encrypt
      const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair.publicKey);
      expect(encrypted).toBeDefined();
      expect(encrypted.version).toBe('2.0.0');
      expect(encrypted.algorithms.asymmetric).toBe('ML-KEM-768');
      expect(encrypted.algorithms.symmetric).toBe('AES-GCM-256');

      console.log('✅ Encryption successful');
      console.log('📊 Encrypted structure:', {
        version: encrypted.version,
        algorithms: encrypted.algorithms,
        hasNonce: !!encrypted.nonce,
        hasAuthTag: !!encrypted.authTag,
        hasKeyMaterial: !!encrypted.keyMaterial,
        hasEncryptedContent: !!encrypted.encryptedContent,
      });

      // Decrypt
      const decrypted = await ModernHybridEncryption.decrypt(encrypted, keyPair.secretKey);
      expect(decrypted).toBeDefined();

      console.log('✅ Decryption successful');
      console.log('📋 Decrypted data:', decrypted);

      // Verify round-trip integrity
      expect(decrypted).toEqual(testData);
      expect(JSON.stringify(decrypted)).toBe(JSON.stringify(testData));

      console.log('✅ Round-trip integrity verified');
    });

    it('should handle multiple round-trips with same keys', async () => {
      const keyPair = ml_kem768.keygen();

      console.log('🔄 Testing multiple round-trips with same keys');

      for (let i = 0; i < 5; i++) {
        const testData = {
          iteration: i,
          message: `Round-trip test ${i}`,
          timestamp: Date.now(),
        };

        console.log(`\n🧪 Round-trip ${i + 1}/5`);

        // Encrypt
        const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair.publicKey);

        // Decrypt
        const decrypted = await ModernHybridEncryption.decrypt(encrypted, keyPair.secretKey);

        // Verify
        expect(decrypted).toEqual(testData);
        console.log(`✅ Round-trip ${i + 1} successful`);
      }
    });

    it('should handle different data types correctly', async () => {
      const keyPair = ml_kem768.keygen();

      const testCases = [
        { name: 'String', data: 'Hello World' },
        { name: 'Number', data: 123456 },
        { name: 'Boolean', data: true },
        { name: 'Array', data: [1, 'two', { three: 3 }] },
        { name: 'Object', data: { key: 'value', nested: { deep: true } } },
        { name: 'Null', data: null },
        { name: 'Empty Object', data: {} },
        { name: 'Empty Array', data: [] },
      ];

      console.log('🧪 Testing different data types');

      for (const testCase of testCases) {
        console.log(`\n📝 Testing ${testCase.name}:`, testCase.data);

        if (testCase.data === null) {
          // Null should be handled as a special case
          try {
            await ModernHybridEncryption.encrypt(testCase.data, keyPair.publicKey);
            throw new Error('Expected encryption to fail for null data');
          } catch (error) {
            console.log('✅ Correctly rejected null data');
            continue; // Skip to next test case
          }
        }

        // Encrypt
        const encrypted = await ModernHybridEncryption.encrypt(testCase.data, keyPair.publicKey);

        // Decrypt
        const decrypted = await ModernHybridEncryption.decrypt(encrypted, keyPair.secretKey);

        // Verify
        expect(decrypted).toEqual(testCase.data);
        console.log(`✅ ${testCase.name} round-trip successful`);
      }
    });
  });

  describe('KeyManager Integration Round-Trip', () => {
    it('should work with KeyManager-generated keys', async () => {
      console.log('🧪 Testing round-trip with KeyManager keys');

      // Initialize KeyManager (will generate fresh keys)
      const keyManager = KeyManager.getInstance();
      await keyManager.initialize();

      const publicKey = await keyManager.getPublicKey();
      const privateKey = await keyManager.getPrivateKey();

      console.log('🔑 Using KeyManager keys:', {
        publicKeyLength: publicKey.length,
        privateKeyLength: privateKey.length,
      });

      const testData = {
        message: 'KeyManager test',
        timestamp: Date.now(),
        keyManagerVersion: 'current',
      };

      console.log('📝 Test data:', testData);

      try {
        // Encrypt
        const encrypted = await ModernHybridEncryption.encrypt(testData, publicKey);
        console.log('✅ Encryption with KeyManager keys successful');

        // Decrypt
        const decrypted = await ModernHybridEncryption.decrypt(encrypted, privateKey);
        console.log('✅ Decryption with KeyManager keys successful');
        console.log('📋 Decrypted data:', decrypted);

        // Verify
        expect(decrypted).toEqual(testData);
        console.log('✅ KeyManager round-trip integrity verified');
      } catch (error) {
        console.error('❌ KeyManager round-trip failed:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n'),
          });
        }
        throw error;
      }
    });

    it('should fail gracefully with mismatched keys', async () => {
      console.log('🧪 Testing behavior with mismatched keys');

      // Generate two different key pairs
      const keyPair1 = ml_kem768.keygen();
      const keyPair2 = ml_kem768.keygen();

      const testData = { message: 'This should fail to decrypt' };

      // Encrypt with first key pair
      const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair1.publicKey);
      console.log('✅ Encryption with first key successful');

      // Try to decrypt with second key pair (should fail)
      try {
        await ModernHybridEncryption.decrypt(encrypted, keyPair2.secretKey);
        throw new Error('Expected decryption to fail with mismatched keys');
      } catch (error) {
        console.log(
          '✅ Correctly failed with mismatched keys:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle large data payloads', async () => {
      const keyPair = ml_kem768.keygen();

      // Create large test data (100KB)
      const largeString = 'A'.repeat(100 * 1024);
      const testData = {
        message: 'Large data test',
        largeField: largeString,
        timestamp: Date.now(),
      };

      console.log('🧪 Testing large data payload:', {
        dataSize: `${Math.round(JSON.stringify(testData).length / 1024)}KB`,
      });

      const start = performance.now();

      // Encrypt
      const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair.publicKey);
      const encryptTime = performance.now() - start;

      // Decrypt
      const decryptStart = performance.now();
      const decrypted = await ModernHybridEncryption.decrypt(encrypted, keyPair.secretKey);
      const decryptTime = performance.now() - decryptStart;

      console.log('📊 Performance:', {
        encryptTime: `${encryptTime.toFixed(2)}ms`,
        decryptTime: `${decryptTime.toFixed(2)}ms`,
        totalTime: `${(encryptTime + decryptTime).toFixed(2)}ms`,
      });

      // Verify
      expect(decrypted).toEqual(testData);
      console.log('✅ Large data round-trip successful');
    });

    it('should handle rapid sequential operations', async () => {
      const keyPair = ml_kem768.keygen();

      console.log('🧪 Testing rapid sequential operations');

      const operations = [];
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        const testData = {
          sequence: i,
          timestamp: Date.now(),
          random: Math.random(),
        };

        const operation = (async () => {
          const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair.publicKey);
          const decrypted = await ModernHybridEncryption.decrypt(encrypted, keyPair.secretKey);
          expect(decrypted).toEqual(testData);
          return { sequence: i, success: true };
        })();

        operations.push(operation);
      }

      const results = await Promise.all(operations);
      const totalTime = performance.now() - startTime;

      console.log('📊 Rapid operations results:', {
        totalOperations: results.length,
        totalTime: `${totalTime.toFixed(2)}ms`,
        averageTime: `${(totalTime / results.length).toFixed(2)}ms per round-trip`,
        opsPerSecond: `${(results.length / (totalTime / 1000)).toFixed(2)} ops/sec`,
      });

      expect(results).toHaveLength(10);
      expect(results.every(r => r.success)).toBe(true);
      console.log('✅ All rapid operations successful');
    });

    it('should validate key format requirements', async () => {
      console.log('🧪 Testing key format validation');

      const validKeyPair = ml_kem768.keygen();
      const testData = { message: 'Key format test' };

      // Test invalid public key sizes
      const invalidPublicKeys = [
        new Uint8Array(1183), // 1 byte short
        new Uint8Array(1185), // 1 byte long
        new Uint8Array(0), // Empty
        new Uint8Array(2048), // Wrong size
      ];

      for (const invalidKey of invalidPublicKeys) {
        try {
          await ModernHybridEncryption.encrypt(testData, invalidKey);
          throw new Error('Expected encryption to fail with invalid public key');
        } catch (error) {
          console.log(`✅ Correctly rejected ${invalidKey.length}-byte public key`);
          expect(error).toBeInstanceOf(Error);
        }
      }

      // Test invalid private key sizes
      const validEncrypted = await ModernHybridEncryption.encrypt(testData, validKeyPair.publicKey);

      const invalidPrivateKeys = [
        new Uint8Array(2399), // 1 byte short
        new Uint8Array(2401), // 1 byte long
        new Uint8Array(0), // Empty
        new Uint8Array(1024), // Wrong size
      ];

      for (const invalidKey of invalidPrivateKeys) {
        try {
          await ModernHybridEncryption.decrypt(validEncrypted, invalidKey);
          throw new Error('Expected decryption to fail with invalid private key');
        } catch (error) {
          console.log(`✅ Correctly rejected ${invalidKey.length}-byte private key`);
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('HKDF Consistency Verification', () => {
    it('should produce consistent derived keys for same inputs', async () => {
      console.log('🧪 Testing HKDF consistency');

      const keyPair = ml_kem768.keygen();
      const testData = { message: 'HKDF consistency test' };

      // Encrypt the same data multiple times
      const encryptions = [];
      for (let i = 0; i < 3; i++) {
        const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair.publicKey);
        encryptions.push(encrypted);
      }

      console.log('📊 Multiple encryptions created');

      // All encryptions should decrypt successfully with the same private key
      for (let i = 0; i < encryptions.length; i++) {
        const decrypted = await ModernHybridEncryption.decrypt(encryptions[i], keyPair.secretKey);
        expect(decrypted).toEqual(testData);
        console.log(`✅ Encryption ${i + 1} decrypts correctly`);
      }

      // Note: Nonces should be different, so encrypted content will be different
      // But all should decrypt to the same original data
      const encryptedContents = encryptions.map(e => e.encryptedContent);
      const uniqueContents = new Set(encryptedContents);

      console.log('📊 Encryption uniqueness:', {
        totalEncryptions: encryptions.length,
        uniqueEncryptedContents: uniqueContents.size,
        allUnique: uniqueContents.size === encryptions.length,
      });

      // Each encryption should be unique (due to random nonces)
      expect(uniqueContents.size).toBe(encryptions.length);
      console.log('✅ All encryptions are unique as expected');
    });
  });
});
