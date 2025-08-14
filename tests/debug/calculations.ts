import { BufferUtils } from '../../src/core/utils';

export const findBase64Length = (binaryData: Uint8Array): number => {
  const base64String = BufferUtils.encodeBase64(binaryData);
  return base64String.length;
};

export const bytesNumToBase64Length = (byteLength: number): number => {
  return Math.ceil(byteLength / 3) * 4;
};
