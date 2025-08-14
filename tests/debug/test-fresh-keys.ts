#!/usr/bin/env tsx

import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ModernHybridEncryption } from '../../src/core/encryption/hybrid-encryption.js';

async function testFreshKeys() {
  console.log('🧪 Testing with fresh ML-KEM key pair...');

  try {
    // Generate a brand new key pair
    console.log('🔑 Generating fresh ML-KEM-768 key pair...');
    const keyPair = ml_kem768.keygen();
    console.log('✅ Fresh key pair generated');
    console.log('📊 Key sizes:', {
      publicKeyLength: keyPair.publicKey.length,
      privateKeyLength: keyPair.secretKey.length,
    });

    // Create test data
    const testData = { test: 'Fresh Key Test', timestamp: Date.now() };
    console.log('📝 Test data:', testData);

    // Encrypt with fresh keys
    console.log('\n🔐 Encrypting with fresh keys...');
    const encrypted = await ModernHybridEncryption.encrypt(testData, keyPair.publicKey);
    console.log('✅ Encryption successful');

    // Decrypt with fresh keys
    console.log('\n🔓 Decrypting with fresh keys...');
    const decrypted = await ModernHybridEncryption.decrypt(encrypted, keyPair.secretKey);
    console.log('✅ Decryption successful');
    console.log('📋 Decrypted data:', decrypted);

    // Verify round-trip
    if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
      console.log('✅ Fresh keys work perfectly! The issue is with stored keys.');
    } else {
      console.log('❌ Fresh keys also fail - deeper implementation issue.');
    }
  } catch (error) {
    console.error('❌ Fresh key test failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

testFreshKeys().catch(console.error);
