/**
 * Modern Data Serialization Utilities
 *
 * Provides secure and efficient serialization/deserialization for the modern
 * hybrid encryption system. Handles conversion between JavaScript data types
 * and binary formats suitable for cryptographic operations.
 *
 * Features:
 * - Type-aware serialization with integrity preservation
 * - Consistent UTF-8 encoding using modern Buffer APIs
 * - Efficient Base64 encoding/decoding without legacy APIs
 * - Comprehensive error handling and validation
 * - Support for all JavaScript data types
 */

import { BufferUtils } from './buffer.util';

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
 * Serialization configuration options
 */
export interface SerializationOptions {
  /** Include integrity checksum */
  includeChecksum?: boolean;
  /** Use compression (future enhancement) */
  useCompression?: boolean;
  /** Custom serialization version */
  version?: string;
  /** Preserve type information */
  preserveType?: boolean;
}

/**
 * Modern serialization utility class for hybrid encryption
 *
 * Provides secure, efficient, and type-aware serialization for all JavaScript
 * data types with proper error handling and data integrity validation.
 */
export class ModernSerialization {
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
  static serializeForEncryption(data: any, options?: SerializationOptions): Uint8Array {
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

      // Return binary data directly if no metadata needed
      if (!options?.preserveType && !options?.includeChecksum) {
        return binaryData;
      }

      // Create serialization metadata
      const metadata: SerializationMetadata = {
        originalType,
        version: options?.version || this.SERIALIZATION_VERSION,
        encoding: this.DEFAULT_ENCODING,
        timestamp: Date.now(),
      };

      // Add checksum if requested
      if (options?.includeChecksum) {
        metadata.checksum = this.calculateChecksum(binaryData);
      }

      // Combine metadata and data
      return this.combineMetadataAndData(metadata, binaryData);
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
  static deserializeFromDecryption<T = any>(data: Uint8Array, options?: SerializationOptions): T {
    try {
      if (!data || data.length === 0) {
        throw new Error('Cannot deserialize empty data');
      }

      let binaryData: Uint8Array;
      let metadata: SerializationMetadata | null = null;

      // Check if data includes metadata
      if (options?.preserveType || this.hasMetadata(data)) {
        const result = this.extractMetadataAndData(data);
        binaryData = result.data;
        metadata = result.metadata;

        // Validate checksum if present
        if (metadata.checksum) {
          const calculatedChecksum = this.calculateChecksum(binaryData);
          if (calculatedChecksum !== metadata.checksum) {
            throw new Error('Data integrity check failed: checksum mismatch');
          }
        }
      } else {
        binaryData = data;
      }

      // Convert binary data to UTF-8 string using BufferUtils
      const jsonString = BufferUtils.binaryToString(binaryData);

      // Parse JSON string back to JavaScript value
      const parsedData = this.fromJsonString(jsonString, metadata?.originalType);

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
  static encodeBase64(data: Uint8Array): string {
    try {
      if (!data || data.length === 0) {
        return '';
      }

      // Use modern BufferUtils for consistent cross-platform Base64 encoding
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
  static decodeBase64(encodedData: string): Uint8Array {
    try {
      if (!encodedData || typeof encodedData !== 'string') {
        throw new Error('Invalid Base64 input: must be a non-empty string');
      }

      // Use modern BufferUtils for consistent cross-platform Base64 decoding
      // (includes validation internally)
      return BufferUtils.decodeBase64(encodedData);
    } catch (error) {
      throw new Error(
        `Base64 decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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

  /**
   * Calculate a simple checksum for data integrity
   */
  private static calculateChecksum(data: Uint8Array): string {
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum = (checksum + data[i]) % 65536;
    }
    return checksum.toString(16).padStart(4, '0');
  }

  /**
   * Check if binary data includes serialization metadata
   */
  private static hasMetadata(data: Uint8Array): boolean {
    try {
      // Look for metadata header pattern using BufferUtils
      const headerString = BufferUtils.binaryToString(data.slice(0, Math.min(100, data.length)));
      return headerString.includes('"version"') && headerString.includes('"originalType"');
    } catch {
      return false;
    }
  }

  /**
   * Combine metadata and data into single binary blob
   */
  private static combineMetadataAndData(
    metadata: SerializationMetadata,
    data: Uint8Array,
  ): Uint8Array {
    const metadataJson = JSON.stringify(metadata);
    const metadataBytes = BufferUtils.stringToBinary(metadataJson);
    const headerLength = metadataBytes.length;

    // Create header with length prefix (4 bytes) + metadata + data
    const result = new Uint8Array(4 + headerLength + data.length);

    // Write header length as 32-bit big-endian integer
    result[0] = (headerLength >>> 24) & 0xff;
    result[1] = (headerLength >>> 16) & 0xff;
    result[2] = (headerLength >>> 8) & 0xff;
    result[3] = headerLength & 0xff;

    // Write metadata
    result.set(metadataBytes, 4);

    // Write data
    result.set(data, 4 + headerLength);

    return result;
  }

  /**
   * Extract metadata and data from combined binary blob
   */
  private static extractMetadataAndData(data: Uint8Array): {
    metadata: SerializationMetadata;
    data: Uint8Array;
  } {
    if (data.length < 4) {
      throw new Error('Invalid metadata format: data too short');
    }

    // Read header length from first 4 bytes
    const headerLength = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];

    if (headerLength < 0 || headerLength > data.length - 4) {
      throw new Error('Invalid metadata format: invalid header length');
    }

    // Extract and parse metadata using BufferUtils
    const metadataBytes = data.slice(4, 4 + headerLength);
    const metadataJson = BufferUtils.binaryToString(metadataBytes);
    const metadata = JSON.parse(metadataJson) as SerializationMetadata;

    // Extract actual data
    const actualData = data.slice(4 + headerLength);

    return { metadata, data: actualData };
  }
}
