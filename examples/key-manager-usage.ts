import { rm } from 'fs/promises';
import { Preset } from '../src/core/common/enums';
import { KeyManager } from '../src/core/key-management/key-manager';

async function main() {
  console.log('--- KeyManager Example ---');

  const certPath = './config/certs/keys';

  // Clean up previous run
  await rm(certPath, { recursive: true, force: true });

  const config = {
    preset: Preset.NORMAL,
    certPath: certPath,
    keyExpiryMonths: 1,
    autoGenerate: true,
    enableFileBackup: true,
    rotationGracePeriod: 15, // 1 minute
  };

  // 1. Get an instance of KeyManager
  const keyManager = KeyManager.getInstance(config);
  console.log('KeyManager instance created.');

  // 2. Initialize the key manager
  await keyManager.initialize();
  console.log('KeyManager initialized.');

  // 3. Access keys
  const publicKey = await keyManager.getPublicKeyBase64();
  console.log('Public Key (Base64):', publicKey.substring(0, 30) + '...');

  const secretKey = await keyManager.getSecretKeyBase64();
  console.log('Secret Key (Base64):', secretKey.substring(0, 30) + '...');

  // 4. Check health
  const health = await keyManager.healthCheck();
  console.log('Health Check:', health);

  // 5. Rotate keys manually
  console.log('Rotating keys...');
  await keyManager.rotateKeys();
  console.log('Keys rotated.');

  const newPublicKey = await keyManager.getPublicKeyBase64();
  console.log('New Public Key (Base64):', newPublicKey.substring(0, 30) + '...');

  console.log('--- Example End ---');
}

main().catch((error) => {
  console.error('An error occurred in the example:', error);
});
