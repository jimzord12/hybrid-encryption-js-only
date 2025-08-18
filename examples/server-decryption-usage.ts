/**
 * Server Decryption Usage Example
 *
 * This example demonstrates how to use the ServerDecryption class to decrypt
 * data in a server environment with automatic key management and grace period support.
 */

import { Preset } from '../src/core/common/enums';
import { EncryptedData } from '../src/core/common/interfaces/encryption.interfaces';
import { Base64 } from '../src/core/common/types/branded-types.types';
import { ServerDecryption, getServerDecryption } from '../src/server/decrypt';

async function serverDecryptionUsageExample() {
  console.log('🚀 Server Decryption Usage Example\n');

  // ============================================================================
  // 1. BASIC USAGE: Initialize ServerDecryption
  // ============================================================================
  console.log('� BASIC USAGE - Initializing ServerDecryption...');

  // Method 1: Using class instance
  const server1 = ServerDecryption.getInstance({
    preset: Preset.NORMAL,
    enableFileBackup: false,
    autoGenerate: true,
  });

  // Method 2: Using direct export function (Option 1 implementation)
  const server2 = getServerDecryption({
    preset: Preset.NORMAL,
    enableFileBackup: false,
    autoGenerate: true,
  });

  // Both methods return the same singleton instance
  console.log('Same instance?', server1 === server2 ? '✅ YES' : '❌ NO');

  // ============================================================================
  // 2. CONFIGURATION OPTIONS
  // ============================================================================
  console.log('\n⚙️  CONFIGURATION OPTIONS');

  console.log('Different configuration examples:');
  console.log(`
  // Production configuration
  ServerDecryption.getInstance({
    preset: Preset.HIGH_SECURITY,
    enableFileBackup: true,
    certPath: './config/certs',
    rotationGracePeriodInMinutes: 10,
  });

  // Development configuration
  ServerDecryption.getInstance({
    preset: Preset.NORMAL,
    enableFileBackup: false,
    autoGenerate: true,
    rotationGracePeriodInMinutes: 5,
  });
  `);

  console.log('✅ Configuration options documented');

  // ============================================================================
  // 3. DECRYPTION OPERATIONS
  // ============================================================================
  console.log('\n� DECRYPTION OPERATIONS');

  // Example encrypted data (would normally come from client)
  const mockEncryptedData: EncryptedData = {
    preset: Preset.NORMAL,
    encryptedContent: 'eyJ1c2VySWQiOjEyMzQ1LCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ==' as Base64,
    cipherText: 'TW9ja0NpcGhlclRleHRGb3JUZXN0aW5nUHVycG9zZXM=' as Base64,
    nonce: 'TW9ja05vbmNlRm9yVGVzdGluZw==' as Base64,
  };

  console.log('📤 Received encrypted data from client');
  console.log('Encrypted data info:', {
    preset: mockEncryptedData.preset,
    encryptedContentLength: mockEncryptedData.encryptedContent.length,
    cipherTextLength: mockEncryptedData.cipherText.length,
    nonceLength: mockEncryptedData.nonce.length,
  });

  // Decrypt the data (this will fail with mock data, but shows the API)
  try {
    console.log('\n� Attempting to decrypt data...');
    const decryptedData = await server1.decryptData<{ userId: number; email: string }>(
      mockEncryptedData,
    );
    console.log('✅ Decryption successful:', decryptedData);
  } catch (error) {
    console.log(
      '⚠️ Expected failure with mock data:',
      (error as Error).message.substring(0, 100) + '...',
    );
  }

  // ============================================================================
  // 4. STATUS MONITORING
  // ============================================================================
  console.log('\n📊 STATUS MONITORING');

  // Get current status
  const status = await server1.getStatus();
  console.log('Server status:', {
    initialized: status.initialized,
    preset: status.preset,
    hasKeyManager: status.keyManager !== null,
  });

  // Perform health check
  const health = await server1.healthCheck();
  console.log('Health check:', {
    healthy: health.healthy,
    issueCount: health.issues.length,
    issues: health.issues.slice(0, 3), // Show first 3 issues
  });

  // ============================================================================
  // 5. ERROR HANDLING
  // ============================================================================
  console.log('\n🛡️  ERROR HANDLING');

  // Test validation errors
  console.log('\n🧪 Testing validation errors...');

  try {
    await server1.decryptData({} as EncryptedData);
  } catch (error) {
    console.log('✅ Validation error caught:', (error as Error).message);
  }

  try {
    await server1.decryptData(null as any);
  } catch (error) {
    console.log('✅ Null data error caught:', (error as Error).message);
  }

  // ============================================================================
  // 6. GRACE PERIOD SUPPORT
  // ============================================================================
  console.log('\n🔄 GRACE PERIOD SUPPORT');

  console.log('Grace period support is automatically handled by ServerDecryption:');
  console.log('- Current keys are tried first');
  console.log('- Previous keys are tried during rotation grace period');
  console.log('- Automatic fallback ensures zero-downtime decryption');
  console.log('- No manual key management required');

  // ============================================================================
  // 7. PRODUCTION PATTERNS
  // ============================================================================
  console.log('\n🏭 PRODUCTION PATTERNS');

  console.log('Recommended production usage patterns:');
  console.log(`
  // 1. Express.js Middleware Pattern
  app.use(async (req, res, next) => {
    try {
      const server = getServerDecryption();
      if (req.body.encryptedData) {
        req.body.decryptedData = await server.decryptData(req.body.encryptedData);
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Decryption failed' });
    }
  });

  // 2. Service Layer Pattern
  class UserService {
    private server = getServerDecryption({ preset: Preset.HIGH_SECURITY });

    async processEncryptedUserData(encryptedData: EncryptedData) {
      const userData = await this.server.decryptData<UserData>(encryptedData);
      return this.processUser(userData);
    }
  }

  // 3. Health Check Integration
  app.get('/health', async (req, res) => {
    const server = getServerDecryption();
    const health = await server.healthCheck();
    res.status(health.healthy ? 200 : 503).json(health);
  });
  `);

  // ============================================================================
  // 8. CLEANUP
  // ============================================================================
  console.log('\n🧹 CLEANUP');
  ServerDecryption.resetInstance();
  console.log('✅ Singleton instance cleaned up');

  console.log('\n🎉 Server Decryption Example completed successfully!');
  console.log('\nKey Benefits:');
  console.log('✅ Automatic key management and rotation');
  console.log('✅ Grace period support for zero-downtime');
  console.log('✅ Singleton pattern for resource efficiency');
  console.log('✅ Comprehensive error handling');
  console.log('✅ Production-ready monitoring and health checks');
  console.log('✅ Type-safe decryption with generics');
}

// Export for use in other modules
export { serverDecryptionUsageExample };

// Run the example if executed directly
if (require.main === module) {
  serverDecryptionUsageExample().catch(console.error);
}
