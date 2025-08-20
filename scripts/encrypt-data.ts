import { ClientEncryption } from '../dist/client/client';
import { isEncryptedData } from '../src';
import type { Base64 } from '../src/core/common/types/branded-types.types';

const testData = {
  userId: 12345,
  action: 'test_encryption',
  timestamp: new Date().toISOString(),
  sensitiveData: {
    creditCard: '4111-1111-1111-1111',
    amount: 999.99,
    currency: 'USD',
  },
};

const port = 8000;
const baseUrl = `http://host.docker.internal:${port}`;

async function testEncryption() {
  console.log('🔐 Testing Client Encryption...\n');

  const enc = ClientEncryption.getInstance();

  try {
    // Try remote key fetching (if server is available on Windows host)
    console.log('Attempting remote key encryption...');
    const serverUrl = `${baseUrl}/v2/encryption`; // Base URL only - client will append /public-key

    const encryptedData = await enc.encryptDataWithRemoteKey(testData, serverUrl);

    fetch(`${baseUrl}/v2/encryption`, {
      body: JSON.stringify({ data: encryptedData }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(
      isEncryptedData(encryptedData) ? 'Data is encrypted ✅' : 'Data is NOT encrypted ❌',
    );
    console.log('Remote encryption successful! 🎉\n');
    console.log('Encrypted data structure:');
    console.log(JSON.stringify(encryptedData, null, 2));
  } catch (error) {
    console.log('❌ Remote encryption failed (server not available)');
    console.log('Error:', error instanceof Error ? error.message : String(error));

    // Test local encryption with a mock public key
    console.log('\n🧪 Testing local encryption with mock key...');

    // Generate a simple test public key (base64 encoded)
    const mockPublicKey =
      'TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUEwdkh2' as Base64;

    try {
      const localEncrypted = enc.encryptData(testData, mockPublicKey);
      console.log(
        isEncryptedData(localEncrypted)
          ? 'Local data is encrypted ✅'
          : 'Local data is NOT encrypted ❌',
      );
      console.log('Local encryption successful! 🎉\n');
      console.log('Local encrypted data structure:');
      console.log(JSON.stringify(localEncrypted, null, 2));
    } catch (localError) {
      console.log('❌ Local encryption also failed');
      console.log('Error:', localError instanceof Error ? localError.message : String(localError));
    }
  }
}

testEncryption().catch(console.error);
