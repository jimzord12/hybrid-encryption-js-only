import { Preset } from '../../enums';
import { Base64 } from '../../types/branded-types.types';

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

export interface SerializedKeyMetadata {
  preset: Preset;
  version: number;
  createdAt: string;
  expiresAt: string;
}

/**
 * Serialized keys interface - for storage and transmission
 * Keys are Base64 encoded for storage in JSON/text formats
 */
export interface SerializedKeys {
  publicKey: Base64; // Base64 encoded binary key
  secretKey: Base64; // Base64 encoded binary key
  metadata: SerializedKeyMetadata;
}
