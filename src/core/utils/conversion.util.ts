import { Buffer } from 'buffer';

export function toBase64(data: Uint8Array | string): string {
  if (typeof data === 'string') {
    return Buffer.from(data, 'utf8').toString('base64');
  } else if (data instanceof Uint8Array) {
    return Buffer.from(data).toString('base64');
  }
  throw new TypeError('[HybridEncryption/utils/toBase64]: Input must be a string or Uint8Array');
}

export function fromBase64(base64: string): Uint8Array {
  // Direct conversion: base64 → Buffer → Uint8Array
  return new Uint8Array(Buffer.from(base64, 'base64'));
}
