import { CryptoKeyPair, SupportedAlgorithms } from './crypto-provider.types';

export interface KeyManagerConfig {
  certPath?: string; // Path to certificate directory (default: ./config/certs)
  algorithm?: SupportedAlgorithms; // Cryptographic algorithm (default: 'ml-kem-768')
  keySize?: number; // Key size in bits (768, 1024 for ML-KEM; 128, 192, 256 for AES)
  curve?: string | undefined; // ECC curve (e.g., 'P-256', 'P-384', 'P-521') - legacy support
  keyExpiryMonths?: number; // Key expiry in months (default: 1)
  autoGenerate?: boolean; // Auto-generate keys if missing (default: true)
  enableFileBackup?: boolean; // Backup keys to filesystem (default: true)
  rotationGracePeriod?: number; // Grace period in minutes during rotation (default: 5)
}

export interface KeyRotationState {
  isRotating: boolean;
  rotationPromise: Promise<void> | null;
  rotationStartTime: Date | null;
  previousKeys: CryptoKeyPair | null;
  newKeys: CryptoKeyPair | null;
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
