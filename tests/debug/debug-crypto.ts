#!/usr/bin/env tsx

import { ModernHybridEncryption } from '../../src/core/encryption/modern-hybrid-encryption.js';
import { KeyManager } from '../../src/core/key-management/index.js';

async function debugCrypto() {
  console.log('🔍 Debugging AES-GCM Issue...');

  try {
    // Initialize key manager
    const keyManager = KeyManager.getInstance();
    await keyManager.initialize();

    // Get current keys
    const publicKey = await keyManager.getPublicKey();
    const privateKey = await keyManager.getPrivateKey();
    console.log('✅ Got key pair');
    console.log('🔑 Key details:', {
      publicKeyLength: publicKey.length,
      privateKeyLength: privateKey.length,
      publicKeyHex: Buffer.from(publicKey.slice(0, 16)).toString('hex') + '...',
      privateKeyHex: Buffer.from(privateKey.slice(0, 16)).toString('hex') + '...',
    });

    // Create test data
    const testData = { test: 'Hello World', timestamp: Date.now() };
    console.log('📝 Test data:', testData);

    // Encrypt data
    console.log('\n🔐 Encrypting...');
    const encrypted = await ModernHybridEncryption.encrypt(testData, publicKey);
    console.log('✅ Encryption successful');
    console.log('📊 Encrypted structure:', {
      algorithms: encrypted.algorithms,
      version: encrypted.version,
      nonceLength: encrypted.nonce ? Buffer.from(encrypted.nonce, 'base64').length : 'missing',
      keyMaterialLength: encrypted.keyMaterial
        ? Buffer.from(encrypted.keyMaterial, 'base64').length
        : 'missing',
      encryptedContentLength: encrypted.encryptedContent
        ? Buffer.from(encrypted.encryptedContent, 'base64').length
        : 'missing',
    });

    // Decrypt data
    console.log('\n🔓 Decrypting...');
    const decrypted = await ModernHybridEncryption.decrypt(encrypted, privateKey);
    console.log('✅ Decryption successful');
    console.log('📋 Decrypted data:', decrypted);

    // Verify round-trip
    if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
      console.log('✅ Round-trip successful!');
    } else {
      console.log('❌ Round-trip failed!');
      console.log('Original:', testData);
      console.log('Decrypted:', decrypted);
    }
  } catch (error) {
    console.error('❌ Crypto debug failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

debugCrypto().catch(console.error);
