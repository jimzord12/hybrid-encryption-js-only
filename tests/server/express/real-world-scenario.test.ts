/**
 * Real-World Scenario Test
 *
 * This test demonstrates the exact workflow you described:
 * 1. Client asks for the public key
 * 2. Client uses the Client package to encrypt sensitive data
 * 3. Client sends the encrypted data to the server
 * 4. Server uses middleware to automatically decrypt the data
 * 5. Verifies data integrity and no corruption
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ClientEncryption } from '../../../src/client/index.js';
import { DecryptionError, ServerDecryption, decryptMiddleware } from '../../../src/server/index.js';

describe('Real-World Express.js Server Scenario', () => {
  let app: Application;
  let server: any;
  let baseUrl: string;

  // This represents a real client application
  let clientApp: ClientEncryption;

  // Sample sensitive data that a real client might send
  const sensitiveUserData = {
    personalInfo: {
      fullName: 'Alice Johnson',
      socialSecurityNumber: '123-45-6789',
      dateOfBirth: '1990-05-15',
      address: {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
      },
    },
    financialInfo: {
      creditCardNumber: '4532-1234-5678-9012',
      expirationDate: '12/25',
      cvv: '123',
      bankAccount: {
        routingNumber: '021000021',
        accountNumber: '123456789',
      },
    },
    sessionData: {
      userId: 'usr_abc123',
      sessionToken: 'sess_xyz789',
      lastLogin: new Date().toISOString(),
      permissions: ['read', 'write', 'admin'],
    },
  };

  beforeAll(async () => {
    console.log('\n🚀 Starting Real-World Server Scenario Test');
    console.log('==================================================');

    // Create Express.js v5 server
    app = express();

    // Basic middleware
    app.use(express.json({ limit: '10mb' }));

    // 📍 STEP 1: Public Key Endpoint (what client calls first)
    app.get('/api/public-key', async (_req: Request, res: Response) => {
      try {
        console.log('📝 Client requested public key');

        const serverDecryption = ServerDecryption.getInstance();
        const publicKey = await serverDecryption.getPublicKeyBase64();

        if (!publicKey) {
          throw new Error('Failed to generate public key');
        }

        console.log('🔑 Public key generated and sent to client');
        res.json({
          success: true,
          publicKey,
          keyLength: publicKey.length,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ Error generating public key:', error);
        res.status(500).json({ success: false, error: 'Failed to generate public key' });
      }
    });

    // 📍 STEP 3 & 4: Data processing endpoint with automatic decryption middleware
    app.post('/api/process-user-data', decryptMiddleware, (req: Request, res: Response) => {
      console.log('📥 Encrypted data received and automatically decrypted by middleware');

      const decryptedData = req.body.data;

      // Simulate processing the sensitive data
      console.log('🔍 Processing user data...');
      console.log(`   - User: ${decryptedData.personalInfo.fullName}`);
      console.log(`   - Session: ${decryptedData.sessionData.userId}`);
      console.log(`   - Permissions: ${decryptedData.sessionData.permissions.join(', ')}`);

      // Verify data integrity (this proves no corruption occurred)
      const dataIntegrityCheck = {
        hasPersonalInfo: !!decryptedData.personalInfo,
        hasFinancialInfo: !!decryptedData.financialInfo,
        hasSessionData: !!decryptedData.sessionData,
        fullNameMatches:
          decryptedData.personalInfo.fullName === sensitiveUserData.personalInfo.fullName,
        userIdMatches: decryptedData.sessionData.userId === sensitiveUserData.sessionData.userId,
        creditCardMatches:
          decryptedData.financialInfo.creditCardNumber ===
          sensitiveUserData.financialInfo.creditCardNumber,
      };

      console.log('✅ Data integrity verified - no corruption detected');

      // Send response (without exposing sensitive data)
      res.json({
        success: true,
        message: 'User data processed successfully',
        processedAt: new Date().toISOString(),
        dataIntegrity: dataIntegrityCheck,
        userInfo: {
          name: decryptedData.personalInfo.fullName,
          userId: decryptedData.sessionData.userId,
          permissions: decryptedData.sessionData.permissions,
        },
      });
    });

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof DecryptionError) {
        console.error('🔐 Decryption failed:', err.message);
        return res.status(400).json({
          success: false,
          error: 'Failed to decrypt data',
          message: err.message,
        });
      }

      console.error('🚨 Server error:', err);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    });

    // Start server
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;

    console.log(`🌐 Server running at ${baseUrl}`);
  });

  beforeEach(() => {
    // Reset instances for clean test
    ClientEncryption.resetInstance();
    ServerDecryption.resetInstance();

    // Initialize client
    clientApp = ClientEncryption.getInstance();

    console.log('\n🔄 Test setup: Fresh client and server instances created');
  });

  afterEach(() => {
    ClientEncryption.resetInstance();
    ServerDecryption.resetInstance();
  });

  afterAll(() => {
    if (server) {
      server.close();
      console.log('\n🛑 Server stopped');
    }
  });

  it('should complete the full real-world scenario successfully', async () => {
    console.log('\n📋 EXECUTING REAL-WORLD SCENARIO');
    console.log('================================');

    // 📍 STEP 1: Client asks for the public key
    console.log('\n1️⃣ Client requesting public key from server...');

    const keyResponse = await globalThis.fetch(`${baseUrl}/api/public-key`);
    expect(keyResponse.status).toBe(200);

    const keyData = await keyResponse.json();
    expect(keyData.success).toBe(true);
    expect(keyData.publicKey).toBeDefined();
    expect(typeof keyData.publicKey).toBe('string');

    const publicKey = keyData.publicKey;
    console.log(`✅ Public key received (${publicKey.length} characters)`);

    // 📍 STEP 2: Client uses the Client package to encrypt sensitive data
    console.log('\n2️⃣ Client encrypting sensitive data using Client package...');

    const encryptedData = clientApp.encryptData(sensitiveUserData, publicKey);

    // Verify encryption worked
    expect(encryptedData).toHaveProperty('preset');
    expect(encryptedData).toHaveProperty('encryptedContent');
    expect(encryptedData).toHaveProperty('cipherText');
    expect(encryptedData).toHaveProperty('nonce');

    // Verify sensitive data is not visible in encrypted form
    const encryptedString = JSON.stringify(encryptedData);
    expect(encryptedString).not.toContain('Alice Johnson');
    expect(encryptedString).not.toContain('123-45-6789');
    expect(encryptedString).not.toContain('4532-1234-5678-9012');

    console.log('✅ Sensitive data encrypted successfully');
    console.log(`   - Encrypted data structure contains: ${Object.keys(encryptedData).join(', ')}`);

    // 📍 STEP 3: Client sends the encrypted data to the server
    console.log('\n3️⃣ Client sending encrypted data to server...');

    const response = await globalThis.fetch(`${baseUrl}/api/process-user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedData }),
    });

    expect(response.status).toBe(200);
    console.log('✅ Encrypted data sent to server successfully');

    // 📍 STEP 4 & 5: Server processes and verifies data integrity
    console.log('\n4️⃣ Server automatically decrypted data via middleware...');

    const result = await response.json();

    // Verify the response
    expect(result.success).toBe(true);
    expect(result.message).toBe('User data processed successfully');
    expect(result.dataIntegrity).toBeDefined();

    // Verify data integrity (no corruption)
    const integrity = result.dataIntegrity;
    expect(integrity.hasPersonalInfo).toBe(true);
    expect(integrity.hasFinancialInfo).toBe(true);
    expect(integrity.hasSessionData).toBe(true);
    expect(integrity.fullNameMatches).toBe(true);
    expect(integrity.userIdMatches).toBe(true);
    expect(integrity.creditCardMatches).toBe(true);

    // Verify user info was processed correctly
    expect(result.userInfo.name).toBe(sensitiveUserData.personalInfo.fullName);
    expect(result.userInfo.userId).toBe(sensitiveUserData.sessionData.userId);
    expect(result.userInfo.permissions).toEqual(sensitiveUserData.sessionData.permissions);

    console.log('✅ Server processed data successfully');
    console.log('✅ Data integrity verified - NO CORRUPTION detected');
    console.log(`   - User processed: ${result.userInfo.name}`);
    console.log(`   - Session ID: ${result.userInfo.userId}`);
    console.log(`   - Permissions: ${result.userInfo.permissions.join(', ')}`);

    console.log('\n🎉 SCENARIO COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('✅ 1. Client successfully requested public key');
    console.log('✅ 2. Client successfully encrypted sensitive data');
    console.log('✅ 3. Client successfully sent encrypted data to server');
    console.log('✅ 4. Server middleware automatically decrypted data');
    console.log('✅ 5. Data integrity verified - no corruption occurred');
  });

  it('should demonstrate that sensitive data is truly protected during transmission', async () => {
    console.log('\n🔒 SECURITY VERIFICATION TEST');
    console.log('=============================');

    // Get public key
    const keyResponse = await globalThis.fetch(`${baseUrl}/api/public-key`);
    const keyData = await keyResponse.json();
    const publicKey = keyData.publicKey;

    // Encrypt data
    const encryptedData = clientApp.encryptData(sensitiveUserData, publicKey);

    // Convert to what would be transmitted
    const transmissionData = JSON.stringify({ data: encryptedData });

    console.log('🔍 Checking if sensitive data is visible in transmission...');

    // Verify none of the sensitive information is visible
    const sensitiveValues = [
      'Alice Johnson',
      '123-45-6789',
      '4532-1234-5678-9012',
      '021000021',
      '123456789',
      'sess_xyz789',
      '123 Main Street',
    ];

    sensitiveValues.forEach((value) => {
      expect(transmissionData).not.toContain(value);
      console.log(`✅ "${value}" is NOT visible in encrypted transmission`);
    });

    console.log('✅ All sensitive data properly encrypted and protected');
  });

  it('should handle different types of data without corruption', async () => {
    console.log('\n🧪 DATA TYPE INTEGRITY TEST');
    console.log('===========================');

    const testCases = [
      {
        name: 'String data',
        data: 'Hello, this is a test string!',
      },
      {
        name: 'Number data',
        data: 42,
      },
      {
        name: 'Array data',
        data: [1, 2, 3, 'test', { nested: true }],
      },
      {
        name: 'Boolean data',
        data: true,
      },
      {
        name: 'Date string',
        data: new Date().toISOString(),
      },
    ];

    // Get public key
    const keyResponse = await globalThis.fetch(`${baseUrl}/api/public-key`);
    const keyData = await keyResponse.json();
    const publicKey = keyData.publicKey;

    for (const testCase of testCases) {
      console.log(`\n🔄 Testing ${testCase.name}...`);

      // Encrypt data
      const encryptedData = clientApp.encryptData(testCase.data, publicKey);

      // Decrypt directly to verify integrity
      const serverDecryption = ServerDecryption.getInstance();
      const decryptedData = await serverDecryption.decryptData(encryptedData);

      // Verify exact match
      expect(decryptedData).toStrictEqual(testCase.data);
      console.log(`✅ ${testCase.name} integrity verified`);
    }

    console.log('\n✅ All data types preserved without corruption');
  });
});
