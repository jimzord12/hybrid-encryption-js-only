import { Preset } from '../core/common/enums';
import { KeyManagerStatus } from '../core/key-management/types/key-manager.types';

/**
 * Status information for the ServerDecryption instance
 */
export interface ServerDecryptionStatus {
  initialized: boolean;
  preset: Preset | null;
  keyManager: KeyManagerStatus | null;
}

/**
 * Health check result for the ServerDecryption instance
 */
export interface ServerDecryptionHealth {
  healthy: boolean;
  issues: string[];
}

export { Base64 } from '../core/common/types/branded-types.types';

/**
 * Base64 encoded string type for server operations
 */
