import { randomBytes } from '@noble/hashes/utils';

// Test the base64 encoding issue
const largeData = randomBytes(1088); // Same size as the cipher text in the failing test
console.log('Large data length:', largeData.length);

const base64Encoded = Buffer.from(largeData).toString('base64');
console.log('Base64 length:', base64Encoded.length);
console.log('Contains newlines:', base64Encoded.includes('\n'));
console.log('Base64 preview (first 100 chars):', base64Encoded.substring(0, 100));

// Test the validation
const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
console.log('Passes regex test:', base64Regex.test(base64Encoded));

// Try decoding and re-encoding
try {
  const buffer = Buffer.from(base64Encoded, 'base64');
  const reencoded = buffer.toString('base64');
  console.log('Reencoded matches original:', reencoded === base64Encoded);
  console.log('Original length:', base64Encoded.length);
  console.log('Reencoded length:', reencoded.length);
  
  if (reencoded !== base64Encoded) {
    console.log('Difference found:');
    console.log('Original contains \\n:', base64Encoded.includes('\n'));
    console.log('Reencoded contains \\n:', reencoded.includes('\n'));
  }
} catch (error) {
  console.error('Decoding failed:', error);
}
