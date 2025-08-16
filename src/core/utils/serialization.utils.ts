import { Preset } from '../common/enums';
import { createAppropriateError, ValidationError } from '../common/errors';
import { SerializableData } from '../common/interfaces/serialization.interfaces';
import { Base64 } from '../common/types/branded-types.types';
import { BufferUtils } from './buffer.utils';

export const serializableTypes = new Set<SerializableData>([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'object',
  'array',
]);

// const supportedArrays = [Array, Uint8Array];
// const supportedTypes = [String, Number, Boolean, Date, ArrayBuffer, ...supportedArrays];

/**
 * Modern serialization utility class for hybrid encryption
 *
 * Provides secure, efficient, and type-aware serialization for all JavaScript
 * data types with proper error handling and data integrity validation.
 */
export class Serialization {
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
  static serializeForEncryption(data: SerializableData): Uint8Array {
    try {
      console.log('Daata:', data);
      if (!Serialization.isSerializable(data)) {
        throw createAppropriateError('Data is not serializable', {
          errorType: 'validation',
          preset: undefined as any,
          operation: 'serialize',
        });
      }
      // Handle special cases first
      if (data instanceof Uint8Array) {
        return data; // Pass through binary data as-is
      }

      // Determine the original data type
      const originalType = Serialization.getDataType(data);

      // Convert data to JSON string representation
      const jsonString = Serialization.toJsonString(data, originalType);

      // Convert JSON string to UTF-8 bytes using BufferUtils
      const binaryData = BufferUtils.stringToBinary(jsonString);

      return binaryData;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      } else {
        throw createAppropriateError('Serialization failed', {
          errorType: 'format',
          preset: Preset.NORMAL,
          operation: 'serialize',
          cause: error instanceof Error ? error : undefined,
        });
      }
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
        throw createAppropriateError('Cannot deserialize empty data', {
          errorType: 'validation',
          preset: Preset.NORMAL,
          operation: 'deserialize',
        });
      }

      let binaryData: Uint8Array;

      binaryData = data;

      // Convert binary data to UTF-8 string using BufferUtils
      const jsonString = BufferUtils.binaryToString(binaryData);

      // Parse JSON string back to JavaScript value
      const parsedData = Serialization.fromJsonString(jsonString);

      return parsedData as T;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Re-throw validation errors directly
      } else {
        throw createAppropriateError('Deserialization failed', {
          errorType: 'format',
          preset: Preset.NORMAL,
          operation: 'deserialize',
          cause: error instanceof Error ? error : undefined,
        });
      }
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
      if (data == null)
        throw createAppropriateError('Cannot encode null or undefined data', {
          errorType: 'validation',
          preset: undefined as any,
          operation: 'encodeBase64',
        });

      if (data.length === 0) {
        return '' as Base64;
      }

      // Use  BufferUtils for consistent cross-platform Base64 encoding
      return BufferUtils.encodeBase64(data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw createAppropriateError('Base64 encoding failed', {
        errorType: 'format',
        preset: Preset.NORMAL,
        operation: 'encode',
        cause: error instanceof Error ? error : undefined,
      });
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
      if (encodedData == null || typeof encodedData !== 'string') {
        throw createAppropriateError('Invalid Base64 input: must be a non-empty string', {
          operation: 'Base64 decoding',
          errorType: 'format',
          preset: Preset.NORMAL,
        });
      }

      // Use modern BufferUtils for consistent cross-platform Base64 decoding
      // (includes validation internally)
      return BufferUtils.decodeBase64(encodedData);
    } catch (error) {
      throw createAppropriateError('Base64 decoding failed', {
        operation: 'Base64 decoding',
        errorType: 'format',
        preset: Preset.NORMAL,
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
    if (!Serialization.isTypeSerializable(data)) return false;

    try {
      // Check for circular references and unsupported types
      JSON.stringify(data);
      return true;
    } catch (error) {
      console.log(error);
      return false;
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

  // private static isInstanceOfAny(
  //   value: unknown,
  //   types: Array<new (...args: any[]) => any>,
  // ): boolean {
  //   for (const Type of types) {
  //     if (value instanceof Type) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  public static getSupportedTypes(): ReadonlySet<SerializableData> {
    return serializableTypes;
  }

  public static isTypeSerializable(value: unknown): value is SerializableData {
    if (value === null || value === undefined) {
      return true;
    }

    // Explicitly reject known non-serializable types
    if (typeof value === 'bigint') {
      return false;
    }

    if (typeof value === 'symbol') {
      return false; // Symbols serialize to undefined
    }

    if (typeof value === 'function') {
      return false; // Functions serialize to undefined
    }

    if (value instanceof RegExp) {
      return false;
    }

    if (value instanceof Error) {
      return false; // Error objects have non-enumerable properties
    }

    if (value instanceof Set) {
      return false; // Set objects serialize to empty objects
    }

    if (value instanceof Map) {
      return false; // Map objects serialize to empty objects
    }

    if (value instanceof WeakMap) {
      return false; // WeakMap objects serialize to empty objects
    }

    if (value instanceof WeakSet) {
      return false; // WeakSet objects serialize to empty objects
    }

    if (value instanceof Promise) {
      return false; // Promise objects serialize to empty objects
    }

    return true;
  }
}
