import { Preset } from '../enums';
import { KeyPair } from '../interfaces/common/index.interface';
import { Base64 } from './branded-types.types';

export interface KeyGenerationConfig {
  preset: Preset;
  expiryMonths?: number;
}

export interface SerializedKeyMetadata {
  preset: Preset;
  version?: number;
  createdAt?: string;
  expiresAt?: string;
}

/**
 * Serialized keys interface - for storage and transmission
 * Keys are Base64 encoded for storage in JSON/text formats
 */
export interface SerializedKeys {
  publicKey: Base64; // Base64 encoded binary key
  privateKey: Base64; // Base64 encoded binary key
  metadata: SerializedKeyMetadata;
}

export interface KeyValidationResult {
  isValid: boolean;
  errors: string[];
  publicKeyValid: boolean;
  privateKeyValid: boolean;
  keyPairMatches: boolean;
  notExpired: boolean;
}

export interface KeyManagerConfig {
  preset?: Preset;
  certPath?: string; // Path to certificate directory (default: ./config/certs)
  keyExpiryMonths?: number; // Key expiry in months (default: 1)
  autoGenerate?: boolean; // Auto-generate keys (default: true)
  enableFileBackup?: boolean; // Backup keys to filesystem (default: true)
  rotationGracePeriod?: number; // Grace period in minutes during rotation (default: 15)
}

export interface KeyRotationState {
  isRotating: boolean;
  rotationPromise: Promise<void> | null;
  rotationStartTime: Date | null;
  previousKeys: KeyPair | null;
  newKeys: KeyPair | null;
}

export interface KeyManagerStatus {
  hasKeys: boolean;
  keysValid: boolean;
  keysExpired: boolean;
  isRotating: boolean;
  currentKeyVersion: number | null;
  createdAt: Date | null;
  expiresAt: Date | null;
  certPath: string;
  lastRotation: Date | null;
}

export interface RotationHistoryEntry {
  version: number;
  createdAt: string;
  expiresAt: string;
  keySize: number;
  rotatedAt: string;
  reason: 'initial_generation' | 'scheduled_rotation' | 'manual_rotation';
}

export interface RotationHistory {
  totalRotations: number;
  rotations: RotationHistoryEntry[];
  createdAt: string;
  lastUpdated: string;
}

export interface RotationStats {
  totalRotations: number;
  averageKeyLifetimeDays: number; // in days
  oldestRotation: RotationHistoryEntry | null;
  newestRotation: RotationHistoryEntry | null;
  rotationsThisYear: number;
  rotationsThisMonth: number;
}
