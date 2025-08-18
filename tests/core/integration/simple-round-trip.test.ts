import { ClientEncryption } from '../../../src/client';
import { Preset } from '../../../src/common/types';
import { ServerDecryptionAllPublic } from '../../../src/server/decrypt-all-public';

describe('Simple Round Trip Encryption', () => {
  let cencrypt: ClientEncryption;
  let cencrypt_HS: ClientEncryption;

  let sdecrypt: ServerDecryptionAllPublic;
  let sdecrypt_HS: ServerDecryptionAllPublic;

  beforeEach(() => {
    cencrypt = ClientEncryption.getInstance();
    cencrypt_HS = ClientEncryption.getInstance(Preset.HIGH_SECURITY);

    sdecrypt = ServerDecryptionAllPublic.getInstance();
    sdecrypt_HS = ServerDecryptionAllPublic.getInstance(Preset.HIGH_SECURITY);
  });

  afterEach(() => {
    // Clean up singleton instances to prevent test interference
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();
  });

  it('should encrypt and decrypt data correctly (NORMAL)', async () => {
    const cases: {
      description: string;
      data: object | string;
    }[] = [
      { description: 'Plain text', data: 'Hello, World!' },
      { description: 'JSON object', data: JSON.stringify({ hello: 'world' }) },
      { description: 'Object', data: { hello: 'world', foo: { boo: 'soo' } } },
    ];

    const pk = await sdecrypt.getPublicKeyBase64();

    if (pk == null)
      throw new Error('Public key is null - should encrypt and decrypt data correctly (NORMAL)');

    for (const c of cases) {
      const encrypted = cencrypt.encryptData(c.data, pk);
      const decrypted = await sdecrypt.decryptData(encrypted);

      if (typeof c.data === 'object') {
        expect(decrypted).toStrictEqual(c.data);
      } else {
        expect(decrypted).toBe(c.data);
      }
    }
  });

  it('should encrypt and decrypt data correctly (HIGH_SECURITY)', async () => {
    const cases: {
      description: string;
      data: object | string;
    }[] = [
      { description: 'Plain text', data: 'Hello, World!' },
      { description: 'JSON object', data: JSON.stringify({ hello: 'world' }) },
      { description: 'Object', data: { hello: 'world', foo: { boo: 'soo' } } },
    ];

    const pk = await sdecrypt_HS.getPublicKeyBase64();

    if (pk == null)
      throw new Error(
        'Public key is null - should encrypt and decrypt data correctly (HIGH_SECURITY)',
      );

    for (const c of cases) {
      const encrypted = cencrypt_HS.encryptData(c.data, pk);
      const decrypted = await sdecrypt_HS.decryptData(encrypted);

      if (typeof c.data === 'object') {
        expect(decrypted).toStrictEqual(c.data);
      } else {
        expect(decrypted).toBe(c.data);
      }
    }
  });
});
