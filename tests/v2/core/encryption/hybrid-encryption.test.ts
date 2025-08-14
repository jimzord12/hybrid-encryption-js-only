import { AES_GCM_STATS, ML_KEM_STATS } from '../../../../src/core/constants';
import {
  AsymmetricAlgorithm,
  HybridEncryption,
  SymmetricAlgorithm,
} from '../../../../src/core/encryption';
import { Preset } from '../../../../src/core/enums';
import { AlgorithmAsymmetricError } from '../../../../src/core/errors';
import { KeyPair } from '../../../../src/core/interfaces/common/index.interface';
import { bytesNumToBase64Length } from '../../../debug/calculations';
import { TestsingkeyPairs } from './test-data';

describe('Hybrid Encryption - V2', () => {
  describe('Structure', async () => {
    it('should have the correct properties', async () => {
      const hybridEncryption = new HybridEncryption();
      expect(hybridEncryption).toBeDefined();
      expect(hybridEncryption).toBeInstanceOf(HybridEncryption);
      expect(hybridEncryption.preset).toBe(Preset.DEFAULT);
      expect(hybridEncryption.asymmetricAlgorithm).toBeInstanceOf(AsymmetricAlgorithm);

      expect(hybridEncryption.symmetricAlgorithm).toBeInstanceOf(SymmetricAlgorithm);
    });

    it('should have the correct methods', async () => {
      const hybridEncryption = new HybridEncryption();
      const methods = Object.getOwnPropertyNames(HybridEncryption.prototype).filter(
        name =>
          name !== 'constructor' &&
          (typeof HybridEncryption.prototype[name] as string) === 'function',
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
      it('should THROW when invalid length for Public Key is provided + Correct Error', async () => {
        const keyPair: KeyPair = TestsingkeyPairs.get('pub-bad')!;
        const hybridEncryption = new HybridEncryption();

        const data = { message: 'Hello, World!' };

        try {
          expect(hybridEncryption.encrypt(data, keyPair.publicKey)).toThrowError(
            AlgorithmAsymmetricError,
          );
        } catch (error) {
          console.log((error as AlgorithmAsymmetricError).cause);
          expect((error as AlgorithmAsymmetricError).message).toBe(
            'Invalid ML-KEM-768 public key length',
          );
        }
      });
    });

    describe('Correct Flow', () => {
      it('should serialize data correctly', async () => {
        const hybridEncryption = new HybridEncryption();
        const data = { message: 'Hello, World!' };

        const serializedData = hybridEncryption.serializeData(data);
        const deserializedData = hybridEncryption.deserializeData<typeof data>(serializedData);

        expect(serializedData).toBeInstanceOf(Uint8Array);
        expect(deserializedData).toEqual(data);
      });

      it('should encode & decode Base64 correctly', async () => {
        const data = { message: 'Hello, World!' };
        const hyEnc = new HybridEncryption();
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
        const hybridEncryption = new HybridEncryption();
        const data = { message: 'Hello, World!' };
        const pubKey = TestsingkeyPairs.get('both-good')?.publicKey;

        if (!pubKey) {
          throw new Error('[Vitest]: Public key is not defined');
        }

        const binary = hybridEncryption.serializeData(data);

        const { preset, encryptedContent, cipherText, nonce } = hybridEncryption.encrypt(
          data,
          pubKey,
        );

        expect(preset).toBe(Preset.DEFAULT);

        expect(encryptedContent).toBeTypeOf('string');

        expect(cipherText).toBeTypeOf('string');
        expect(cipherText).toHaveLength(
          bytesNumToBase64Length(ML_KEM_STATS.ciphertextLength[preset]),
        );

        expect(nonce).toBeTypeOf('string');
        expect(nonce).toHaveLength(bytesNumToBase64Length(AES_GCM_STATS.nonceLength[preset]));
      });
    });
  });

  describe('Decryption', () => {
    describe('Errors', () => {
      it('should THROW when invalid length for Secret Key is provided + Correct Error', async () => {
        const keyPair: KeyPair = TestsingkeyPairs.get('secret-bad')!;
        const hybridEncryption = new HybridEncryption();

        const data = { message: 'Hello, World!' };

        const encryptedData = hybridEncryption.encrypt(data, keyPair.publicKey);

        try {
          expect(hybridEncryption.decrypt(encryptedData, keyPair.secretKey)).toThrow(
            AlgorithmAsymmetricError,
          );
        } catch (error) {
          console.log(error as AlgorithmAsymmetricError);
          expect((error as AlgorithmAsymmetricError).message).toBe(
            'Decryption failed: Invalid ML-KEM-768 secret key length',
          );
        }
      });
    });

    // describe('Correct Flow', () => {});
  });
});
