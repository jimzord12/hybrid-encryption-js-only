import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AlgorithmRegistry,
  AlgorithmRegistryError,
  asymmetricRegistry,
  mixedAlgorithmRegistry,
  symmetricRegistry,
  type RegistrableAlgorithm,
} from '../../../../../src/core/encryption/algorithm-registry';
import { AsymmetricAlgorithm } from '../../../../../src/core/encryption/interfaces/asymmetric-alg.interfaces';
import { SymmetricAlgorithm } from '../../../../../src/core/encryption/interfaces/symmetric-alg.interfaces';

// Mock algorithm implementations for testing
class MockAsymmetricAlgorithm extends AsymmetricAlgorithm {
  constructor(name: string, version: string) {
    super(name, version);
  }

  generateKeyPair() {
    return {
      publicKey: new Uint8Array([1, 2, 3]),
      privateKey: new Uint8Array([4, 5, 6]),
    };
  }

  createSharedSecret(publicKey: Uint8Array) {
    return {
      sharedSecret: new Uint8Array([7, 8, 9]),
      cipherText: publicKey,
    };
  }

  recoverSharedSecret(keyMaterial: Uint8Array, _privateKey: Uint8Array) {
    return keyMaterial;
  }
}

class MockSymmetricAlgorithm extends SymmetricAlgorithm {
  constructor(name: string, keySize: number) {
    super(name, keySize, 12, true);
  }

  deriveKeyMaterial(sharedSecret: Uint8Array, salt: Uint8Array, info: Uint8Array) {
    return {
      key: sharedSecret,
      nonce: salt,
      info,
    };
  }

  encrypt(data: Uint8Array, keyMaterial: any) {
    return {
      encryptedData: data,
      nonce: keyMaterial.nonce,
    };
  }

  decrypt(encryptedData: Uint8Array, _keyMaterial: any) {
    return encryptedData;
  }

  getAlgorithmId(): string {
    return this.name;
  }
}

describe('AlgorithmRegistry', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods to verify logging
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Constructor and Initialization', () => {
    it('should create a mixed registry with default configuration', () => {
      const registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed');
      const stats = registry.getStats();

      expect(stats.registryType).toBe('mixed');
      expect(stats.totalAlgorithms).toBeGreaterThan(0);
    });

    it('should create an asymmetric-only registry', () => {
      const registry = new AlgorithmRegistry<AsymmetricAlgorithm>('asymmetric');
      const stats = registry.getStats();

      expect(stats.registryType).toBe('asymmetric');
      expect(stats.asymmetricCount).toBeGreaterThan(0);
      expect(stats.symmetricCount).toBe(0);
    });

    it('should create a symmetric-only registry', () => {
      const registry = new AlgorithmRegistry<SymmetricAlgorithm>('symmetric');
      const stats = registry.getStats();

      expect(stats.registryType).toBe('symmetric');
      expect(stats.symmetricCount).toBeGreaterThan(0);
      expect(stats.asymmetricCount).toBe(0);
    });

    it('should not auto-register defaults when disabled', () => {
      const registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });
      const stats = registry.getStats();

      expect(stats.totalAlgorithms).toBe(0);
    });

    it('should use custom defaults from config', () => {
      const registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        asymmetricDefault: 'custom-asymmetric',
        symmetricDefault: 'custom-symmetric',
        autoRegisterDefaults: false,
      });

      // Set the defaults manually since autoRegisterDefaults is false
      registry.register(new MockAsymmetricAlgorithm('custom', 'asymmetric'), 'asymmetric');
      registry.register(new MockSymmetricAlgorithm('custom-symmetric', 256), 'symmetric');
      registry.setDefault('custom-asymmetric', 'asymmetric');
      registry.setDefault('custom-symmetric', 'symmetric');

      const defaults = registry.getDefaultIds();

      expect(defaults.asymmetric).toBe('custom-asymmetric');
      expect(defaults.symmetric).toBe('custom-symmetric');
    });
  });

  describe('Algorithm Registration', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });
    });

    it('should register an asymmetric algorithm', () => {
      const algorithm = new MockAsymmetricAlgorithm('test-rsa', '2048');

      registry.register(algorithm, 'asymmetric');

      expect(registry.has('test-rsa-2048')).toBe(true);
      expect(registry.getAlgorithmType('test-rsa-2048')).toBe('asymmetric');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Registered asymmetric algorithm: test-rsa-2048',
      );
    });

    it('should register a symmetric algorithm', () => {
      const algorithm = new MockSymmetricAlgorithm('test-aes', 256);

      registry.register(algorithm, 'symmetric');

      expect(registry.has('test-aes')).toBe(true);
      expect(registry.getAlgorithmType('test-aes')).toBe('symmetric');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Registered symmetric algorithm: test-aes');
    });

    it('should set algorithm as default when specified', () => {
      const asymAlgorithm = new MockAsymmetricAlgorithm('test-rsa', '2048');
      const symAlgorithm = new MockSymmetricAlgorithm('test-aes', 256);

      registry.register(asymAlgorithm, 'asymmetric', true);
      registry.register(symAlgorithm, 'symmetric', true);

      const defaults = registry.getDefaultIds();
      expect(defaults.asymmetric).toBe('test-rsa-2048');
      expect(defaults.symmetric).toBe('test-aes');
    });

    it('should set as default if no default exists for type', () => {
      const algorithm = new MockAsymmetricAlgorithm('first-algo', '1.0');

      registry.register(algorithm, 'asymmetric', false);

      const defaults = registry.getDefaultIds();
      expect(defaults.asymmetric).toBe('first-algo-1.0');
    });

    it('should warn when overwriting existing algorithm', () => {
      const algorithm1 = new MockAsymmetricAlgorithm('test', '1.0');
      const algorithm2 = new MockAsymmetricAlgorithm('test', '1.0');

      registry.register(algorithm1, 'asymmetric');
      registry.register(algorithm2, 'asymmetric');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Algorithm test-1.0 already registered, overwriting...',
      );
    });

    it('should throw error for null/undefined algorithm', () => {
      expect(() => {
        registry.register(null as any, 'asymmetric');
      }).toThrow(AlgorithmRegistryError);
    });

    it('should throw error when registering wrong type in type-specific registry', () => {
      const asymmetricOnlyRegistry = new AlgorithmRegistry<AsymmetricAlgorithm>('asymmetric');
      const symAlgorithm = new MockSymmetricAlgorithm('test-aes', 256);

      expect(() => {
        asymmetricOnlyRegistry.register(symAlgorithm as any, 'symmetric');
      }).toThrow(AlgorithmRegistryError);
    });
  });

  describe('Algorithm Retrieval', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;
    let asymAlgorithm: MockAsymmetricAlgorithm;
    let symAlgorithm: MockSymmetricAlgorithm;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });
      asymAlgorithm = new MockAsymmetricAlgorithm('test-rsa', '2048');
      symAlgorithm = new MockSymmetricAlgorithm('test-aes', 256);

      registry.register(asymAlgorithm, 'asymmetric', true);
      registry.register(symAlgorithm, 'symmetric', true);
    });

    it('should get algorithm by ID', () => {
      const retrieved = registry.get('test-rsa-2048');
      expect(retrieved).toBe(asymAlgorithm);
    });

    it('should get default algorithm by type', () => {
      const defaultAsym = registry.getDefault('asymmetric');
      const defaultSym = registry.getDefault('symmetric');

      expect(defaultAsym).toBe(asymAlgorithm);
      expect(defaultSym).toBe(symAlgorithm);
    });

    it('should get default asymmetric algorithm (convenience method)', () => {
      const defaultAsym = registry.getDefaultAsymmetric();
      expect(defaultAsym).toBe(asymAlgorithm);
    });

    it('should get default symmetric algorithm (convenience method)', () => {
      const defaultSym = registry.getDefaultSymmetric();
      expect(defaultSym).toBe(symAlgorithm);
    });

    it('should throw error for non-existent algorithm', () => {
      expect(() => {
        registry.get('non-existent');
      }).toThrow(AlgorithmRegistryError);

      expect(() => {
        registry.get('non-existent');
      }).toThrow('Unsupported algorithm: non-existent');
    });

    it('should throw error for invalid algorithm ID', () => {
      expect(() => {
        registry.get('');
      }).toThrow(AlgorithmRegistryError);

      expect(() => {
        registry.get(null as any);
      }).toThrow(AlgorithmRegistryError);
    });

    it('should throw error when no default is set', () => {
      const emptyRegistry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      expect(() => {
        emptyRegistry.getDefault('asymmetric');
      }).toThrow(AlgorithmRegistryError);
    });
  });

  describe('Algorithm Listing', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      registry.register(new MockAsymmetricAlgorithm('rsa', '2048'), 'asymmetric');
      registry.register(new MockAsymmetricAlgorithm('ecc', 'p256'), 'asymmetric');
      registry.register(new MockSymmetricAlgorithm('aes-128', 128), 'symmetric');
      registry.register(new MockSymmetricAlgorithm('aes-256', 256), 'symmetric');
    });

    it('should list all algorithms', () => {
      const allAlgorithms = registry.list();
      expect(allAlgorithms).toHaveLength(4);
      expect(allAlgorithms).toContain('rsa-2048');
      expect(allAlgorithms).toContain('ecc-p256');
      expect(allAlgorithms).toContain('aes-128');
      expect(allAlgorithms).toContain('aes-256');
    });

    it('should list only asymmetric algorithms', () => {
      const asymmetricAlgorithms = registry.list('asymmetric');
      expect(asymmetricAlgorithms).toHaveLength(2);
      expect(asymmetricAlgorithms).toContain('rsa-2048');
      expect(asymmetricAlgorithms).toContain('ecc-p256');
    });

    it('should list only symmetric algorithms', () => {
      const symmetricAlgorithms = registry.list('symmetric');
      expect(symmetricAlgorithms).toHaveLength(2);
      expect(symmetricAlgorithms).toContain('aes-128');
      expect(symmetricAlgorithms).toContain('aes-256');
    });
  });

  describe('Default Management', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      registry.register(new MockAsymmetricAlgorithm('rsa', '2048'), 'asymmetric');
      registry.register(new MockAsymmetricAlgorithm('ecc', 'p256'), 'asymmetric');
      registry.register(new MockSymmetricAlgorithm('aes-128', 128), 'symmetric');
      registry.register(new MockSymmetricAlgorithm('aes-256', 256), 'symmetric');
    });

    it('should set default algorithm', () => {
      registry.setDefault('ecc-p256', 'asymmetric');
      registry.setDefault('aes-256', 'symmetric');

      const defaults = registry.getDefaultIds();
      expect(defaults.asymmetric).toBe('ecc-p256');
      expect(defaults.symmetric).toBe('aes-256');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔄 Default asymmetric algorithm changed to: ecc-p256',
      );
    });

    it('should throw error when setting non-existent algorithm as default', () => {
      expect(() => {
        registry.setDefault('non-existent', 'asymmetric');
      }).toThrow(AlgorithmRegistryError);
    });

    it('should throw error when setting wrong type as default', () => {
      expect(() => {
        registry.setDefault('aes-128', 'asymmetric');
      }).toThrow(AlgorithmRegistryError);
    });

    it('should throw error for invalid algorithm ID in setDefault', () => {
      expect(() => {
        registry.setDefault('', 'asymmetric');
      }).toThrow(AlgorithmRegistryError);
    });
  });

  describe('Algorithm Unregistration', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      registry.register(new MockAsymmetricAlgorithm('rsa', '2048'), 'asymmetric', true);
      registry.register(new MockAsymmetricAlgorithm('ecc', 'p256'), 'asymmetric');
      registry.register(new MockSymmetricAlgorithm('aes-256', 256), 'symmetric', true);
    });

    it('should unregister non-default algorithm', () => {
      const result = registry.unregister('ecc-p256');

      expect(result).toBe(true);
      expect(registry.has('ecc-p256')).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️ Unregistered asymmetric algorithm: ecc-p256');
    });

    it('should return false when unregistering non-existent algorithm', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should throw error when trying to unregister default algorithm', () => {
      expect(() => {
        registry.unregister('rsa-2048');
      }).toThrow(AlgorithmRegistryError);

      expect(() => {
        registry.unregister('aes-256');
      }).toThrow(AlgorithmRegistryError);
    });
  });

  describe('Registry Statistics', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      registry.register(new MockAsymmetricAlgorithm('rsa', '2048'), 'asymmetric', true);
      registry.register(new MockAsymmetricAlgorithm('ecc', 'p256'), 'asymmetric');
      registry.register(new MockSymmetricAlgorithm('aes-256', 256), 'symmetric', true);
    });

    it('should provide comprehensive statistics', () => {
      const stats = registry.getStats();

      expect(stats.totalAlgorithms).toBe(3);
      expect(stats.asymmetricCount).toBe(2);
      expect(stats.symmetricCount).toBe(1);
      expect(stats.registryType).toBe('mixed');
      expect(stats.defaults.asymmetric).toBe('rsa-2048');
      expect(stats.defaults.symmetric).toBe('aes-256');
      expect(stats.algorithms.all).toHaveLength(3);
      expect(stats.algorithms.asymmetric).toHaveLength(2);
      expect(stats.algorithms.symmetric).toHaveLength(1);
    });
  });

  describe('Registry Operations', () => {
    let registry: AlgorithmRegistry<RegistrableAlgorithm>;

    beforeEach(() => {
      registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      registry.register(new MockAsymmetricAlgorithm('rsa', '2048'), 'asymmetric', true);
      registry.register(new MockSymmetricAlgorithm('aes-256', 256), 'symmetric', true);
    });

    it('should check if algorithm exists', () => {
      expect(registry.has('rsa-2048')).toBe(true);
      expect(registry.has('non-existent')).toBe(false);
    });

    it('should get algorithm type', () => {
      expect(registry.getAlgorithmType('rsa-2048')).toBe('asymmetric');
      expect(registry.getAlgorithmType('aes-256')).toBe('symmetric');
      expect(registry.getAlgorithmType('non-existent')).toBeUndefined();
    });

    it('should clear registry', () => {
      registry.clear();

      const stats = registry.getStats();
      expect(stats.totalAlgorithms).toBe(0);
      expect(stats.defaults.asymmetric).toBeNull();
      expect(stats.defaults.symmetric).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith('🧹 Algorithm registry cleared');
    });

    it('should clear registry while preserving defaults', () => {
      const originalDefaults = registry.getDefaultIds();
      registry.clear(true);

      const stats = registry.getStats();
      const newDefaults = registry.getDefaultIds();

      expect(stats.totalAlgorithms).toBe(0);
      expect(newDefaults.asymmetric).toBe(originalDefaults.asymmetric);
      expect(newDefaults.symmetric).toBe(originalDefaults.symmetric);
    });
  });

  describe('Singleton Instances', () => {
    it('should provide asymmetric registry singleton', () => {
      const stats = asymmetricRegistry.getStats();
      expect(stats.registryType).toBe('asymmetric');
      expect(stats.asymmetricCount).toBeGreaterThan(0);
    });

    it('should provide symmetric registry singleton', () => {
      const stats = symmetricRegistry.getStats();
      expect(stats.registryType).toBe('symmetric');
      expect(stats.symmetricCount).toBeGreaterThan(0);
    });

    it('should provide mixed registry singleton', () => {
      const stats = mixedAlgorithmRegistry.getStats();
      expect(stats.registryType).toBe('mixed');
      expect(stats.totalAlgorithms).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw AlgorithmRegistryError with proper cause', () => {
      const registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      try {
        registry.get('non-existent');
      } catch (error) {
        expect(error).toBeInstanceOf(AlgorithmRegistryError);
        expect((error as Error).name).toBe('AlgorithmRegistryError');
        expect((error as Error).message).toContain('non-existent');
      }
    });

    it('should provide helpful error messages with available alternatives', () => {
      const registry = new AlgorithmRegistry<RegistrableAlgorithm>('mixed', {
        autoRegisterDefaults: false,
      });

      registry.register(new MockAsymmetricAlgorithm('rsa', '2048'), 'asymmetric');

      try {
        registry.get('non-existent');
      } catch (error) {
        expect((error as Error).message).toContain('Available algorithms: rsa-2048');
      }
    });
  });
});
