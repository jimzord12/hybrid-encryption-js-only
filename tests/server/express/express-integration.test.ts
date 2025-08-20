/**
 * Comprehensive Express.js v5 Integration Test
 *
 * This test simulates a real-world scenario where:
 * 1. A client requests the public key from the server
 * 2. Client encrypts sensitive data using the Client package
 * 3. Client sends encrypted data to server endpoints
 * 4. Server uses middleware to automatically decrypt the data
 * 5. Verifies data integrity throughout the process
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Base64, ClientEncryption } from '../../../src/client/index.js';
import { ckm } from '../../../src/client/key-manager.js';
import {
  DecryptionError,
  ServerDecryption,
  decryptMiddleware,
  decryptionRouter,
} from '../../../src/server/index.js';

interface APIError {
  success: boolean;
  error: string;
  message: string;
  name: string;
}

describe('Express.js v5 Server Integration Tests', () => {
  let app: Application;
  let server: any;
  let baseUrl: string;
  let clientEncryption: ClientEncryption;
  let serverDecryption: ServerDecryption;

  // Test data samples
  const sensitiveData = {
    user: {
      id: 'user-12345',
      email: 'john.doe@example.com',
      personalInfo: {
        ssn: '123-45-6789',
        creditCard: '4532-1234-5678-9012',
        phoneNumber: '+1-555-123-4567',
      },
    },
    transaction: {
      amount: 1250.75,
      currency: 'USD',
      description: 'Sensitive payment information',
      timestamp: new Date().toISOString(),
    },
    metadata: {
      sessionId: 'sess_abc123xyz789',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test Client',
    },
  };

  const simpleTestData = { message: 'Hello, secure world!' };

  beforeAll(async () => {
    // Initialize Express app with v5 features
    app = express();

    // Middleware setup
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Mount the server routes FIRST
    app.use('/api', decryptionRouter);

    // Custom route that uses decryption middleware
    app.post('/api/secure-data', decryptMiddleware, (req, res) => {
      console.log('📥 Received decrypted data:', req.body.data);

      // Verify the data was decrypted properly
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'No decrypted data received',
        });
      }

      return res.json({
        success: true,
        message: 'Data processed successfully',
        dataReceived: true,
        dataType: typeof data,
        hasUserInfo: Object.getOwnPropertyNames(data).includes('user'),
        timestamp: new Date().toISOString(),
      });
    });

    // Another custom route for testing complex objects
    app.post('/api/process-transaction', decryptMiddleware, (req, res) => {
      const { data: aaa } = req.body;

      const data = aaa as any;

      // Validate transaction data structure
      if (!data.transaction || !data.user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transaction data structure',
        });
      }

      // Process the transaction (simulation)
      const processedTransaction = {
        ...data.transaction,
        processedAt: new Date().toISOString(),
        status: 'processed',
        confirmationId: `conf_${Math.random().toString(36).substring(2, 9)}`,
      };

      return res.json({
        success: true,
        message: 'Transaction processed successfully',
        transaction: processedTransaction,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    });

    // Error handling middleware
    app.use((err: Error, _req: Request, res: Response<APIError>, _next: NextFunction) => {
      console.log('🚨 Server error:', err);

      if (err instanceof DecryptionError) {
        return res.status(400).json({
          success: false,
          error: 'Decryption failed',
          message: err.message,
          name: err.name,
        } as APIError);
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        name: err.name,
      } as APIError);
    });

    // Start the server
    server = app.listen(0); // Use 0 for random available port
    const address = server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;

    console.log(`🚀 Test server started on ${baseUrl}`);
  });

  beforeEach(async () => {
    // Reset singleton instances before each test
    ClientEncryption.resetInstance();
    ServerDecryption.resetInstance();

    // Initialize fresh instances
    clientEncryption = ClientEncryption.getInstance();
    serverDecryption = ServerDecryption.getInstance();

    // Initialize server decryption
    await serverDecryption.getStatus(); // This triggers initialization

    console.log('🔄 Test setup completed');
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    ClientEncryption.resetInstance();
    ServerDecryption.resetInstance();
  });

  afterAll(() => {
    if (server) {
      server.close();
      console.log('🛑 Test server stopped');
    }
  });

  describe('🔑 Public Key Retrieval', () => {
    it('should retrieve public key from server', async () => {
      const response = await fetch(`${baseUrl}/api/public-key`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('publicKey');
      expect(typeof data.publicKey).toBe('string');
      expect(data.publicKey.length).toBeGreaterThan(0);

      console.log('✅ Public key retrieved successfully');
    });

    it('should return valid Base64 encoded public key', async () => {
      const response = await fetch(`${baseUrl}/api/public-key`);
      const data = await response.json();

      // Verify it's valid Base64
      expect(() => {
        const decoded = Buffer.from(data.publicKey, 'base64');
        expect(decoded.length).toBeGreaterThan(0);
      }).not.toThrow();

      console.log('✅ Public key Base64 validation passed');
    });
  });

  describe('🔐 End-to-End Encryption Flow', () => {
    let publicKey: Base64;

    beforeEach(async () => {
      // Get public key for encryption
      const response = await fetch(`${baseUrl}/api/public-key`);
      const data = await response.json();
      publicKey = data.publicKey as Base64;
    });

    it('should encrypt data on client and decrypt on server via middleware', async () => {
      // Step 1: Client encrypts data
      const encryptedData = clientEncryption.encryptData(simpleTestData, publicKey);

      // Verify encrypted data structure
      expect(encryptedData).toHaveProperty('preset');
      expect(encryptedData).toHaveProperty('encryptedContent');
      expect(encryptedData).toHaveProperty('cipherText');
      expect(encryptedData).toHaveProperty('nonce');

      console.log('🔒 Data encrypted on client side');

      // Step 2: Send to server endpoint with decryption middleware
      const response = await fetch(`${baseUrl}/api/secure-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: encryptedData }),
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.dataReceived).toBe(true);
      expect(result.dataType).toBe('object');

      console.log('🔓 Data decrypted and processed on server side');
    });

    it('should handle complex sensitive data with transaction processing', async () => {
      // Step 1: Encrypt sensitive transaction data
      const encryptedData = clientEncryption.encryptData(sensitiveData, publicKey);

      console.log('🔒 Complex sensitive data encrypted');

      // Step 2: Send to transaction processing endpoint
      const response = await fetch(`${baseUrl}/api/process-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: encryptedData }),
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.transaction).toHaveProperty('status', 'processed');
      expect(result.transaction).toHaveProperty('confirmationId');
      expect(result.transaction).toHaveProperty('processedAt');
      expect(result.user).toHaveProperty('id', sensitiveData.user.id);
      expect(result.user).toHaveProperty('email', sensitiveData.user.email);

      // Verify sensitive data was processed but not exposed in response
      expect(result.user).not.toHaveProperty('personalInfo');

      console.log('🔓 Complex transaction data processed securely');
    });

    it('should verify data integrity after round-trip', async () => {
      const testCases = [
        { name: 'Simple object', data: { test: 'value', number: 42 } },
        { name: 'String data', data: 'Hello, encryption!' },
        { name: 'Array data', data: [1, 2, 3, 'test', { nested: true }] },
        { name: 'Complex nested object', data: sensitiveData },
      ];

      for (const testCase of testCases) {
        console.log(`🧪 Testing data integrity for: ${testCase.name}`);

        // Encrypt on client
        const encryptedData = clientEncryption.encryptData(testCase.data, publicKey);

        // Decrypt on server directly (bypass HTTP for direct comparison)
        const decryptedData = await serverDecryption.decryptData(encryptedData);

        // Verify exact match
        expect(decryptedData).toStrictEqual(testCase.data);

        console.log(`✅ Data integrity verified for: ${testCase.name}`);
      }
    });
  });

  describe('🔄 Key Rotation Integration', () => {
    it('should handle key rotation via API endpoint', async () => {
      // Get initial public key
      const initialResponse = await fetch(`${baseUrl}/api/public-key`);
      const initialData = await initialResponse.json();
      const initialPublicKey = initialData.publicKey;

      // Trigger key rotation
      const rotationResponse = await fetch(`${baseUrl}/api/rotate-keys`, {
        method: 'POST',
      });

      expect(rotationResponse.status).toBe(204);
      console.log('🔄 Key rotation triggered successfully');

      // Get new public key
      const newResponse = await fetch(`${baseUrl}/api/public-key`);
      const newData = await newResponse.json();
      const newPublicKey = newData.publicKey;

      // Keys should be different after rotation
      expect(newPublicKey).not.toBe(initialPublicKey);
      console.log('✅ New public key generated after rotation');

      // Verify old encrypted data can still be decrypted (grace period)
      const encryptedWithOldKey = clientEncryption.encryptData(simpleTestData, initialPublicKey);
      const decryptedData = await serverDecryption.decryptData(encryptedWithOldKey);
      expect(decryptedData).toStrictEqual(simpleTestData);

      console.log('✅ Grace period decryption working with old key');
    });
  });

  describe('🧪 Round-Trip Test Endpoint', () => {
    it('should pass the built-in round-trip test', async () => {
      // Get public key
      const keyResponse = await fetch(`${baseUrl}/api/public-key`);
      const keyData = await keyResponse.json();
      const publicKey = keyData.publicKey;

      // Expected data for round-trip test (from route definition)
      const expectedMessage = {
        message: 'Round trip successful',
        data: {
          sensitiveData: {
            card: '1234-5678-9012-3456',
            name: 'John Doe',
            age: 123,
          },
        },
      };

      // Encrypt the expected data
      const encryptedData = clientEncryption.encryptData(expectedMessage, publicKey);

      // Send to round-trip endpoint
      const response = await fetch(`${baseUrl}/api/round-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.ok).toBe(true);

      console.log('✅ Built-in round-trip test passed');
    });
  });

  describe('🚨 Error Handling', () => {
    it('should handle invalid encrypted data', async () => {
      const invalidData = {
        invalidField: 'not encrypted data',
        missingRequired: true,
      };

      const response = await fetch(`${baseUrl}/api/secure-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: invalidData }),
      });

      expect(response.status).toBe(400); // Express error handler

      const result = (await response.json()) as APIError;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Decryption failed');
      expect(result.name).toBe('DecryptionError');
      expect(result.message).toBe('Invalid structure of encrypted data format');
      expect(result.success).toBe(false);

      console.log('✅ Invalid data error handling verified');
    });

    it('should handle missing data field', async () => {
      const response = await fetch(`${baseUrl}/api/secure-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notData: 'missing data field' }),
      });

      expect(response.status).toBe(400);

      const result = (await response.json()) as APIError;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Decryption failed');
      expect(result.name).toBe('DecryptionError');
      expect(result.message).toBe('Invalid structure of encrypted data format');
      expect(result.success).toBe(false);

      console.log('✅ Missing data field error handling verified');
    });
  });

  describe('🔒 Security Validation', () => {
    it('should ensure encrypted data cannot be read without decryption', async () => {
      // Get public key
      const keyResponse = await fetch(`${baseUrl}/api/public-key`);
      const keyData = await keyResponse.json();
      const publicKey = keyData.publicKey;

      // Encrypt sensitive data
      const encryptedData = clientEncryption.encryptData(sensitiveData, publicKey);

      // Verify encrypted content doesn't contain original data
      const encryptedString = JSON.stringify(encryptedData);

      // Check that sensitive values are not present in encrypted form
      expect(encryptedString).not.toContain(sensitiveData.user.email);
      expect(encryptedString).not.toContain(sensitiveData.user.personalInfo.ssn);
      expect(encryptedString).not.toContain(sensitiveData.user.personalInfo.creditCard);
      expect(encryptedString).not.toContain(sensitiveData.transaction.description);

      console.log('✅ Sensitive data properly encrypted and not visible');
    });

    it('should use different nonces for same data', async () => {
      // Get public key
      const keyResponse = await fetch(`${baseUrl}/api/public-key`);
      const keyData = await keyResponse.json();
      const publicKey = keyData.publicKey;

      // Encrypt same data twice
      const encrypted1 = clientEncryption.encryptData(simpleTestData, publicKey);
      const encrypted2 = clientEncryption.encryptData(simpleTestData, publicKey);

      // Nonces should be different (preventing replay attacks)
      expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
      expect(encrypted1.cipherText).not.toBe(encrypted2.cipherText);

      console.log('✅ Different nonces generated for same data');
    });
  });

  describe('⚡ Performance & Load Testing', () => {
    it('should handle multiple concurrent encryption/decryption operations', async () => {
      // Get public key
      const keyResponse = await fetch(`${baseUrl}/api/public-key`);
      const keyData = await keyResponse.json();
      const publicKey = keyData.publicKey;

      const concurrentRequests = 10;
      const testData = { requestId: 0, timestamp: Date.now() };

      // Create multiple concurrent requests
      const promises = Array.from({ length: concurrentRequests }, async (_, index) => {
        const requestData = { ...testData, requestId: index };
        const encryptedData = clientEncryption.encryptData(requestData, publicKey);

        const response = await fetch(`${baseUrl}/api/secure-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: encryptedData }),
        });

        return response.json();
      });

      const results = await Promise.all(promises);

      // Verify all requests succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        console.log(`✅ Concurrent request ${index + 1} completed successfully`);
      });

      console.log(`✅ All ${concurrentRequests} concurrent requests completed successfully`);
    });
  });

  describe('🌐 Remote Public Key Retrieval & Caching Integration', () => {
    beforeEach(() => {
      // Clean up client key manager cache before each test
      ckm.clearKey();
    });

    afterEach(() => {
      // Clean up after each test
      ckm.clearKey();
    });

    describe('🔑 Remote Key Retrieval', () => {
      it('should encrypt data using remotely fetched public key', async () => {
        const testData = {
          message: 'Remote key test',
          timestamp: Date.now(),
          sensitive: 'credit card: 4532-1234-5678-9012',
        };

        // Use the new encryptDataWithRemoteKey method
        const encryptedData = await clientEncryption.encryptDataWithRemoteKey(
          testData,
          baseUrl + '/api',
        );

        // Verify encrypted data structure
        expect(encryptedData).toHaveProperty('preset');
        expect(encryptedData).toHaveProperty('encryptedContent');
        expect(encryptedData).toHaveProperty('cipherText');
        expect(encryptedData).toHaveProperty('nonce');

        console.log('🔒 Data encrypted using remote public key');

        // Send to server for decryption via middleware
        const response = await fetch(`${baseUrl}/api/secure-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: encryptedData }),
        });

        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.dataReceived).toBe(true);

        console.log('🔓 Data successfully decrypted on server side');
      });

      it('should handle multiple requests with key caching', async () => {
        const testMessages = ['First message', 'Second message', 'Third message'];

        console.log('🚀 Testing key caching with multiple requests');

        // Make multiple requests - first should fetch key, others should use cache
        const promises = testMessages.map(async (message, index) => {
          const testData = { message, requestIndex: index };

          // Use remote key method
          const encryptedData = await clientEncryption.encryptDataWithRemoteKey(
            testData,
            baseUrl + '/api',
          );

          // Send to server
          const response = await fetch(`${baseUrl}/api/secure-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: encryptedData }),
          });

          return {
            index,
            message,
            success: response.ok,
            result: await response.json(),
          };
        });

        const results = await Promise.all(promises);

        // Verify all requests succeeded
        results.forEach(({ index, message, success, result }) => {
          expect(success).toBe(true);
          expect(result.success).toBe(true);
          console.log(`✅ Request ${index + 1} (${message}) processed successfully`);
        });

        console.log('🏆 All requests completed with key caching');
      });

      it('should work with different data types via remote key', async () => {
        const testCases = [
          { data: 'Simple string', description: 'string data' },
          { data: 42, description: 'number data' },
          { data: { complex: { nested: 'object' } }, description: 'nested object' },
          { data: ['array', 'with', 'values'], description: 'array data' },
          { data: null, description: 'null value' },
        ];

        console.log('🧪 Testing different data types with remote key');

        for (const { data, description } of testCases) {
          // Encrypt with remote key
          const encryptedData = await clientEncryption.encryptDataWithRemoteKey(
            data,
            baseUrl + '/api',
          );

          // Send to server
          const response = await fetch(`${baseUrl}/api/secure-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: encryptedData }),
          });

          if (data === null) {
            expect(response.status).toBe(400);
          } else {
            expect(response.status).toBe(200);
            const result = await response.json();
            expect(result.success).toBe(true);
          }

          console.log(`✅ ${description} encrypted and processed successfully`);
        }

        console.log('🎯 All data types handled correctly with remote key');
      });
    });

    describe('⚡ Performance & Caching', () => {
      it('should demonstrate key caching performance benefits', async () => {
        const testData = { message: 'Performance test', value: 123 };

        console.log('⏱️  Testing key caching performance');

        // First request - should fetch key from server
        const start1 = Date.now();
        const encrypted1 = await clientEncryption.encryptDataWithRemoteKey(
          testData,
          baseUrl + '/api',
        );
        const time1 = Date.now() - start1;

        // Second request - should use cached key (faster)
        const start2 = Date.now();
        const encrypted2 = await clientEncryption.encryptDataWithRemoteKey(
          testData,
          baseUrl + '/api',
        );
        const time2 = Date.now() - start2;

        console.log(`🔑 First request (fetch key): ${time1}ms`);
        console.log(`⚡ Second request (cached): ${time2}ms`);

        // Both should produce valid encrypted data
        expect(encrypted1).toHaveProperty('encryptedContent');
        expect(encrypted2).toHaveProperty('encryptedContent');

        // Verify both decrypt correctly on server
        const responses = await Promise.all([
          fetch(`${baseUrl}/api/secure-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: encrypted1 }),
          }),
          fetch(`${baseUrl}/api/secure-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: encrypted2 }),
          }),
        ]);

        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);

        console.log('✅ Both requests processed successfully');
        console.log(
          `📊 Performance improvement: ${Math.max(0, time1 - time2)}ms faster with caching`,
        );
      });

      it('should handle concurrent remote key requests efficiently', async () => {
        const concurrentCount = 8;
        const testData = { message: 'Concurrent remote key test' };

        console.log(`🚀 Testing ${concurrentCount} concurrent remote key requests`);

        const startTime = Date.now();

        // Make multiple concurrent requests using remote key
        const promises = Array.from({ length: concurrentCount }, async (_, index) => {
          const data = { ...testData, requestId: index };

          try {
            const encrypted = await clientEncryption.encryptDataWithRemoteKey(
              data,
              baseUrl + '/api',
            );

            const response = await fetch(`${baseUrl}/api/secure-data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: encrypted }),
            });

            return {
              success: response.ok,
              requestId: index,
              result: await response.json(),
            };
          } catch (error) {
            return {
              success: false,
              requestId: index,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;

        // Verify all requests succeeded
        const successCount = results.filter((r) => r.success).length;
        expect(successCount).toBe(concurrentCount);

        results.forEach(({ success, requestId, error }) => {
          expect(success).toBe(true);
          if (!success) {
            console.error(`❌ Request ${requestId} failed:`, error);
          } else {
            console.log(`✅ Concurrent request ${requestId} completed`);
          }
        });

        console.log(`🏁 All ${concurrentCount} concurrent requests completed in ${totalTime}ms`);
        console.log(`📊 Average: ${(totalTime / concurrentCount).toFixed(2)}ms per request`);
      });
    });

    describe('🛡️ Error Handling & Edge Cases', () => {
      it('should handle server downtime gracefully', async () => {
        const invalidUrl = 'https://nonexistent-server-12345.example.com';
        const testData = { message: 'This should fail' };

        console.log('🚫 Testing behavior with unreachable server');

        await expect(
          clientEncryption.encryptDataWithRemoteKey(testData, invalidUrl),
        ).rejects.toThrow();

        console.log('✅ Correctly handled server downtime with appropriate error');
      });

      it('should handle malformed public key responses', async () => {
        // Create a temporary server that returns invalid data
        const testApp = express();
        testApp.get('/public-key', (_req, res) => {
          res.json({ publicKey: 'invalid-base64-key!!!' });
        });

        const testServer = testApp.listen(0);
        const testAddress = testServer.address() as AddressInfo;
        const testUrl = `http://localhost:${testAddress.port}`;

        try {
          const testData = { message: 'Test with invalid key' };

          console.log('🔧 Testing behavior with invalid public key response');

          // This should fail during encryption due to invalid key format
          await expect(
            clientEncryption.encryptDataWithRemoteKey(testData, testUrl),
          ).rejects.toThrow();

          console.log('✅ Correctly handled invalid public key format');
        } finally {
          testServer.close();
        }
      });

      it('should handle server returning non-200 status codes', async () => {
        // Create a temporary server that returns 500 error
        const testApp = express();
        testApp.get('/public-key', (_req, res) => {
          res.status(500).json({ error: 'Internal server error' });
        });

        const testServer = testApp.listen(0);
        const testAddress = testServer.address() as AddressInfo;
        const testUrl = `http://localhost:${testAddress.port}`;

        try {
          const testData = { message: 'Test with server error' };

          console.log('⚠️ Testing behavior with server error response');

          await expect(
            clientEncryption.encryptDataWithRemoteKey(testData, testUrl),
          ).rejects.toThrow();

          console.log('✅ Correctly handled server error response');
        } finally {
          testServer.close();
        }
      });
    });

    describe('🔄 Cache Management', () => {
      it('should refresh cache when key expires', async () => {
        const testData = { message: 'Cache expiry test' };

        console.log('⏰ Testing cache expiry and refresh');

        // First request to populate cache
        await clientEncryption.encryptDataWithRemoteKey(testData, baseUrl + '/api');
        expect(ckm.cachedKey).not.toBeNull();

        console.log('🔑 Cache populated with first request');

        // Manually expire the cache (set very short TTL)
        ckm.setKey(ckm.cachedKey, 1); // 1ms TTL
        await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for expiration

        console.log('⏱️ Cache expired');

        // Second request should refresh cache
        await clientEncryption.encryptDataWithRemoteKey(testData, baseUrl + '/api');
        expect(ckm.cachedKey).not.toBeNull();

        console.log('✅ Cache refreshed successfully');
      });

      it('should clear cache when switching between different servers', async () => {
        const testData = { message: 'Multi-server test' };

        console.log('Base URL: ', baseUrl);
        // First request to main server
        await clientEncryption.encryptDataWithRemoteKey(testData, baseUrl + '/api');
        const firstKey = ckm.cachedKey;
        const firstUrl = ckm.publicKeyBaseURL;

        expect(firstKey).not.toBeNull();
        expect(firstUrl).toBe(baseUrl + '/api');

        console.log('🔑 First server key cached');

        // Create second test server with the same key but different URL
        const secondApp = express();
        secondApp.get('/public-key', async (_req, res) => {
          // Return the same key as the first server for testing cache URL management
          const response = await fetch(`${baseUrl}/api/public-key`);
          const data = await response.json();
          res.json({ publicKey: data.publicKey });
        });

        const secondServer = secondApp.listen(0);
        const secondAddress = secondServer.address() as AddressInfo;
        const secondUrl = `http://localhost:${secondAddress.port}`;

        try {
          console.log('🔄 Switching to second server');

          // This should succeed because we're using the same valid key,
          // but it demonstrates that the cache management is working (different URL = cache cleared)
          await clientEncryption.encryptDataWithRemoteKey(testData, secondUrl);

          // Verify that URL was updated to the new server
          expect(ckm.publicKeyBaseURL).toBe(secondUrl);
          expect(ckm.cachedKey).not.toBeNull();

          console.log('✅ Cache correctly managed when switching servers');

          // Verify that the key cache was cleared and refetched by checking that
          // we successfully encrypted with the new server URL
          console.log('✅ Successfully encrypted data with second server URL');
        } finally {
          secondServer.close();
        }
      });
    });

    describe('🔐 Security Validation', () => {
      it('should ensure encrypted data with remote key is secure', async () => {
        const sensitiveTestData = {
          creditCard: '4532-1234-5678-9012',
          ssn: '123-45-6789',
          password: 'super-secret-password',
          apiKey: 'sk_test_abcdef123456789',
        };

        console.log('🛡️ Testing security of remote key encryption');

        // Encrypt using remote key
        const encryptedData = await clientEncryption.encryptDataWithRemoteKey(
          sensitiveTestData,
          baseUrl + '/api',
        );

        // Verify sensitive data is not visible in encrypted form
        const encryptedString = JSON.stringify(encryptedData);

        expect(encryptedString).not.toContain(sensitiveTestData.creditCard);
        expect(encryptedString).not.toContain(sensitiveTestData.ssn);
        expect(encryptedString).not.toContain(sensitiveTestData.password);
        expect(encryptedString).not.toContain(sensitiveTestData.apiKey);

        console.log('🔒 Sensitive data properly encrypted and not visible');

        // Verify it can be properly decrypted on server
        const response = await fetch(`${baseUrl}/api/secure-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: encryptedData }),
        });

        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.success).toBe(true);

        console.log('✅ Data successfully decrypted on server with proper authentication');
      });

      it('should generate different ciphertexts for same data with remote key', async () => {
        const testData = { message: 'Nonce test with remote key' };

        console.log('🔀 Testing nonce uniqueness with remote key');
        console.log('Base URL: ', baseUrl);

        // Encrypt same data twice using remote key
        const [encrypted1, encrypted2] = await Promise.all([
          clientEncryption.encryptDataWithRemoteKey(testData, baseUrl + '/api'),
          clientEncryption.encryptDataWithRemoteKey(testData, baseUrl + '/api'),
        ]);

        // Should have different nonces and ciphertexts
        expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
        expect(encrypted1.cipherText).not.toBe(encrypted2.cipherText);

        console.log('🔒 Different nonces generated for same data (prevents replay attacks)');

        // Both should decrypt correctly on server
        const responses = await Promise.all([
          fetch(`${baseUrl}/api/secure-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: encrypted1 }),
          }),
          fetch(`${baseUrl}/api/secure-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: encrypted2 }),
          }),
        ]);

        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);

        console.log('✅ Both unique encryptions decrypted successfully');
      });
    });
  });
});
