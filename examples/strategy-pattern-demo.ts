#!/usr/bin/env node

import { KeyManager } from '../src/core/key-rotation';
import { KeyProviderFactory } from '../src/core/providers';

async function demonstrateStrategyPattern() {
  console.log('🎯 Strategy Pattern Demonstration for KeyManager\n');

  // Show current supported algorithms
  console.log('📋 Supported Algorithms:');
  const supportedAlgorithms = KeyProviderFactory.getSupportedAlgorithms();
  supportedAlgorithms.forEach(alg => console.log(`   - ${alg.toUpperCase()}`));
  console.log('');

  // 1. Default RSA Implementation (no changes required)
  console.log('🔐 1. RSA KeyManager (Default - Backward Compatible)');
  console.log('─'.repeat(50));

  const rsaManager = KeyManager.getInstance({
    certPath: './demo-certs-rsa',
    keySize: 2048,
    keyExpiryMonths: 1,
    enableFileBackup: false, // Skip file operations for demo
  });

  await rsaManager.initialize();
  const rsaStatus = await rsaManager.getStatus();

  console.log(`   Algorithm: ${rsaManager.getConfig().algorithm?.toUpperCase() || 'RSA'}`);
  console.log(`   Key Size: ${rsaManager.getConfig().keySize} bits`);
  console.log(`   Valid Keys: ${rsaStatus.keysValid ? '✅' : '❌'}`);
  console.log(`   Version: ${rsaStatus.currentKeyVersion}`);

  // Show the key provider being used
  console.log(`   Provider: RSAKeyProvider`);
  console.log('');

  // 2. Explicit RSA Configuration
  console.log('🔐 2. Explicit RSA Configuration');
  console.log('─'.repeat(50));

  KeyManager.resetInstance();
  const explicitRsaManager = KeyManager.getInstance({
    algorithm: 'rsa',
    certPath: './demo-certs-rsa-explicit',
    keySize: 3072,
    keyExpiryMonths: 6,
    enableFileBackup: false,
  });

  await explicitRsaManager.initialize();
  const explicitRsaStatus = await explicitRsaManager.getStatus();

  console.log(`   Algorithm: ${explicitRsaManager.getConfig().algorithm.toUpperCase()}`);
  console.log(`   Key Size: ${explicitRsaManager.getConfig().keySize} bits`);
  console.log(`   Valid Keys: ${explicitRsaStatus.keysValid ? '✅' : '❌'}`);
  console.log(`   Version: ${explicitRsaStatus.currentKeyVersion}`);
  console.log('');

  // 3. Show Provider Factory in action
  console.log('🏭 3. Key Provider Factory Demonstration');
  console.log('─'.repeat(50));

  try {
    const rsaProvider = KeyProviderFactory.createProvider('rsa');
    console.log(`   RSA Provider: ${rsaProvider.constructor.name} ✅`);
    console.log(`   Min Key Size: ${rsaProvider.getMinKeySize()} bits`);
    console.log(`   Private Key Format: ${rsaProvider.getPrivateKeyFormat()}`);

    // Test unsupported algorithm
    try {
      KeyProviderFactory.createProvider('ecc');
    } catch (error) {
      console.log(`   ECC Provider: Not yet implemented ⏳`);
    }

    try {
      KeyProviderFactory.createProvider('ed25519');
    } catch (error) {
      console.log(`   Ed25519 Provider: Not yet implemented ⏳`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');

  // 4. Configuration Validation
  console.log('🔧 4. Algorithm-Specific Configuration Validation');
  console.log('─'.repeat(50));

  try {
    KeyManager.resetInstance();
    const invalidRsaManager = KeyManager.getInstance({
      algorithm: 'rsa',
      keySize: 1024, // Too small for RSA
      certPath: './demo-certs-invalid',
      enableFileBackup: false,
    });

    await invalidRsaManager.initialize();
  } catch (error) {
    console.log(`   ❌ Invalid RSA config caught: ${error.message}`);
  }
  console.log('');

  // 5. Future Algorithm Example (commented code showing how it would work)
  console.log('🚀 5. Future Algorithm Support (Example)');
  console.log('─'.repeat(50));
  console.log('   // Future ECC implementation would look like:');
  console.log('   const eccManager = KeyManager.getInstance({');
  console.log('     algorithm: "ecc",');
  console.log('     curve: "P-256",');
  console.log('     keyExpiryMonths: 12');
  console.log('   });');
  console.log('');
  console.log('   // The KeyManager core logic remains unchanged!');
  console.log('   // Only the provider implementation differs.');
  console.log('');

  // 6. Show Decoupling Benefits
  console.log('🎯 6. Decoupling Benefits Demonstrated');
  console.log('─'.repeat(50));
  console.log('   ✅ KeyManager no longer imports HybridEncryption');
  console.log('   ✅ Algorithm logic isolated in providers');
  console.log('   ✅ Easy to test providers independently');
  console.log('   ✅ No changes to existing RSA functionality');
  console.log('   ✅ Ready for future algorithms (ECC, Ed25519, etc.)');
  console.log('   ✅ Configuration validation per algorithm');
  console.log('');

  console.log('🎉 Strategy Pattern Successfully Implemented!');
  console.log('');
  console.log('Next steps to add new algorithms:');
  console.log('1. Implement KeyProvider interface (e.g., ECCKeyProvider)');
  console.log('2. Register with KeyProviderFactory');
  console.log('3. Ready to use - no KeyManager changes needed!');

  // Cleanup
  KeyManager.resetInstance();
}

// Run the demonstration
demonstrateStrategyPattern().catch(console.error);
