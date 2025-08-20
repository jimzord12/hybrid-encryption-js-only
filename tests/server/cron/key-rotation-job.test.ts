import nodeCron from 'node-cron';
import path from 'node:path';
import { KeyManager_TEST } from '../../../src/core/key-management/key-manager-testing';
import { KeyManagerConfig } from '../../../src/core/key-management/types/key-manager.types';
import { waitFor } from '../../core/utils/debug/async';
import { directoryExists } from '../../core/utils/debug/filesystem';
import { cleanTestDirectory } from '../../test-utils';

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

    // Enable cron jobs for this specific test
    process.env.DISABLE_KEY_ROTATION_CRON = 'false';
  });

  afterAll(async () => {
    KeyManager_TEST.resetInstance();
    if (await directoryExists(TEST_CERT_PATH_AA)) {
      cleanTestDirectory(TEST_CERT_PATH_AA);
    }

    nodeCron.getTask('Test Key Rotation Job')?.destroy();

    // Restore test environment setting
    process.env.DISABLE_KEY_ROTATION_CRON = 'true';
  });

  it('should correctly rotate keys', async () => {
    // Explicitly enable cron job for this test
    process.env.DISABLE_KEY_ROTATION_CRON = 'false';

    const keyManager = KeyManager_TEST.getInstance(TEST_CONFIG_AA);
    await keyManager.initialize();

    // Manually start the cron job since we enabled it after initialization
    const { registerRotationJob_TEST } = await import(
      '../../../src/server/cron/key-rotation-job.js'
    );
    registerRotationJob_TEST();

    console.log('1 | GET STATUS: ', await keyManager.getStatus());

    console.log('============================');
    const keyPair_01 = await keyManager.getKeyPair();
    console.log('2 | GET STATUS: ', await keyManager.getStatus());
    console.log('============================');

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

    console.log('');
    console.log('######### | END of ROTATION #1 | #########');
    console.log('');
    console.log('Waiting for 3 seconds...');

    await waitFor(2 * 1000); // Waiting for Cron Job

    console.log('');
    console.log('######### | START of ROTATION #2 | #########');
    console.log('');

    /////////// #1 //////////////

    const keyPair_02 = await keyManager.getKeyPair();

    expect(keyPair_02.metadata.version).not.toBe(keyPair_01.metadata.version);
    expect(keyPair_02.publicKey.slice(50)).not.toBe(keyPair_01.publicKey.slice(50));
    expect(keyPair_02.secretKey.slice(50)).not.toBe(keyPair_01.secretKey.slice(50));

    expect(keyPair_02.metadata.version).toBe(2);

    const history_02 = await keyManager.historyService.getRotationHistory();

    expect(history_02).toBeDefined();
    expect(history_02.rotations).toHaveLength(2);
    expect(history_02.totalRotations).toBe(2);

    console.log('');
    console.log('######### | END of ROTATION #2 | #########');
    console.log('');
    console.log('Waiting for 2 seconds...');

    await waitFor(2 * 1000 + 100); // Waiting for Cron Job

    const keyPair_03 = await keyManager.getKeyPair();

    console.log('');
    console.log('######### | START of ROTATION #3 | #########');
    console.log('');

    /////////// #2 //////////////

    expect(keyPair_03.metadata.version).not.toBe(keyPair_02.metadata.version);
    expect(keyPair_03.publicKey.slice(50)).not.toBe(keyPair_02.publicKey.slice(50));
    expect(keyPair_03.secretKey.slice(50)).not.toBe(keyPair_02.secretKey.slice(50));

    expect(keyPair_03.metadata.version).toBe(3);

    const history_03 = await keyManager.historyService.getRotationHistory();

    expect(history_03).toBeDefined();
    expect(history_03.rotations).toHaveLength(3);
    expect(history_03.totalRotations).toBe(3);

    console.log('');
    console.log('######### | END of ROTATION #3 | #########');
    console.log('');

    // Add assertions to verify key rotation
  });
});
