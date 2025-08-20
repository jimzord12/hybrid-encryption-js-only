import { Base64, ClientEncryption, Preset } from '../src/client';

/**
 * Example 1: Basic Client-Side Encryption
 * This example demonstrates the most common use case for the ClientEncryption module.
 */
async function basicEncryptionExample() {
  console.log('🔐 Example 1: Basic Client-Side Encryption\n');

  try {
    // Get the singleton instance with default preset (NORMAL)
    const encryption = ClientEncryption.getInstance();

    // Sample data to encrypt (can be any serializable object)
    const sensitiveUserData = {
      userId: 12345,
      email: 'john.doe@example.com',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        ssn: '123-45-6789',
      },
      preferences: {
        notifications: true,
        darkMode: false,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        sessionId: 'session_abc123def456',
      },
    };

    // Mock public key (in real application, this would come from your server)
    // This should be a valid Base64-encoded ML-KEM public key
    const mockPublicKey =
      'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0U0EyMWJVOEJrZGJuTE9rbTBHZwpxYmp2cFhoODl5SWZKWFBzc3JQY1BNMktWT0ZPMGNJc2JDUW9TNFZtSk1QRitVNW80emhlWlhQMERKUVppSGNOCklPQzFlTUNQV01YekI1SEx0aTlwckgvOEpGN2xVYS9QZjFET1FNcWNQVGNUVXcyWXNha1JNSUQwSkRmaGEyOW4KL3Y5VGtseWlxaGJRUkt6a0RrTkg4Y3NGMFlBTkVLSVZCeEtJTkNMaEI5T3AyNStMcEdRZGxKZXlyWlh3YlgwagpBclRSR1NvREJrZzAwM0dWRjFmZWZ2ckl3VDdGNytVY3gvTE5hWVh2TDNUQWJWRVVmQlFnZFlKR1IwdXh0OUJMCmdnbFZFUlFWM1VKN0xsWUE0VlBmR2FHeGVMVDFKVmVMUlpBTTB1WStxUVVZUjV2RXFlUm1xSDhxOVRsN3F4VmYKWXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t';

    // Encrypt the data
    console.log('📝 Data to encrypt:', JSON.stringify(sensitiveUserData, null, 2));

    const encryptedResult = encryption.encryptData(sensitiveUserData, mockPublicKey as Base64);

    console.log('\n✅ Encryption successful!');
    console.log('📦 Encrypted data structure:');
    console.log(`   - Preset: ${encryptedResult.preset}`);
    console.log(
      `   - Encrypted Content Length: ${encryptedResult.encryptedContent.length} characters`,
    );
    console.log(`   - Cipher Text Length: ${encryptedResult.cipherText.length} characters`);
    console.log(`   - Nonce Length: ${encryptedResult.nonce.length} characters`);

    // This encrypted data can now be safely transmitted to your server
    console.log('\n🚀 Ready to send to server for decryption!');

    return encryptedResult;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw error;
  }
}

/**
 * Example 2: High Security Encryption
 * Demonstrates using the HIGH_SECURITY preset for sensitive data.
 */
async function highSecurityEncryptionExample() {
  console.log('\n🔐 Example 2: High Security Encryption\n');

  try {
    // Reset instance to demonstrate preset selection
    ClientEncryption.resetInstance();

    // Get instance with HIGH_SECURITY preset
    const encryption = ClientEncryption.getInstance(Preset.HIGH_SECURITY);

    // Extra sensitive data that requires maximum security
    const criticalData = {
      bankAccount: '1234567890',
      routingNumber: '987654321',
      creditCard: {
        number: '4111-1111-1111-1111',
        cvv: '123',
        expiry: '12/25',
      },
      cryptoWallet: {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        privateKey: 'KxYjZAkx...', // Never do this in real life!
      },
      medicalInfo: {
        conditions: ['diabetes', 'hypertension'],
        medications: ['metformin', 'lisinopril'],
      },
    };

    const mockPublicKey = new Uint8Array([
      // Mock key data - in real use, this would be actual ML-KEM public key bytes
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32,
    ]);

    console.log('📝 Critical data to encrypt (showing structure only):');
    console.log('   - Bank account information');
    console.log('   - Credit card details');
    console.log('   - Crypto wallet info');
    console.log('   - Medical records');

    const encryptedResult = encryption.encryptData(criticalData, mockPublicKey);

    console.log('\n✅ High-security encryption successful!');
    console.log('🔒 Enhanced security features applied');
    console.log(`📦 Preset: ${encryptedResult.preset} (maximum security)`);

    return encryptedResult;
  } catch (error) {
    console.error('❌ High-security encryption failed:', error);
    throw error;
  }
}

/**
 * Example 3: Singleton Pattern Demonstration
 * Shows how the singleton pattern ensures consistent configuration.
 */
function singletonPatternExample() {
  console.log('\n🔐 Example 3: Singleton Pattern Demonstration\n');

  // Reset any existing instance
  ClientEncryption.resetInstance();

  // Get instance with NORMAL preset
  const encryption1 = ClientEncryption.getInstance(Preset.NORMAL);
  console.log('✅ Created first instance with NORMAL preset');

  // Try to get another instance with different preset
  const encryption2 = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
  console.log('✅ Requested second instance with HIGH_SECURITY preset');

  // Verify they're the same instance
  const areSameInstance = encryption1 === encryption2;
  console.log(`🔍 Are they the same instance? ${areSameInstance}`);
  console.log(`📋 Both instances use preset: NORMAL (first preset wins)`);

  // Demonstrate runtime constructor protection
  console.log('\n🛡️ Testing constructor protection...');
  try {
    // This should throw an error
    // @ts-expect-error - Intentionally testing private constructor
    const directInstance = new ClientEncryption();
    console.log('❌ Unexpected: Direct instantiation succeeded');
  } catch (error) {
    console.log('✅ Constructor protection working:', (error as any).message);
  }

  // Reset instance to change preset
  ClientEncryption.resetInstance();
  const encryption3 = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
  console.log('\n🔄 After reset: New instance with HIGH_SECURITY preset created');
  //@ts-ignore
  console.log(encryption3.encryptionInstance?.preset);
}

/**
 * Example 4: Error Handling and Edge Cases
 * Demonstrates proper error handling for various scenarios.
 */
async function errorHandlingExample() {
  console.log('\n🔐 Example 4: Error Handling and Edge Cases\n');

  const encryption = ClientEncryption.getInstance();

  // Test 1: Invalid Base64 public key
  console.log('Test 1: Invalid Base64 public key');
  try {
    const invalidBase64Key = 'this-is-not-valid-base64!!!';
    encryption.encryptData({ test: 'data' }, invalidBase64Key as Base64);
    console.log('❌ Unexpected: Invalid key accepted');
  } catch (error) {
    console.log('✅ Correctly caught invalid Base64 error:', (error as any).message);
  }

  // Test 2: Empty key
  console.log('\nTest 2: Empty public key');
  try {
    encryption.encryptData({ test: 'data' }, new Uint8Array(0));
    console.log('❌ Unexpected: Empty key accepted');
  } catch (error) {
    console.log('✅ Correctly caught empty key error');
  }

  // Test 3: Null and undefined data
  console.log('\nTest 3: Null and undefined data handling');
  const validKey = new Uint8Array(32).fill(1); // Mock valid key

  try {
    const nullResult = encryption.encryptData(null, validKey);
    console.log('✅ Null data handled gracefully', nullResult);
  } catch (error) {
    console.log('⚠️ Null data caused error:', (error as any).message);
  }

  try {
    const undefinedResult = encryption.encryptData(undefined, validKey);
    console.log('✅ Undefined data handled gracefully', undefinedResult);
  } catch (error) {
    console.log('⚠️ Undefined data caused error:', (error as any).message);
  }

  // Test 4: Very large data
  console.log('\nTest 4: Large data handling');
  try {
    const largeData = {
      hugeArray: new Array(10000).fill('large data chunk'),
      timestamp: new Date().toISOString(),
    };

    const result = encryption.encryptData(largeData, validKey);
    console.log('✅ Large data encrypted successfully');
    console.log(`📦 Encrypted size: ${result.encryptedContent.length} characters`);
  } catch (error) {
    console.log('⚠️ Large data caused error:', (error as any).message);
  }
}

/**
 * Example 5: Real-World Integration Pattern
 * Shows how to integrate with a typical web application.
 */
class SecureApiClient {
  private encryption: ClientEncryption;
  private serverPublicKey: string;

  constructor(serverPublicKey: string, preset: Preset = Preset.NORMAL) {
    this.encryption = ClientEncryption.getInstance(preset);
    this.serverPublicKey = serverPublicKey;
  }

  async sendSecureData(endpoint: string, data: unknown): Promise<any> {
    try {
      console.log(`🌐 Sending secure data to ${endpoint}`);

      // Encrypt the data
      const encryptedData = this.encryption.encryptData(data, this.serverPublicKey as Base64);
      console.log('🔐 Data encrypted successfully');

      // In a real application, you would make an HTTP request here
      const response = await this.mockHttpRequest(endpoint, encryptedData);

      console.log('✅ Server response received');
      return response;
    } catch (error) {
      console.error('❌ Secure data transmission failed:', error);
      throw error;
    }
  }

  private async mockHttpRequest(_endpoint: string, encryptedData: any): Promise<any> {
    // Mock HTTP request - replace with actual fetch/axios call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          message: 'Data received and decrypted',
          encryptedDataSize: JSON.stringify(encryptedData).length,
        });
      }, 100);
    });
  }
}

async function realWorldIntegrationExample() {
  console.log('\n🔐 Example 5: Real-World Integration Pattern\n');

  // Mock server public key
  const serverPublicKey = 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...';

  // Create secure API client
  const apiClient = new SecureApiClient(serverPublicKey, Preset.HIGH_SECURITY);

  // Example user data
  const userData = {
    action: 'updateProfile',
    userId: 12345,
    changes: {
      email: 'newemail@example.com',
      phone: '+1-555-123-4567',
      address: {
        street: '123 Main St',
        city: 'New York',
        zip: '10001',
      },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await apiClient.sendSecureData('/api/user/update', userData);
    console.log('📨 Server response:', response);
  } catch (error) {
    console.error('Failed to send secure data:', error);
  }
}

/**
 * Main function to run all examples
 */
async function runAllExamples() {
  console.log('🚀 ClientEncryption Module Usage Examples');
  console.log('=========================================\n');

  try {
    // Run all examples in sequence
    await basicEncryptionExample();
    await highSecurityEncryptionExample();
    singletonPatternExample();
    await errorHandlingExample();
    await realWorldIntegrationExample();

    console.log('\n🎉 All examples completed successfully!');
    console.log('\n💡 Key Takeaways:');
    console.log('   • Always use ClientEncryption.getInstance() to get the singleton');
    console.log('   • Choose appropriate preset for your security needs');
    console.log('   • Handle errors gracefully in production code');
    console.log('   • The encrypted data can be safely transmitted over networks');
    console.log('   • Use resetInstance() only when changing presets or in tests');
  } catch (error) {
    console.error('\n💥 Example execution failed:', error);
  } finally {
    // Clean up
    ClientEncryption.resetInstance();
    console.log('\n🧹 Cleanup completed');
  }
}

// Export for use in other modules
export {
  basicEncryptionExample,
  errorHandlingExample,
  highSecurityEncryptionExample,
  realWorldIntegrationExample,
  runAllExamples,
  SecureApiClient,
  singletonPatternExample,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
