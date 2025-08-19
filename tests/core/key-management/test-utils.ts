import { access, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Preset } from '../../../src/core/common/enums';
import { KeyManagerConfig } from '../../../src/core/key-management/types/key-manager.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const TEST_CERT_PATH = process.env.TEST_CERT_PATH || join(__dirname, './test-certs');

export const TEST_CONFIG: Required<KeyManagerConfig> = {
  certPath: TEST_CERT_PATH,
  preset: Preset.NORMAL,
  keyExpiryMonths: 1,
  autoGenerate: true,
  enableFileBackup: true,
  rotationGracePeriodInMinutes: 0.05, // 3 seconds for testing
};

/**
 * Clean test directory utility
 */
export async function cleanTestDirectory(): Promise<void> {
  try {
    // Check if directory exists
    try {
      await access(TEST_CERT_PATH);
    } catch {
      // Directory doesn't exist, create it
      await mkdir(TEST_CERT_PATH, { recursive: true });
      return;
    }

    // If directory exists, read its contents
    const files = await readdir(TEST_CERT_PATH);

    // Delete all files in the directory
    const deletePromises = files.map(async (file) => {
      const filePath = join(TEST_CERT_PATH, file);
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
