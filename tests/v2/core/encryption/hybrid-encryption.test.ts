import { randomBytes } from '@noble/hashes/utils';
import { ML_KEM_STATS } from '../../../../src/core/constants';
import {
  AsymmetricAlgorithm,
  HybridEncryption,
  SymmetricAlgorithm,
} from '../../../../src/core/encryption';
import { Preset } from '../../../../src/core/enums';
import { AlgorithmAsymmetricError } from '../../../../src/core/errors';
import { KeyPair } from '../../../../src/core/interfaces/common/index.interface';

const correctKeyPair: Map<string, KeyPair> = new Map([
  [
    'case-1',
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
]);
const badkeyPairs: Map<string, KeyPair> = new Map([
  [
    'case-1',
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
]);

describe('Hybrid Encryption - V2', () => {
  describe('Structure', async () => {
    it('should have the correct properties', async () => {
      const hybridEncryption = await HybridEncryption.createDefault();
      expect(hybridEncryption).toBeDefined();
      expect(hybridEncryption).toBeInstanceOf(HybridEncryption);
      expect(hybridEncryption.preset).toBe(Preset.DEFAULT);
      expect(hybridEncryption.asymmetricAlgorithm).toBeInstanceOf(AsymmetricAlgorithm);
      expect(hybridEncryption.symmetricAlgorithm).toBeInstanceOf(SymmetricAlgorithm);
    });

    it('should have the correct methods', async () => {
      const hybridEncryption = await HybridEncryption.createDefault();
      const methods = Object.getOwnPropertyNames(HybridEncryption.prototype).filter(
        name => name !== 'constructor' && typeof HybridEncryption.prototype[name] === 'function',
      );
      const properties = Object.keys(hybridEncryption);

      expect(hybridEncryption).toBeDefined();
      expect(hybridEncryption).toBeInstanceOf(HybridEncryption);

      expect(methods).toContain('encrypt');
      expect(methods).toContain('decrypt');
      expect(methods).toContain('decryptWithGracePeriod');
      expect(methods).toContain('serializeData');
      expect(methods).toContain('deserializeData');
      expect(methods).toContain('encodeBase64');
      expect(methods).toContain('decodeBase64');

      expect(properties).toContain('preset');
      expect(properties).toContain('asymmetricAlgorithm');
      expect(properties).toContain('symmetricAlgorithm');

      expect(Object.keys(hybridEncryption)).toContain('preset');
    });
  });

  describe('Encryption', () => {
    describe('Errors', () => {
      it('should THROW when invalid length for Public Key is provided', async () => {
        const keyPair: KeyPair = {
          preset: Preset.DEFAULT,
          publicKey: randomBytes(32),
          secretKey: randomBytes(32),
          metadata: {
            createdAt: new Date(),
            version: 1,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          },
        };
        const hybridEncryption = await HybridEncryption.createDefault();

        const data = { message: 'Hello, World!' };

        try {
          expect(hybridEncryption.encrypt(data, keyPair.publicKey)).toThrowError(
            AlgorithmAsymmetricError,
          );
        } catch (error) {
          console.log((error as AlgorithmAsymmetricError).cause);
        }
      });
    });

    describe('Correct Flow', () => {
      it('should serialize data correctly', async () => {
        const hybridEncryption = await HybridEncryption.createDefault();
        const data = { message: 'Hello, World!' };

        const serializedData = hybridEncryption.serializeData(data);
        const deserializedData = hybridEncryption.deserializeData<typeof data>(serializedData);

        expect(serializedData).toBeInstanceOf(Uint8Array);
        expect(deserializedData).toEqual(data);
      });

      it.only('should encode & decode Base64 correctly', async () => {
        const data = { message: 'Hello, World!' };
        const hyEnc = await HybridEncryption.createDefault();
        const binaryData = hyEnc.serializeData(data);

        const encoded = hyEnc.encodeBase64(binaryData);
        console.log('Encoded Base64:', encoded);
        const decoded = hyEnc.decodeBase64(encoded);
        console.log('Decoded Data:', decoded);

        expect(encoded).toBeTypeOf('string');
        expect(decoded).toEqual(binaryData);

        const deserialized = hyEnc.deserializeData(decoded);
        console.log('Deserialized Data:', deserialized);

        expect(deserialized).toEqual(data);
      });

      it('should encrypt correctly', async () => {
        const hybridEncryption = await HybridEncryption.createDefault();
        const data = { message: 'Hello, World!' };
        const pubKey = correctKeyPair.get('case-1')?.publicKey;

        if (!pubKey) {
          throw new Error('Public key is not defined');
        }

        expect(hybridEncryption.encrypt(data, pubKey)).toBeDefined();
      });
    });
  });
});
