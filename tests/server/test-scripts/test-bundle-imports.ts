#!/usr/bin/env node

/**
 * Bundle Import & Roundtrip Test Script
 *
 * This Node.js ESM script tests that the bundled packages can be correctly imported
 * and performs a complete roundtrip encryption/decryption test to verify functionality.
 *
 * Usage: node test-    for (let i = 0; i < iterations; i++) {
      const encrypted = clientEncryption.encryptData(testData, publicKey);
      const decrypted = await serverDecryption.decryptData(encrypted);dle-imports.mjs
 */

import console from 'node:console';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EncryptedData } from '../../../src';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = resolve(__dirname, '..', '..', '..', 'dist');

console.log('🚀 Starting Bundle Import & Roundtrip Test\n');

// ============================================================================
// Test Data
// ============================================================================

const testData = {
  user: 'test-user-12345',
  balance: 1500.75,
  permissions: ['read', 'write', 'admin'],
  metadata: {
    created: new Date().toISOString(),
    environment: 'test',
    secure: true,
  },
  nested: {
    deep: {
      value: 'deeply nested test value',
      array: [1, 2, 3, { inner: 'object' }],
    },
  },
};

console.log('📋 Test Data:', JSON.stringify(testData, null, 2));

// ============================================================================
// Helper Functions
// ============================================================================

function checkFileExists(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`❌ Bundle file not found: ${filePath}`);
  }
  console.log(`✅ Found bundle file: ${filePath}`);
}

async function testImport(modulePath: string, description: string) {
  try {
    console.log(`🔍 Testing import: ${description}`);
    const module = await import(modulePath);
    console.log(`✅ Successfully imported: ${description}`);
    return module;
  } catch (error) {
    console.error(`❌ Failed to import ${description}:`, (error as any).message);
    throw error;
  }
}

function validateEncryptedData(encrypted: EncryptedData, description: string) {
  console.log(`🔍 Validating ${description}...`);

  if (!encrypted || typeof encrypted !== 'object') {
    throw new Error(`❌ ${description}: Invalid encrypted data structure`);
  }

  const requiredFields = [
    'encryptedContent',
    'cipherText',
    'nonce',
    'preset',
  ] as (keyof EncryptedData)[];

  for (const field of requiredFields) {
    if (!encrypted[field]) {
      throw new Error(`❌ ${description}: Missing required field '${field}'`);
    }
  }

  console.log(`✅ ${description}: All required fields present`);
  console.log(`   - Encrypted content length: ${encrypted.encryptedContent.length}`);
  console.log(`   - Cipher text length: ${encrypted.cipherText.length}`);
  console.log(`   - Nonce length: ${encrypted.nonce.length}`);
  console.log(`   - Preset: ${encrypted.preset}`);
}

function deepEqual(obj1: object, obj2: object) {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 === 'object') {
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key as keyof typeof obj1], obj2[key as keyof typeof obj2])) return false;
    }

    return true;
  }

  return obj1 === obj2;
}

// ============================================================================
// Main Test Function
// ============================================================================

export async function runAllBundleTests() {
  let clientModule, serverModule, coreModule, utilsModule;

  try {
    // ========================================================================
    // Step 1: Check bundle files exist
    // ========================================================================
    console.log('\n📁 Checking bundle files...');

    const clientPath = join(distPath, 'client/client.js');
    const serverPath = join(distPath, 'server/server.js');
    const corePath = join(distPath, 'core/core.js');
    const utilsPath = join(distPath, 'utils/utils.js');

    checkFileExists(clientPath);
    checkFileExists(serverPath);
    checkFileExists(corePath);
    checkFileExists(utilsPath);

    // ========================================================================
    // Step 2: Test imports
    // ========================================================================
    console.log('\n📦 Testing module imports...');

    clientModule = await testImport(clientPath, 'Client Module');
    serverModule = await testImport(serverPath, 'Server Module');
    coreModule = await testImport(corePath, 'Core Module');
    utilsModule = await testImport(utilsPath, 'Utils Module');

    // ========================================================================
    // Step 3: Verify exported APIs
    // ========================================================================
    console.log('\n🔍 Verifying exported APIs...');

    // Client exports
    const expectedClientExports = ['ClientEncryption', 'Preset', 'createAppropriateError'];
    for (const exportName of expectedClientExports) {
      if (!clientModule[exportName]) {
        throw new Error(`❌ Client module missing export: ${exportName}`);
      }
    }
    console.log('✅ Client module exports verified');

    // Server exports
    const expectedServerExports = [
      'ServerDecryption',
      'getServerDecryption',
      'KeyManager',
      'HybridEncryption',
    ];
    for (const exportName of expectedServerExports) {
      if (!serverModule[exportName]) {
        throw new Error(`❌ Server module missing export: ${exportName}`);
      }
    }
    console.log('✅ Server module exports verified');

    // Core Exports
    const expectedCoreExports = [
      'HybridEncryption',
      'KeyManager',
      'Preset',
      'MlKemKeyProvider',
      'KeyDerivation',
      'Serialization',
    ];
    for (const exportName of expectedCoreExports) {
      if (!coreModule[exportName]) {
        throw new Error(`❌ Core module missing export: ${exportName}`);
      }
    }
    console.log('✅ Core module exports verified');

    // Utils exports
    const expectedUtilsExports = ['BufferUtils', 'ComparisonUtils', 'deepEqual'];
    for (const exportName of expectedUtilsExports) {
      if (!utilsModule[exportName]) {
        throw new Error(`❌ Utils module missing export: ${exportName}`);
      }
    }
    console.log('✅ Utils module exports verified');

    // ========================================================================
    // Step 4: Initialize Key Manager
    // ========================================================================
    console.log('\n🔑 Initializing Key Manager...');

    // Ensure cron jobs are disabled for bundle tests
    process.env.DISABLE_KEY_ROTATION_CRON = 'true';

    const { KeyManager } = serverModule;
    const keyManager = KeyManager.getInstance();

    // Initialize (this method doesn't take parameters - it uses default config)
    await keyManager.initialize();

    console.log('✅ Key Manager initialized successfully');

    // ========================================================================
    // Step 5: Roundtrip Encryption/Decryption Test
    // ========================================================================
    console.log('\n🔄 Performing roundtrip encryption/decryption test...');

    // Get public key for encryption
    const publicKey = await keyManager.getPublicKey();
    console.log('✅ Retrieved public key from Key Manager');

    // Encrypt using client module
    console.log('\n🔒 Encrypting data using Client module...');
    const { ClientEncryption } = clientModule;
    const clientEncryption = ClientEncryption.getInstance();
    const encrypted = clientEncryption.encryptData(testData, publicKey);

    validateEncryptedData(encrypted, 'Client encryption result');

    // Decrypt using server module
    console.log('\n🔓 Decrypting data using Server module...');
    const { ServerDecryption } = serverModule;
    const serverDecryption = ServerDecryption.getInstance();

    const decrypted = await serverDecryption.decryptData(encrypted);
    console.log('✅ Successfully decrypted data');

    // ========================================================================
    // Step 6: Verify roundtrip integrity
    // ========================================================================
    console.log('\n🧪 Verifying data integrity...');

    if (!deepEqual(testData, decrypted)) {
      console.error('❌ Data integrity check failed!');
      console.error('Original:', JSON.stringify(testData, null, 2));
      console.error('Decrypted:', JSON.stringify(decrypted, null, 2));
      throw new Error('Roundtrip test failed: data mismatch');
    }

    console.log('✅ Data integrity verified - roundtrip successful!');
    console.log('📋 Decrypted Data:', JSON.stringify(decrypted, null, 2));

    // ========================================================================
    // Step 7: Test utilities
    // ========================================================================
    console.log('\n🛠️ Testing utility functions...');

    const { deepEqual: utilDeepEqual, BufferUtils } = utilsModule;

    // Test deep comparison
    const isEqual = utilDeepEqual(testData, decrypted);
    if (!isEqual) {
      throw new Error('❌ Utility deepEqual function failed');
    }
    console.log('✅ Utility deepEqual function working correctly');

    // Test buffer utilities
    const testString = 'Hello, World! 🌍';
    const encoded = BufferUtils.stringToBinary(testString);
    const decoded = BufferUtils.binaryToString(encoded);

    if (testString !== decoded) {
      throw new Error('❌ Buffer utilities test failed');
    }
    console.log('✅ Buffer utilities working correctly');

    // ========================================================================
    // Step 8: Performance metrics
    // ========================================================================
    console.log('\n📊 Performance metrics...');

    const iterations = 10;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const encrypted = clientEncryption.encryptData(testData, publicKey);
      const decrypted = await serverDecryption.decryptData(encrypted);

      if (!deepEqual(testData, decrypted)) {
        throw new Error(`❌ Performance test iteration ${i + 1} failed`);
      }
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;

    console.log(`✅ Completed ${iterations} roundtrip operations`);
    console.log(`📈 Average time per roundtrip: ${avgTime.toFixed(2)}ms`);

    // ========================================================================
    // Cleanup
    // ========================================================================
    console.log('\n🧹 Cleaning up...');
    KeyManager.resetInstance();
    ClientEncryption.resetInstance();
    ServerDecryption.resetInstance();
    console.log('✅ All instances reset');
  } catch (error) {
    console.error('\n💥 Test failed:', (error as any).message);
    if ((error as any).stack) {
      console.error('Stack trace:', (error as any).stack);
    }
    throw error;
  }
}

// // ============================================================================
// // Error handling and execution
// // ============================================================================

// process.on('uncaughtException', (error) => {
//   console.error('💥 Uncaught Exception:', error.message);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// // Run the tests
// runAllBundleTests()
//   .then(async () => {
//     console.log('\n🎉 All tests passed successfully!');
//     console.log('✅ Bundle imports working correctly');
//     console.log('✅ Roundtrip encryption/decryption verified');
//     console.log('✅ API compatibility confirmed');

//     try {
//       await cleanTestDirectory(join(rootPath, 'config'), true);
//     } catch (error) {
//       console.log('⚠️ Failed to clean test directory:', (error as any).message);
//     }
//     console.log('\n🏁 Test completed successfully!');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('\n💥 Test suite failed:', error.message);
//     throw error;
//   });
