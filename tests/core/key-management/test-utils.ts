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
