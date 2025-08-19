import path from 'node:path';
import { KeyManager_TEST } from '../../../src/core/key-management/key-manager-testing';
import { KeyManagerConfig } from '../../../src/core/key-management/types/key-manager.types';
import { cleanTestDirectory } from '../../core/key-management/test-utils';
import { waitFor } from '../../core/utils/debug/async';
import { directoryExists } from '../../core/utils/debug/filesystem';

const __dirname = new URL('.', import.meta.url).pathname;
const TEST_CERT_PATH_AA = path.join(__dirname, './certs');
const TEST_CONFIG_AA = {
  certPath: TEST_CERT_PATH_AA,
  rotationGracePeriodInMinutes: 0.025, // 1.5 sec
} satisfies KeyManagerConfig;

describe('Key Rotation Job', () => {
  beforeAll(async () => {
    KeyManager_TEST.resetInstance();

    if (await directoryExists(TEST_CERT_PATH_AA)) {
      cleanTestDirectory(TEST_CERT_PATH_AA);
    }
  });

  afterAll(async () => {
    KeyManager_TEST.resetInstance();
    if (await directoryExists(TEST_CERT_PATH_AA)) {
      cleanTestDirectory(TEST_CERT_PATH_AA);
    }
  });

  it('should correctly rotate keys', async () => {
    const keyManager = KeyManager_TEST.getInstance(TEST_CONFIG_AA);
    keyManager.initialize();
    const keyPair_01 = await keyManager.getKeyPair();

    expect(keyPair_01).toBeDefined();
    expect(keyPair_01.metadata).toBeDefined();
    expect(keyPair_01.metadata.version).toBeDefined();
    expect(keyPair_01.metadata.version).toBe(1);
    expect(keyPair_01.publicKey).toBeDefined();
    expect(keyPair_01.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair_01.publicKey.length).toBeGreaterThan(1000);
    expect(keyPair_01.secretKey).toBeDefined();
    expect(keyPair_01.secretKey).toBeInstanceOf(Uint8Array);
    expect(keyPair_01.secretKey.length).toBeGreaterThan(2000);

    const history_01 = await keyManager.historyService.getRotationHistory();

    expect(history_01).toBeDefined();
    expect(history_01.rotations).toHaveLength(1);
    expect(history_01.totalRotations).toBe(1);

    await waitFor(5 * 1000); // Waiting for Cron Job

    const keyPair_02 = await keyManager.getKeyPair();

    expect(keyPair_02.metadata.version).not.toBe(keyPair_01.metadata.version);
    expect(keyPair_02.publicKey.slice(50)).not.toBe(keyPair_01.publicKey.slice(50));
    expect(keyPair_02.secretKey.slice(50)).not.toBe(keyPair_01.secretKey.slice(50));

    expect(keyPair_02.metadata.version).toBe(2);

    const history_02 = await keyManager.historyService.getRotationHistory();

    expect(history_02).toBeDefined();
    expect(history_02.rotations).toHaveLength(2);
    expect(history_02.totalRotations).toBe(2);

    await waitFor(3 * 1000); // Waiting for Cron Job

    const keyPair_03 = await keyManager.getKeyPair();

    expect(keyPair_03.metadata.version).not.toBe(keyPair_02.metadata.version);
    expect(keyPair_03.publicKey.slice(50)).not.toBe(keyPair_02.publicKey.slice(50));
    expect(keyPair_03.secretKey.slice(50)).not.toBe(keyPair_02.secretKey.slice(50));

    expect(keyPair_03.metadata.version).toBe(3);

    const history_03 = await keyManager.historyService.getRotationHistory();

    expect(history_03).toBeDefined();
    expect(history_03.rotations).toHaveLength(3);
    expect(history_03.totalRotations).toBe(3);

    // Add assertions to verify key rotation
  });
});
