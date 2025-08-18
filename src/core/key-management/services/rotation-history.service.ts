import fs from 'node:fs/promises';
import path from 'node:path';
import { KeyPair } from '../../../core/common/interfaces/keys.interfaces';
import { DEFAULT_KEY_MANAGER_OPTIONS } from '../../../core/key-management/constants/defaults.constants';
import {
  KeyManagerConfig,
  RotationHistory,
  RotationHistoryEntry,
} from '../../../core/key-management/types/key-manager.types';

export class RotationHistoryService {
  private readonly config: Pick<Required<KeyManagerConfig>, 'certPath'>;
  private rotationHistoryCache: RotationHistory | null = null;
  private rotationHistoryCacheTime: number | null = null;
  private readonly ROTATION_HISTORY_CACHE_TTL =
    DEFAULT_KEY_MANAGER_OPTIONS.rotationGracePeriodInMinutes * 60 * 1000; // 15 minutes

  constructor(config: Pick<Required<KeyManagerConfig>, 'certPath'>) {
    this.config = config;
  }

  /**
   * Get the next version number for key rotation
   */
  public async getNextVersionNumber(): Promise<number | undefined> {
    const history = await this.getRotationHistory();

    if (history.rotations.length === 0) {
      console.log('🚨 History Rotations not Found!');
      return;
    }

    console.log('🍁 History Rotations: ', history);

    // Find the highest version number and increment
    const maxVersion = Math.max(...history.rotations.map((r) => r.version));
    return maxVersion + 1;
  }

  /**
   * Update rotation history with new key information
   */
  public async updateRotationHistory(keyPair: KeyPair): Promise<void> {
    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const history = await this.getRotationHistory();

      const { metadata } = keyPair;
      const { createdAt, expiresAt, preset, version } = metadata;

      const rotationEntry: RotationHistoryEntry = {
        preset,
        version,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        rotatedAt: new Date().toISOString(),
        reason: (history.rotations.length > 0
          ? 'scheduled_rotation'
          : 'initial_generation') as RotationHistoryEntry['reason'],
      };

      history.rotations.push(rotationEntry);
      history.totalRotations = history.rotations.length;
      history.lastUpdated = new Date().toISOString();

      await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');

      // Invalidate cache
      this.rotationHistoryCache = null;
      this.rotationHistoryCacheTime = null;

      console.log(`📚 Updated rotation history (${history.totalRotations} total rotations)`);
    } catch (error) {
      console.warn('⚠️ Failed to update rotation history:', error);
      // Don't throw - history failure shouldn't stop key operations
    }
  }

  public getRotationCache() {
    const now = Date.now();
    const cache =
      this.rotationHistoryCache !== null &&
      this.rotationHistoryCacheTime !== null &&
      now - this.rotationHistoryCacheTime < this.ROTATION_HISTORY_CACHE_TTL;

    return cache ? this.rotationHistoryCache : null;
  }

  /**
   * Get rotation history
   */
  public async getRotationHistory(): Promise<RotationHistory> {
    // Check if we have a valid cache
    const now = Date.now();
    const cache = this.getRotationCache();
    if (cache !== null) {
      return cache;
    }

    const historyPath = path.join(this.config.certPath, 'rotation-history.json');

    try {
      const historyContent = await fs.readFile(historyPath, 'utf8');
      const history = JSON.parse(historyContent);

      // Update cache
      this.rotationHistoryCache = history;
      this.rotationHistoryCacheTime = now;

      return history;
    } catch (error) {
      console.log('⚠️ [getRotationHistory] Failed to read rotation history:', error);
      // If file doesn't exist or is invalid, return a default history
      const defaultHistory = {
        totalRotations: 0,
        rotations: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      // Update cache
      this.rotationHistoryCache = defaultHistory;
      this.rotationHistoryCacheTime = now;

      return defaultHistory;
    }
  }
}
