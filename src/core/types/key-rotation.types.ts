import { RSAKeyPair } from './encryption.types';

export interface KeyManagerConfig {
  certPath?: string; // Path to certificate directory (default: ./config/certs)
  keySize?: number; // RSA key size (default: 2048)
  keyExpiryMonths?: number; // Key expiry in months (default: 1)
  autoGenerate?: boolean; // Auto-generate keys if missing (default: true)
  enableFileBackup?: boolean; // Backup keys to filesystem (default: true)
  rotationGracePeriod?: number; // Grace period in minutes during rotation (default: 5)
}

export interface KeyRotationState {
  isRotating: boolean;
  rotationPromise: Promise<void> | null;
  rotationStartTime: Date | null;
  previousKeys: RSAKeyPair | null;
  newKeys: RSAKeyPair | null;
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
  reason: 'initial_generation' | 'scheduled_rotation' | 'manual_rotation' | 'emergency_rotation';
}

export interface RotationHistory {
  totalRotations: number;
  rotations: RotationHistoryEntry[];
  createdAt: string;
  lastUpdated: string;
}

export interface RotationStats {
  totalRotations: number;
  averageKeyLifetime: number; // in days
  oldestRotation: RotationHistoryEntry | null;
  newestRotation: RotationHistoryEntry | null;
  rotationsThisYear: number;
  rotationsThisMonth: number;
}

export interface KeyValidationResult {
  isValid: boolean;
  errors: string[];
  publicKeyValid: boolean;
  privateKeyValid: boolean;
  keyPairMatches: boolean;
  notExpired: boolean;
}
