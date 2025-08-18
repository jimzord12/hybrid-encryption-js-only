import { Preset } from '../../common/enums';

export const DEFAULT_KEY_MANAGER_OPTIONS = {
  preset: Preset.NORMAL,
  certPath: './config/certs/keys',
  keyExpiryMonths: 1,
  autoGenerate: true,
  enableFileBackup: true,
  rotationGracePeriodInMinutes: 15,
  // Other default options can be added here
};
