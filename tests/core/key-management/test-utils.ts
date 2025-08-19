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
  rotationIntervalInWeeks: 1,
};

/**
 * Clean test directory utility
 */
export async function cleanTestDirectory(dir: string): Promise<void> {
  try {
    // Check if directory exists
    try {
      await access(dir);
    } catch {
      // Directory doesn't exist, create it
      await mkdir(dir, { recursive: true });
      return;
    }

    // If directory exists, read its contents
    const files = await readdir(dir);

    // Delete all files in the directory
    const deletePromises = files.map(async (file) => {
      const filePath = join(dir, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        await rm(filePath, { recursive: true, force: true });
      } else {
        await rm(filePath, { force: true });
      }

      await deleteDirectoryIfEmpty(dir);
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Failed to clean test directory:', error);
  }
}

/**
 * Delete the directory at `dir` only if it exists and is empty.
 *
 * Returns `true` when the directory was removed, `false` otherwise.
 */
export async function deleteDirectoryIfEmpty(dir: string): Promise<boolean> {
  try {
    const stats = await stat(dir);

    if (!stats.isDirectory()) {
      // Not a directory — nothing to delete
      return false;
    }

    const entries = await readdir(dir);
    if (entries.length !== 0) {
      // Directory not empty
      return false;
    }

    // Directory exists and is empty — remove it
    await rm(dir, { force: true });
    return true;
  } catch (error: any) {
    // If the directory doesn't exist, treat as not removed
    if (error && error.code === 'ENOENT') return false;
    console.warn('Failed to remove empty directory:', error);
    return false;
  }
}
