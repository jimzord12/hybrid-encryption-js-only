import { createAppropriateError } from '../../../core/common/errors';
import { isValidPreset } from '../../../core/common/guards/enum.guards';
import { KeyManagerConfig } from '../../../core/key-management/types/key-manager.types';
import path from 'node:path';
import process from 'node:process';

export class KeyConfigurationService {
  public validateConfig(config: Required<KeyManagerConfig>): void {
    const errors: string[] = [];

    if (!isValidPreset(config.preset)) {
      errors.push(`Invalid preset (got ${config.preset})`);
    }

    // Validate key expiry months
    if (config.keyExpiryMonths <= 0) {
      errors.push(`Key expiry months must be positive (got ${config.keyExpiryMonths})`);
    }

    // Validate rotation grace period
    if (config.rotationGracePeriod < 0) {
      errors.push(
        `Rotation grace period cannot be negative (got ${config.rotationGracePeriod})`,
      );
    }

    // Validate cert path
    if (config.certPath === '' || config.certPath.trim() === '') {
      errors.push('Certificate path cannot be empty');
    } else {
      // Validate cert path to prevent path traversal attacks
      const normalizedPath = path.normalize(config.certPath);
      const resolvedPath = path.resolve(normalizedPath);
      const cwd = process.cwd();

      // Ensure the path is within the current working directory
      if (!resolvedPath.startsWith(cwd)) {
        errors.push('Certificate path must be within the current working directory');
      }

      // Ensure the path doesn't contain unsafe characters or patterns
      if (config.certPath.includes('../') || config.certPath.includes('..\\')) {
        errors.push('Certificate path contains unsafe path traversal patterns');
      }
    }

    if (errors.length > 0) {
      throw createAppropriateError(`Invalid configuration: ${errors.join(', ')}`, {
        errorType: 'config',
        preset: config.preset,
        parameterName: 'configuration',
        validValues: ['Valid preset, positive expiry months, valid cert path'],
      });
    }
  }
}
