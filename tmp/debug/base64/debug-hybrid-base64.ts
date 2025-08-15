import { randomBytes } from '@noble/hashes/utils';
import { ML_KEM_STATS } from '../../../src/core/constants.js';
import { HybridEncryption } from '../../../src/core/encryption/hybrid-encryption.js';
import { Preset } from '../../../src/core/enums/index.js';

// Create the same scenario as the failing test
const hybridEncryption = new HybridEncryption();
const data = { message: 'Hello, World!' };
const pubKey = randomBytes(ML_KEM_STATS.publicKeyLength[Preset.NORMAL]);

console.log('Testing base64 encoding in HybridEncryption...');

try {
  // Test the serialization first
  const serialized = hybridEncryption.serializeData(data);
  console.log('Serialized data length:', serialized.length);

  // Test base64 encoding directly
  const base64Test = hybridEncryption.encodeBase64(serialized);
  console.log('Base64 encoded successfully:', base64Test);
  console.log('Base64 length:', base64Test.length);
  console.log('Contains newlines:', base64Test.includes('\n'));

  // Test large data (like cipher text size)
  const largeData = randomBytes(1088);
  const largeBase64 = hybridEncryption.encodeBase64(largeData);
  console.log('Large base64 length:', largeBase64.length);
  console.log('Large base64 contains newlines:', largeBase64.includes('\n'));
  console.log('Large base64 preview:', largeBase64.substring(0, 100) + '...');
} catch (error) {
  console.error('Error during base64 testing:', error);
}
