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

import express, { Application } from 'express';
import { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ClientEncryption } from '../../../src/client/index.js';
import {
  DecryptionError,
  ServerDecryption,
  decryptMiddleware,
  decryptionRouter,
} from '../../../src/server/index.js';

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
    app.use((err: any, _req: any, res: any) => {
      console.error('🚨 Server error:', err);

      if (err instanceof DecryptionError) {
        return res.status(400).json({
          success: false,
          error: 'Decryption failed',
          message: err.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
      });
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
    let publicKey: string;

    beforeEach(async () => {
      // Get public key for encryption
      const response = await fetch(`${baseUrl}/api/public-key`);
      const data = await response.json();
      publicKey = data.publicKey;
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

      expect(response.status).toBe(500); // Express error handler

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

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

      expect(response.status).toBe(500); // Express error handler
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
});
