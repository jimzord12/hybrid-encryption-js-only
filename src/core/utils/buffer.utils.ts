/**
 * Cross-Platform Buffer Utilities
 *
 * Provides consistent Buffer-based text and Base64 encoding/decoding utilities
 * that work across all environments (Node.js, React Native, Edge, browsers).
 * Replaces legacy TextEncoder/TextDecoder and btoa/atob APIs.
 *
 * Features:
 * - Consistent UTF-8 text encoding/decoding using Buffer
 * - Modern Base64 encoding/decoding without legacy APIs
 * - Cross-platform compatibility for all JavaScript environments
 * - Performance optimized for cryptographic operations
 */

import { randomBytes } from '@noble/hashes/utils';
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer';
import { Base64, HexString } from '../common/types/branded-types.types';

/**
 * Cross-platform Buffer utilities for modern text and binary operations
 */
export class BufferUtils {
  /**
   * Convert string to binary data using UTF-8 encoding
   * Replaces new TextEncoder().encode()
   *
   * @param text - The string to convert to binary
   * @returns UTF-8 encoded binary data
   */
  static stringToBinary(text: string): Uint8Array {
    try {
      return new Uint8Array(Buffer.from(text, 'utf8'));
    } catch (error) {
      throw new Error(
        `String to binary conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Convert binary data to string using UTF-8 decoding
   * Replaces new TextDecoder().decode()
   *
   * @param data - The binary data to convert to string
   * @returns UTF-8 decoded string
   */
  static binaryToString(data: Uint8Array): string {
    try {
      return Buffer.from(data).toString('utf8');
    } catch (error) {
      throw new Error(
        `Binary to string conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Encode binary data to Base64 string
   * Replaces btoa() with modern Buffer API
   *
   * @param data - The binary data to encode
   * @returns Base64 encoded string
   */
  static encodeBase64(data: Uint8Array): Base64 {
    try {
      return Buffer.from(data).toString('base64') as Base64;
    } catch (error) {
      throw new Error(
        `Base64 encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Decode Base64 string to binary data
   * Replaces atob() with modern Buffer API
   *
   * @param encodedData - The Base64 encoded string
   * @returns Decoded binary data
   */
  static decodeBase64(encodedData: Base64): Uint8Array {
    try {
      if (typeof encodedData !== 'string') {
        throw new Error('Invalid Base64 input: must be a string');
      }

      // Handle empty string as special case (valid)
      if (encodedData === '') {
        return new Uint8Array(0);
      }

      // Validate Base64 format before attempting decode
      if (!BufferUtils.isValidBase64(encodedData)) {
        throw new Error('Invalid Base64 format');
      }

      return new Uint8Array(Buffer.from(encodedData, 'base64'));
    } catch (error) {
      throw new Error(
        `Base64 decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Convert binary string (character codes) to Uint8Array
   * Used for legacy compatibility when needed
   *
   * @param binaryString - String with character codes representing bytes
   * @returns Binary data as Uint8Array
   */
  static binaryStringToBytes(binaryString: HexString): Uint8Array {
    try {
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i) & 0xff;
      }
      return bytes;
    } catch (error) {
      throw new Error(
        `Binary string to bytes conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Convert Uint8Array to binary string (character codes)
   * Used for legacy compatibility when needed
   *
   * @param bytes - Binary data as Uint8Array
   * @returns String with character codes representing bytes
   */
  static bytesToBinaryString(bytes: Uint8Array): HexString {
    try {
      return String.fromCharCode(...bytes) as HexString;
    } catch (error) {
      throw new Error(
        `Bytes to binary string conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validate that a string is valid UTF-8
   *
   * @param text - The string to validate
   * @returns True if valid UTF-8, false otherwise
   */
  static isValidUtf8(text: string): boolean {
    try {
      // Convert to buffer and back - if it matches, it's valid UTF-8
      const buffer = Buffer.from(text, 'utf8');
      const decoded = buffer.toString('utf8');
      return decoded === text;
    } catch {
      return false;
    }
  }

  /**
   * Validate that a string is valid Base64
   *
   * @param encodedData - The Base64 string to validate
   * @returns True if valid Base64, false otherwise
   */
  static isValidBase64(encodedData: Base64): boolean {
    try {
      // Base64 regex pattern
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(encodedData)) {
        return false;
      }

      // Try to decode and re-encode - if it matches, it's valid
      const buffer = Buffer.from(encodedData, 'base64');
      const reencoded = buffer.toString('base64');
      return reencoded === encodedData;
    } catch {
      return false;
    }
  }

  /**
   * Get byte length of a UTF-8 string without encoding
   * Useful for performance-sensitive operations
   *
   * @param text - The string to measure
   * @returns Byte length in UTF-8 encoding
   */
  static getUtf8ByteLength(text: string): number {
    try {
      return Buffer.byteLength(text, 'utf8');
    } catch (error) {
      throw new Error(
        `UTF-8 byte length calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Securely compare two buffers in constant time
   * Prevents timing attacks on cryptographic operations
   *
   * @param a - First buffer to compare
   * @param b - Second buffer to compare
   * @returns True if buffers are equal, false otherwise
   */
  static constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  /**
   * Create a buffer filled with secure random bytes
   * Uses @noble/hashes randomBytes for cryptographically secure generation
   *
   * @param length - Number of random bytes to generate
   * @returns Buffer filled with cryptographically secure random bytes
   */
  static getSecureRandomBytes(length: number): Uint8Array {
    try {
      // Validate length parameter
      if (typeof length !== 'number' || length <= 0 || !Number.isInteger(length)) {
        throw new Error(`Invalid length: ${length}. Must be a positive integer.`);
      }

      // Use @noble/hashes randomBytes for cryptographically secure random generation
      return randomBytes(length);
    } catch (error) {
      throw new Error(
        `Secure random bytes generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

/**
 * Convenience functions for common operations
 */

/**
 * Quick string to binary conversion
 */
export const stringToBinary = BufferUtils.stringToBinary;

/**
 * Quick binary to string conversion
 */
export const binaryToString = BufferUtils.binaryToString;

/**
 * Quick Base64 encoding
 */
export const encodeBase64 = BufferUtils.encodeBase64;

/**
 * Quick Base64 decoding
 */
export const decodeBase64 = BufferUtils.decodeBase64;

/**
 * Quick constant-time buffer comparison
 */
export const constantTimeEqual = BufferUtils.constantTimeEqual;

/**
 * Quick secure random bytes generation
 */
export const getSecureRandomBytes = BufferUtils.getSecureRandomBytes;
