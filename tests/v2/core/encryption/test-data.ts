import { randomBytes } from '@noble/hashes/utils';
import { ML_KEM_STATS } from '../../../../src/core/constants';
import { Preset } from '../../../../src/core/enums';
import { KeyPair } from '../../../../src/core/interfaces/common/index.interface';

export type KeyPairType = 'both-good' | 'both-bad' | 'pub-bad' | 'secret-bad';

export const TestsingkeyPairs: Map<KeyPairType, KeyPair> = new Map([
  [
    'both-good',
    {
      preset: Preset.DEFAULT,
      publicKey: randomBytes(ML_KEM_STATS.publicKeyLength[Preset.DEFAULT]),
      secretKey: randomBytes(ML_KEM_STATS.secretKeyLength[Preset.DEFAULT]),
      metadata: {
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
  [
    'both-bad',
    {
      preset: Preset.DEFAULT,
      publicKey: randomBytes(32),
      secretKey: randomBytes(32),
      metadata: {
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
  [
    'pub-bad',
    {
      preset: Preset.DEFAULT,
      publicKey: randomBytes(32),
      secretKey: randomBytes(ML_KEM_STATS.secretKeyLength[Preset.DEFAULT]),
      metadata: {
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
  [
    'secret-bad',
    {
      preset: Preset.DEFAULT,
      publicKey: randomBytes(ML_KEM_STATS.publicKeyLength[Preset.DEFAULT]),
      secretKey: randomBytes(32),
      metadata: {
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    },
  ],
]);
