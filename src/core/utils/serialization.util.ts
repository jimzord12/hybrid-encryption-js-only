import { Preset } from '../enums';
import { createAppropriateError } from '../errors';
import { Base64 } from '../types/branded-types.types';
import { BufferUtils } from './buffer.util';

// TODO: Enhance the Error Handling using the `createAppropriateError` src/core/errors/encryption.errors.ts

/**
 * Supported data types for serialization
 */
export type SerializableData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Uint8Array
  | Array<any>
  | Record<string, any>;

/**
 * Serialization metadata for type preservation and validation
 */
export interface SerializationMetadata {
  /** Original data type */
  originalType: string;
  /** Serialization format version */
  version: string;
  /** Encoding used for text data */
  encoding: string;
  /** Timestamp when serialized */
  timestamp: number;
  /** Data integrity checksum (optional) */
  checksum?: string;
}

/**
 * Serialization result with metadata
 */
export interface SerializationResult {
  /** Serialized binary data */
  data: Uint8Array;
  /** Serialization metadata */
  metadata: SerializationMetadata;
}
/**
 * Modern serialization utility class for hybrid encryption
 *
 * Provides secure, efficient, and type-aware serialization for all JavaScript
 * data types with proper error handling and data integrity validation.
 */
export class Serialization {
  /**
   * Current serialization format version
   */
  private static readonly SERIALIZATION_VERSION = '2.0.0';

  /**
   * Default UTF-8 encoding identifier
   */
  private static readonly DEFAULT_ENCODING = 'utf-8';

  /**
   * Serialize any JavaScript data for encryption
   *
   * Converts JavaScript data types to binary format suitable for cryptographic
   * operations while preserving type information and data integrity.
   *
   * @param data - The data to serialize
   * @param options - Serialization options
   * @returns Binary representation of the data
   */
  static serializeForEncryption(data: any): Uint8Array {
    try {
      // Handle special cases first
      if (data instanceof Uint8Array) {
        return data; // Pass through binary data as-is
      }

      // Determine the original data type
      const originalType = this.getDataType(data);

      // Convert data to JSON string representation
      const jsonString = this.toJsonString(data, originalType);

      // Convert JSON string to UTF-8 bytes using BufferUtils
      const binaryData = BufferUtils.stringToBinary(jsonString);

      return binaryData;
    } catch (error) {
      throw new Error(
        `Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Deserialize data from decryption back to original format
   *
   * Converts binary data back to its original JavaScript representation
   * with proper type restoration and integrity validation.
   *
   * @param data - Binary data to deserialize
   * @param options - Deserialization options
   * @returns Original data in its native JavaScript type
   */
  static deserializeFromDecryption<T = any>(data: Uint8Array): T {
    try {
      if (!data || data.length === 0) {
        throw new Error('Cannot deserialize empty data');
      }

      let binaryData: Uint8Array;

      binaryData = data;

      // Convert binary data to UTF-8 string using BufferUtils
      const jsonString = BufferUtils.binaryToString(binaryData);

      // Parse JSON string back to JavaScript value
      const parsedData = this.fromJsonString(jsonString);

      return parsedData as T;
    } catch (error) {
      if (error instanceof Error && error.message.includes('integrity check')) {
        throw error;
      }
      throw new Error(
        `Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Encode binary data to Base64 string
   *
   * @param data - Binary data to encode
   * @returns Base64 encoded string
   */
  static encodeBase64(data: Uint8Array): Base64 {
    try {
      if (!data || data.length === 0) {
        return '' as Base64;
      }

      // Use  BufferUtils for consistent cross-platform Base64 encoding
      return BufferUtils.encodeBase64(data);
    } catch (error) {
      throw new Error(
        `Base64 encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Decode Base64 string to binary data
   *
   * @param encodedData - Base64 encoded string
   * @returns Binary data as Uint8Array
   */
  static decodeBase64(encodedData: Base64): Uint8Array {
    try {
      if (!encodedData || typeof encodedData !== 'string') {
        throw createAppropriateError('Invalid Base64 input: must be a non-empty string', {
          operation: 'Base64 decoding',
          errorType: 'format',
          preset: Preset.DEFAULT,
        });
      }

      // Use modern BufferUtils for consistent cross-platform Base64 decoding
      // (includes validation internally)
      return BufferUtils.decodeBase64(encodedData);
    } catch (error) {
      throw createAppropriateError('Base64 decoding failed', {
        operation: 'Base64 decoding',
        errorType: 'format',
        preset: Preset.DEFAULT,
      });
    }
  }

  /**
   * Validate that data can be safely serialized
   *
   * @param data - Data to validate
   * @returns True if data is serializable
   */
  static isSerializable(data: any): boolean {
    try {
      // Check for circular references and unsupported types
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the size of serialized data without actually serializing
   *
   * @param data - Data to estimate size for
   * @returns Estimated size in bytes
   */
  static estimateSerializedSize(data: any): number {
    try {
      if (data instanceof Uint8Array) {
        return data.length;
      }

      const jsonString = JSON.stringify(data);
      return BufferUtils.getUtf8ByteLength(jsonString);
    } catch {
      return 0;
    }
  }

  // Private utility methods

  /**
   * Determine the JavaScript data type of a value
   */
  private static getDataType(data: any): string {
    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    if (data instanceof Uint8Array) return 'Uint8Array';
    if (Array.isArray(data)) return 'Array';

    return typeof data;
  }

  /**
   * Convert data to JSON string with type preservation
   */
  private static toJsonString(data: any, originalType: string): string {
    if (originalType === 'undefined') {
      return JSON.stringify({ __type: 'undefined', value: null });
    }

    if (originalType === 'Uint8Array') {
      // Convert Uint8Array to regular array for JSON serialization
      return JSON.stringify({
        __type: 'Uint8Array',
        value: Array.from(data as Uint8Array),
      });
    }

    if (originalType === 'string' || originalType === 'number' || originalType === 'boolean') {
      return JSON.stringify({ __type: originalType, value: data });
    }

    // For objects, arrays, and null, serialize directly
    return JSON.stringify(data);
  }

  /**
   * Parse JSON string back to original type
   */
  private static fromJsonString(jsonString: string, _originalType?: string): any {
    const parsed = JSON.parse(jsonString);

    // Handle type-preserved data
    if (parsed && typeof parsed === 'object' && parsed.__type) {
      switch (parsed.__type) {
        case 'undefined':
          return undefined;
        case 'Uint8Array':
          return new Uint8Array(parsed.value);
        case 'string':
        case 'number':
        case 'boolean':
          return parsed.value;
        default:
          return parsed.value;
      }
    }

    return parsed;
  }
}
