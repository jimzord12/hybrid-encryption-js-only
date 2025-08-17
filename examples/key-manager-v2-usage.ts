import { KeyManagerV2 } from '../src/v2/core/key-management/key-manager.v2';
import { Preset } from '../src/core/common/enums';
import { rm } from 'fs/promises';

async function main() {
  console.log('--- KeyManagerV2 Example ---');

  const certPath = './example-certs-v2';

  // Clean up previous run
  await rm(certPath, { recursive: true, force: true });

  const config = {
    preset: Preset.NORMAL,
    certPath: certPath,
    keyExpiryMonths: 1,
    autoGenerate: true,
    enableFileBackup: true,
    rotationGracePeriod: 1, // 1 minute
  };

  // 1. Get an instance of KeyManagerV2
  const keyManager = KeyManagerV2.getInstance(config);
  console.log('KeyManagerV2 instance created.');

  // 2. Initialize the key manager
  await keyManager.initialize();
  console.log('KeyManagerV2 initialized.');

  // 3. Access keys
  const publicKey = await keyManager.getPublicKeyBase64();
  console.log('Public Key (Base64):', publicKey.substring(0, 30) + '...');

  const privateKey = await keyManager.getPrivateKeyBase64();
  console.log('Private Key (Base64):', privateKey.substring(0, 30) + '...');

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

main().catch(error => {
    console.error('An error occurred in the example:', error);
});
