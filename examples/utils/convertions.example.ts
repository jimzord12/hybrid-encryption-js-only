import { fromBase64, toBase64 } from '../../src/core/utils';

// Test round-trip conversion
const originalData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
const base64 = toBase64(originalData);
const roundTrip = fromBase64(base64);

console.log('Original:', originalData); // [72, 101, 108, 108, 111]
console.log('Base64:', base64); // "SGVsbG8="
console.log('Round-trip:', roundTrip); // [72, 101, 108, 108, 111]
console.log(
  'Equal:',
  originalData.every((val, i) => val === roundTrip[i]),
); // true
