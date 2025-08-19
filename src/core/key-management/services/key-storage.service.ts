import fs from 'node:fs/promises';
import path from 'node:path';
import { KeyPair } from '../../../core/common/interfaces/keys.interfaces';
import { KeyManagerConfig } from '../../../core/key-management/types/key-manager.types';
import { createAppropriateError } from '../../common/errors/encryption.errors';
import { SerializedKeyMetadata } from '../../common/interfaces/serialization.interfaces';

export class KeyStorageService {
  private readonly config: Pick<Required<KeyManagerConfig>, 'certPath' | 'preset'>;

  constructor(config: Pick<Required<KeyManagerConfig>, 'certPath' | 'preset'>) {
    this.config = config;
  }

  /**
   * Ensure certificate directory exists
   */
  public async ensureCertDirectory(): Promise<void> {
    try {
      console.log('Ensuring certificate directory exists...');
      // Check if directory already exists to avoid unnecessary operations
      try {
        const stat = await fs.stat(this.config.certPath);
        if (stat.isDirectory()) {
          return; // Directory already exists
        }
      } catch (error) {
        console.log('⚠️ [ensureCertDirectory] Failed to access cert directory:', error);
        // Directory doesn't exist, continue with creation
      }

      // Create directory if it doesn't exist
      await fs.mkdir(this.config.certPath, { recursive: true });
    } catch (error) {
      throw createAppropriateError(
        `Failed to create cert directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          errorType: 'keymanager',
          preset: this.config.preset,
          operation: 'storage',
          filePath: this.config.certPath,
          cause: error instanceof Error ? error : new Error('Directory creation failed'),
        },
      );
    }
  }

  /**
   * Load keys from binary files (modern format)
   */
  public async loadKeysFromFile(): Promise<KeyPair | null> {
    const publicKeyPath = path.join(this.config.certPath, 'public-key.bin');
    const secretKeyPath = path.join(this.config.certPath, 'secret-key.bin');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    try {
      console.log('🚛 Loading modern binary key files...');

      // Read binary key files and JSON metadata
      const [publicKeyBinary, secretKeyBinary, metadataStr] = await Promise.all([
        fs.readFile(publicKeyPath),
        fs.readFile(secretKeyPath),
        fs.readFile(metadataPath, 'utf8').catch(() => '{}'),
      ]);

      console.log('1. Loaded key files:', {
        publicKey: publicKeyBinary.length > 0 ? '✔️' : '❌',
        secretKey: secretKeyBinary.length > 0 ? '✔️' : '❌',
        metadata: metadataStr ? '✔️' : '❌',
      });

      let metadata: Partial<KeyPair['metadata']> = {};
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        console.log('⚠️ Failed to parse key metadata, using defaults');
        return null;
      }

      if (!publicKeyBinary || !secretKeyBinary) {
        console.log('⚠️ Missing key material, generating new keys');
        return null;
      }

      if (!metadata.createdAt || !metadata.preset || !metadata.version || !metadata.expiresAt) {
        console.log('⚠️ Missing metadata properties, generating new keys');
        return null;
      }

      const createdAt = new Date(metadata.createdAt);
      const expiresAt = new Date(metadata.expiresAt);
      const version = metadata.version;

      const keyPair: KeyPair = {
        publicKey: new Uint8Array(publicKeyBinary),
        secretKey: new Uint8Array(secretKeyBinary), // Use secretKey for ML-KEM compatibili]ty
        metadata: {
          preset: metadata.preset,
          version,
          createdAt,
          expiresAt,
        },
      };

      console.log('3.1 Loaded Key Pair (PK):', keyPair.publicKey.length, 'bytes');
      console.log('3.1 Loaded Key Pair (SK):', keyPair.secretKey.length, 'bytes');

      return keyPair;
    } catch (error) {
      console.log('⚠️ Failed to load keys from filesystem:', error);
      return null;
    }
  }

  /**
   * Save keys to binary files with modern format
   * @param keyPair - ModernKeyPair with binary keys as Uint8Array
   */
  public async saveKeysToFile(keyPair: KeyPair): Promise<void> {
    const publicKeyPath = path.join(this.config.certPath, 'public-key.bin');
    const secretPath = path.join(this.config.certPath, 'secret-key.bin');
    const metadataPath = path.join(this.config.certPath, 'key-metadata.json');

    const { publicKey, secretKey } = keyPair;

    try {
      // Create metadata with key information
      const metadata: SerializedKeyMetadata = {
        preset: this.config.preset,
        version: keyPair.metadata.version,
        createdAt: keyPair.metadata.createdAt.toISOString(),
        expiresAt: keyPair.metadata.expiresAt.toISOString(),
      };

      // Write binary key files and metadata
      await Promise.all([
        fs.writeFile(publicKeyPath, publicKey),
        fs.writeFile(secretPath, secretKey),
        fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8'),
      ]);

      // Set secure permissions on secret key file
      if (process.platform === 'win32') {
        // Windows: Set file as read-only and try to set NTFS permissions
        try {
          await fs.chmod(secretPath, 0o600);
        } catch (error) {
          console.warn('⚠️ Could not set Windows file permissions:', error);
        }
      } else {
        // Unix-like systems: Set proper octal permissions
        await fs.chmod(secretPath, 0o600);
      }

      console.log('✅ Successfully saved binary keys to filesystem');
    } catch (error) {
      console.log('❌ Failed to save keys to filesystem:', error);
      throw createAppropriateError(
        `Failed to save binary keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          preset: this.config.preset,
          errorType: 'keymanager',
          operation: 'storage',
          filePath: this.config.certPath,
          keyVersion: keyPair.metadata.version,
          cause: error instanceof Error ? error : new Error('Key save operation failed'),
        },
      );
    }
  }

  /**
   * Backup expired keys
   */
  public async backupExpiredKeys(keyPair: KeyPair): Promise<void> {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const backupDir = path.join(this.config.certPath, 'backup');

    try {
      // Check if directory already exists to avoid unnecessary operations
      try {
        const stat = await fs.stat(backupDir);
        if (!stat.isDirectory()) {
          await fs.mkdir(backupDir, { recursive: true });
        }
      } catch (error) {
        console.log('⚠️ [backupExpiredKeys] Failed to access backup directory:', error);
        // Directory doesn't exist, create it
        await fs.mkdir(backupDir, { recursive: true });
      }

      const backupPublicPath = path.join(backupDir, `pub-key-expired-${timestamp}.bin`);
      const backupSecretPath = path.join(backupDir, `secret-key-expired-${timestamp}.bin`);

      if (!keyPair.secretKey) {
        throw new Error('No secret key data found for backup');
      }

      await Promise.all([
        fs.writeFile(backupPublicPath, keyPair.publicKey),
        fs.writeFile(backupSecretPath, keyPair.secretKey),
      ]);

      await fs.chmod(backupSecretPath, 0o600);
      console.log(`📦 Backed up expired keys to ${backupDir}`);
    } catch (error) {
      console.warn('⚠️ Failed to backup expired keys:', error);
      // Don't throw - backup failure shouldn't stop rotation
    }
  }

  /**
   * Clean up old backup files (older than 3 months)
   */
  public async cleanupOldBackups(): Promise<void> {
    const backupDir = path.join(this.config.certPath, 'backup');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    try {
      const files = await fs.readdir(backupDir);
      const expiredFiles = files.filter((file) => {
        const match = file.match(/expired-(\d{4}-\d{2})/);
        if (!match) return false;

        const fileDate = new Date(match[1] + '-01');
        return fileDate < threeMonthsAgo;
      });

      for (const file of expiredFiles) {
        await fs.unlink(path.join(backupDir, file));
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old backups:', error);
    }
  }
}
