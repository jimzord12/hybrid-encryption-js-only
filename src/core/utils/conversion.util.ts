import forge from 'node-forge';

export function toBase64(data: Uint8Array | string): string {
  if (typeof data === 'string') {
    return forge.util.encode64(data);
  } else if (data instanceof Uint8Array) {
    return forge.util.encode64(forge.util.binary.raw.encode(data));
  }
  throw new TypeError('[HybridEncryption/utils/toBase64]: Input must be a string or Uint8Array');
}

export function fromBase64(base64: string): Uint8Array {
  const binaryString = forge.util.decode64(base64);
  return new Uint8Array(forge.util.binary.raw.decode(binaryString));
}
