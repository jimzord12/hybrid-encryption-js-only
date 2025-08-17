import { access, mkdir, readdir, rm, stat } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KeyManagerConfig } from '../../../../src/core/key-management/types/key-manager.types';
import { Preset } from '../../../../src/core/common/enums';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const TEST_CERT_PATH_V2 =
  process.env.TEST_CERT_PATH_V2 ?? join(__dirname, './test-certs-v2');

export const TEST_CONFIG_V2: Required<KeyManagerConfig> = {
  certPath: TEST_CERT_PATH_V2,
  preset: Preset.NORMAL,
  keyExpiryMonths: 1,
  autoGenerate: true,
  enableFileBackup: true,
  rotationGracePeriod: 0.05, // 3 seconds for testing
};

/**
 * Clean test directory utility
 */
export async function cleanTestDirectory(): Promise<void> {
  try {
    // Check if directory exists
    try {
      await access(TEST_CERT_PATH_V2);
    } catch {
      // Directory doesn't exist, create it
      await mkdir(TEST_CERT_PATH_V2, { recursive: true });
      return;
    }

    // If directory exists, read its contents
    const files = await readdir(TEST_CERT_PATH_V2);

    // Delete all files in the directory
    const deletePromises = files.map(async file => {
      const filePath = join(TEST_CERT_PATH_V2, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        await rm(filePath, { recursive: true, force: true });
      } else {
        await rm(filePath, { force: true });
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Failed to clean test directory:', error);
  }
}
