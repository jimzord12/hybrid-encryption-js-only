import { randomBytes } from '@noble/hashes/utils';
import { BufferUtils } from './src/core/utils/buffer.util.js';

// Test with the exact size that's failing - 1088 bytes (KEM cipher text)
console.log('Testing with 1088 bytes (ML-KEM cipher text size)...');
const kemCipherData = randomBytes(1088);
const base64Encoded = BufferUtils.encodeBase64(kemCipherData);

console.log('Encoded length:', base64Encoded.length);
console.log('Contains newlines:', base64Encoded.includes('\n'));
console.log('Contains carriage returns:', base64Encoded.includes('\r'));
console.log('First 50 chars:', base64Encoded.substring(0, 50));
console.log('Last 50 chars:', base64Encoded.substring(base64Encoded.length - 50));

// Test the validation that's failing
console.log('\n--- Testing validation ---');
const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
const passesRegex = base64Regex.test(base64Encoded);
console.log('Passes regex test:', passesRegex);

if (!passesRegex) {
  console.log('Failed regex - finding invalid characters...');
  for (let i = 0; i < base64Encoded.length; i++) {
    const char = base64Encoded[i];
    if (!/[A-Za-z0-9+/=]/.test(char)) {
      console.log(`Invalid character at position ${i}: "${char}" (code: ${char.charCodeAt(0)})`);
      console.log('Context:', base64Encoded.substring(Math.max(0, i - 10), i + 10));
    }
  }
}

// Test re-encoding
try {
  const buffer = Buffer.from(base64Encoded, 'base64');
  const reencoded = buffer.toString('base64');
  const matches = reencoded === base64Encoded;
  console.log('Re-encoding matches original:', matches);

  if (!matches) {
    console.log('Length difference:', base64Encoded.length - reencoded.length);
    console.log('Original last 50:', base64Encoded.substring(base64Encoded.length - 50));
    console.log('Reencoded last 50:', reencoded.substring(reencoded.length - 50));

    // Find first difference
    for (let i = 0; i < Math.min(base64Encoded.length, reencoded.length); i++) {
      if (base64Encoded[i] !== reencoded[i]) {
        console.log(`First difference at position ${i}:`);
        console.log(`Original: "${base64Encoded[i]}" (${base64Encoded.charCodeAt(i)})`);
        console.log(`Reencoded: "${reencoded[i]}" (${reencoded.charCodeAt(i)})`);
        break;
      }
    }
  }
} catch (error) {
  console.error('Re-encoding failed:', error);
}
