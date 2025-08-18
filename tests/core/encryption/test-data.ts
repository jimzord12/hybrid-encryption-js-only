import { randomBytes } from '@noble/hashes/utils';
import { Preset } from '../../../src/core/common/enums';
import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';
import { ML_KEM_STATS } from '../../../src/core/encryption/constants/encryption.constants';

export type KeyPairType = 'both-good' | 'both-bad' | 'pub-bad' | 'secret-bad';

export const TestsingkeyPairs: Map<KeyPairType, KeyPair> = new Map([
  [
    'both-good',
    {
      publicKey: randomBytes(ML_KEM_STATS.publicKeyLength[Preset.NORMAL]),
      secretKey: randomBytes(ML_KEM_STATS.secretKeyLength[Preset.NORMAL]),
      metadata: {
        preset: Preset.NORMAL,
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
  [
    'both-bad',
    {
      publicKey: randomBytes(32),
      secretKey: randomBytes(32),
      metadata: {
        preset: Preset.NORMAL,
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
  [
    'pub-bad',
    {
      publicKey: randomBytes(32),
      secretKey: randomBytes(ML_KEM_STATS.secretKeyLength[Preset.NORMAL]),
      metadata: {
        preset: Preset.NORMAL,
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
  [
    'secret-bad',
    {
      publicKey: randomBytes(ML_KEM_STATS.publicKeyLength[Preset.NORMAL]),
      secretKey: randomBytes(32),
      metadata: {
        preset: Preset.NORMAL,
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
]);
