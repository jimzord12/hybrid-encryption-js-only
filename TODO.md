# 🚀 Modernization Plan: Drop RSA, Embrace Modern Cryptography

## 📋 Project Overview

**Goal**: Transform the hybrid encryption library from RSA-dependent to a
modern, post-quantum ready system supporting pluggable asymmetric and symmetric
algorithms.

**Timeline**: 15-20 hours (2-3 weeks part-time) **Impact**: 50% reduction in
complexity, future-proof architecture, quantum-ready foundation

---

## 🎯 Phase 1: Foundation & Cleanup (4-6 hours)

### 1.1 Remove RSA Dependencies (2 hours)

**Objective**: Clean up all RSA-specific code and dependencies

**Tasks**:

- [ ] **Remove node-forge dependency**
  ```bash
  npm uninstall node-forge
  ```
- [ ] **Delete RSA-specific files**:
  - [ ] `src/core/providers/rsa-key-provider.ts`
  - [ ] `src/core/utils/generation.util.ts` (RSA key generation)
  - [ ] All RSA-related constants in `src/core/constants.ts`
- [ ] **Remove RSA types**:
  - [ ] `RSAKeyPair` interface from `encryption.types.ts`
  - [ ] `ForgePaddingType` and related types
  - [ ] `rsaPadding` options from `EncryptionOptions`

**Acceptance Criteria**:

- ✅ No node-forge imports remain
- ✅ No RSA-related TypeScript errors
- ✅ Bundle size reduced by ~30%

### 1.2 Design Modern Interfaces (2-3 hours)

**Objective**: Create clean, algorithm-agnostic interfaces

**Tasks**:

- [ ] **Create modern data format**:

  ```typescript
  // src/core/types/modern-encryption.types.ts
  interface ModernEncryptedData {
    algorithm: {
      asymmetric: string; // 'ML-KEM-768', 'ML-KEM-1024'
      symmetric: string; // 'AES-GCM-256', 'ChaCha20-Poly1305'
      kdf: string; // 'HKDF-SHA256', 'HKDF-SHA512'
    };
    encryptedContent: string; // Base64 encrypted data
    keyMaterial: string; // Base64 KEM ciphertext/key material
    nonce: string; // Base64 nonce/IV
    authTag?: string; // Base64 auth tag (for AEAD)
    metadata?: Record<string, any>;
    version: string; // '2.0.0'
  }
  ```

- [ ] **Create universal key pair interface**:

  ```typescript
  interface ModernKeyPair {
    algorithm: string; // Algorithm identifier
    publicKey: Uint8Array; // Always binary format
    privateKey: Uint8Array; // Always binary format
    metadata: {
      version: number;
      createdAt: Date;
      expiresAt?: Date;
      keySize?: number;
      curve?: string;
    };
  }
  ```

- [ ] **Create modern encryption options**:
  ```typescript
  interface ModernEncryptionOptions {
    asymmetricAlgorithm?: string; // Default: 'ML-KEM-768'
    symmetricAlgorithm?: string; // Default: 'AES-GCM-256'
    keyDerivation?: string; // Default: 'HKDF-SHA256'
    keySize?: number; // For symmetric algorithms
    associatedData?: Uint8Array; // For AEAD
  }
  ```

**Acceptance Criteria**:

- ✅ All interfaces use `Uint8Array` for keys
- ✅ Algorithm-agnostic design
- ✅ Extensible for future algorithms

### 1.3 Update Algorithm Registries (1 hour)

**Objective**: Ensure registries are ready for modern algorithms

**Tasks**:

- [ ] **Remove RSA algorithm registration** from registry constructors
- [ ] **Set ML-KEM-768 as default asymmetric** algorithm
- [ ] **Set AES-GCM-256 as default symmetric** algorithm
- [ ] **Add ChaCha20-Poly1305** implementation and registration
- [ ] **Verify symmetric registry** has proper AEAD algorithms

**Acceptance Criteria**:

- ✅ No RSA algorithms in registries
- ✅ Modern defaults configured
- ✅ Multiple modern algorithms available

---

## ⚡ Phase 2: Core Implementation (6-8 hours)

### 2.1 Create ModernHybridEncryption Class (3-4 hours)

**Objective**: Replace HybridEncryption with algorithm-agnostic version

**Tasks**:

- [ ] **Create new class structure**:

  ```typescript
  // src/core/encryption/modern-hybrid-encryption.ts
  export class ModernHybridEncryption {
    constructor(
      private asymmetricRegistry: AsymmetricRegistry,
      private symmetricRegistry: SymmetricRegistry,
      private defaultOptions: Required<ModernEncryptionOptions>,
    ) {}

    static encrypt(
      data: any,
      publicKey: Uint8Array,
      options?: ModernEncryptionOptions,
    ): ModernEncryptedData;
    static decrypt<T>(
      encryptedData: ModernEncryptedData,
      privateKey: Uint8Array,
      options?: ModernEncryptionOptions,
    ): T;
    static validateKeyPair(keyPair: ModernKeyPair): boolean;
  }
  ```

- [ ] **Implement KEM-based workflow**:

  ```typescript
  // Encryption workflow:
  // 1. Get algorithms from registries
  // 2. Serialize data → JSON → Uint8Array
  // 3. Generate KEM shared secret + key material
  // 4. Derive symmetric key using HKDF
  // 5. Encrypt data with AEAD algorithm
  // 6. Return ModernEncryptedData structure
  ```

- [ ] **Implement decryption workflow**:

  ```typescript
  // Decryption workflow:
  // 1. Parse algorithm identifiers
  // 2. Get algorithms from registries
  // 3. Recover shared secret from key material
  // 4. Derive symmetric key using HKDF
  // 5. Decrypt and verify with AEAD
  // 6. Parse JSON and return typed result
  ```

- [ ] **Add comprehensive error handling**:
  - Algorithm not found errors
  - Key material validation
  - Authentication failures
  - Invalid data format errors

**Acceptance Criteria**:

- ✅ Works with any registered asymmetric/symmetric algorithm
- ✅ Proper KEM workflow implementation
- ✅ Strong error handling and validation
- ✅ Type-safe interfaces

### 2.2 Key Derivation Implementation (1-2 hours)

**Objective**: Implement HKDF for deriving symmetric keys from shared secrets

**Tasks**:

- [ ] **Create key derivation utility**:

  ```typescript
  // src/core/utils/key-derivation.util.ts
  export class KeyDerivation {
    static deriveKey(
      sharedSecret: Uint8Array,
      keySize: number,
      salt: Uint8Array,
      info: Uint8Array,
      algorithm: 'HKDF-SHA256' | 'HKDF-SHA512' = 'HKDF-SHA256',
    ): Uint8Array;
  }
  ```

- [ ] **Implement HKDF using @noble/hashes**:

  ```typescript
  import { hkdf } from '@noble/hashes/hkdf';
  import { sha256 } from '@noble/hashes/sha256';
  ```

- [ ] **Add salt and info generation utilities**
- [ ] **Create comprehensive tests** for key derivation

**Acceptance Criteria**:

- ✅ HKDF implementation using @noble/hashes
- ✅ Configurable hash algorithms
- ✅ Proper salt and info handling
- ✅ Test coverage > 95%

### 2.3 Modern Data Serialization (1-2 hours)

**Objective**: Handle conversion between different data formats

**Tasks**:

- [ ] **Create serialization utilities**:

  ```typescript
  // src/core/utils/serialization.util.ts
  export class ModernSerialization {
    static serializeForEncryption(data: any): Uint8Array;
    static deserializeFromDecryption<T>(data: Uint8Array): T;
    static encodeBase64(data: Uint8Array): string;
    static decodeBase64(data: string): Uint8Array;
  }
  ```

- [ ] **Handle different input types**:
  - Objects → JSON → UTF-8 → Uint8Array
  - Strings → UTF-8 → Uint8Array
  - Uint8Array → pass through
  - Numbers, booleans → JSON conversion

- [ ] **Add validation and error handling**

**Acceptance Criteria**:

- ✅ Handles all JavaScript data types
- ✅ Consistent UTF-8 encoding
- ✅ Proper Base64 encoding/decoding
- ✅ Maintains data integrity

---

## 🔄 Phase 3: KeyManager Modernization (3-4 hours)

### 3.1 Update KeyManager Core (2 hours)

**Objective**: Make KeyManager work with modern key formats

**Tasks**:

- [ ] **Update key storage format**:

  ```typescript
  // Modern key files:
  // - public-key.bin (raw Uint8Array)
  // - private-key.bin (raw Uint8Array)
  // - key-metadata.json (algorithm info, dates, etc.)
  ```

- [ ] **Update KeyManager interface**:

  ```typescript
  interface ModernKeyManagerConfig {
    algorithm?: string; // 'ML-KEM-768', 'ML-KEM-1024'
    certPath?: string;
    autoGenerate?: boolean;
    keyExpiryMonths?: number;
    enableFileBackup?: boolean;
    rotationGracePeriod?: number;
  }
  ```

- [ ] **Modify key generation**:
  ```typescript
  // Use algorithm registry instead of hard-coded RSA
  private async generateKeys(): Promise<ModernKeyPair> {
    const algorithm = this.asymmetricRegistry.get(this.config.algorithm);
    const rawKeyPair = algorithm.generateKeyPair();
    return {
      algorithm: this.config.algorithm,
      publicKey: rawKeyPair.publicKey,
      privateKey: rawKeyPair.privateKey,
      metadata: {
        version: this.getNextVersion(),
        createdAt: new Date(),
        expiresAt: this.calculateExpiryDate(),
      }
    };
  }
  ```

**Acceptance Criteria**:

- ✅ Stores keys in binary format
- ✅ Algorithm-agnostic key generation
- ✅ Maintains existing KeyManager features
- ✅ Proper file permissions (0o600 for private keys)

### 3.2 File Format Migration (1-2 hours)

**Objective**: Handle transition from PEM to binary key storage

**Tasks**:

- [ ] **Create migration utility**:

  ```typescript
  // src/core/utils/key-migration.util.ts
  export class KeyMigration {
    static detectKeyFormat(certPath: string): 'legacy-rsa' | 'modern' | 'none';
    static migrateLegacyKeys(certPath: string): Promise<void>;
    static backupLegacyKeys(certPath: string): Promise<void>;
  }
  ```

- [ ] **Update KeyManager.initialize()**:

  ```typescript
  async initialize(): Promise<void> {
    const format = KeyMigration.detectKeyFormat(this.config.certPath);

    if (format === 'legacy-rsa') {
      console.warn('🔄 Legacy RSA keys detected - migration required');
      await KeyMigration.backupLegacyKeys(this.config.certPath);
      // Generate new modern keys
      await this.generateKeys();
    } else if (format === 'modern') {
      await this.loadKeysFromFile();
    } else {
      // No keys exist
      if (this.config.autoGenerate) {
        await this.generateKeys();
      }
    }
  }
  ```

**Acceptance Criteria**:

- ✅ Detects and handles legacy RSA keys
- ✅ Safe migration with backup
- ✅ Seamless transition for users

---

## 🔧 Phase 4: API & Integration (2-3 hours)

### 4.1 Update Client API (1 hour)

**Objective**: Provide clean, modern client interfaces

**Tasks**:

- [ ] **Update client exports**:

  ```typescript
  // src/client/index.ts
  export const encrypt = (
    data: any,
    publicKey: Uint8Array,
    options?: ModernEncryptionOptions,
  ): ModernEncryptedData => {
    return ModernHybridEncryption.encrypt(data, publicKey, options);
  };

  export const decrypt = <T = any>(
    encryptedData: ModernEncryptedData,
    privateKey: Uint8Array,
    options?: ModernEncryptionOptions,
  ): T => {
    return ModernHybridEncryption.decrypt<T>(
      encryptedData,
      privateKey,
      options,
    );
  };

  export const generateKeyPair = (
    algorithm: string = 'ML-KEM-768',
  ): ModernKeyPair => {
    const registry = getAsymmetricRegistry();
    const alg = registry.get(algorithm);
    const rawKeys = alg.generateKeyPair();

    return {
      algorithm,
      publicKey: rawKeys.publicKey,
      privateKey: rawKeys.privateKey,
      metadata: {
        version: 1,
        createdAt: new Date(),
        keySize: rawKeys.publicKey.length * 8, // Convert to bits
      },
    };
  };
  ```

- [ ] **Add convenience functions**:

  ```typescript
  export const getSupportedAlgorithms = () => ({
    asymmetric: getAsymmetricRegistry().list(),
    symmetric: getSymmetricRegistry().list(),
  });

  export const validateKeyPair = (keyPair: ModernKeyPair): boolean => {
    return ModernHybridEncryption.validateKeyPair(keyPair);
  };
  ```

**Acceptance Criteria**:

- ✅ Clean, consistent API
- ✅ Proper TypeScript types
- ✅ Algorithm discovery functions
- ✅ Backward compatible patterns (where possible)

### 4.2 Factory Pattern Implementation (1-2 hours)

**Objective**: Provide easy configuration and setup

**Tasks**:

- [ ] **Create HybridEncryptionFactory**:

  ```typescript
  // src/core/encryption/factory.ts
  export class HybridEncryptionFactory {
    static create(config?: {
      asymmetricAlgorithm?: string;
      symmetricAlgorithm?: string;
      keyDerivation?: string;
    }): ModernHybridEncryption;

    static createWithKeyManager(
      keyManagerConfig?: ModernKeyManagerConfig,
    ): Promise<{
      encryption: ModernHybridEncryption;
      keyManager: KeyManager;
    }>;
  }
  ```

- [ ] **Create configuration presets**:
  ```typescript
  export const EncryptionPresets = {
    QUANTUM_SAFE: {
      asymmetricAlgorithm: 'ML-KEM-768',
      symmetricAlgorithm: 'AES-GCM-256',
      keyDerivation: 'HKDF-SHA256',
    },
    HIGH_SECURITY: {
      asymmetricAlgorithm: 'ML-KEM-1024',
      symmetricAlgorithm: 'ChaCha20-Poly1305',
      keyDerivation: 'HKDF-SHA512',
    },
  };
  ```

**Acceptance Criteria**:

- ✅ Easy setup for common use cases
- ✅ Sensible defaults
- ✅ Configuration validation

---

## 🧪 Phase 5: Testing & Validation (3-4 hours)

### 5.1 Update Existing Tests (2 hours)

**Objective**: Migrate tests from RSA to modern algorithms

**Tasks**:

- [ ] **Update HybridEncryption tests**:
  - Replace RSA key generation with ML-KEM
  - Update test data structures
  - Fix assertion for new data format

- [ ] **Update KeyManager tests**:
  - Use binary key format
  - Test modern algorithm support
  - Verify migration functionality

- [ ] **Update integration tests**:
  - End-to-end encryption/decryption
  - Key rotation scenarios
  - Multiple algorithm combinations

**Acceptance Criteria**:

- ✅ All existing test scenarios pass
- ✅ Tests use modern algorithms only
- ✅ Test coverage maintained > 90%

### 5.2 Create Modern Algorithm Tests (1-2 hours)

**Objective**: Comprehensive testing of new functionality

**Tasks**:

- [ ] **Algorithm interoperability tests**:

  ```typescript
  describe('Modern Algorithm Combinations', () => {
    it('should work with ML-KEM-768 + AES-GCM-256', () => {});
    it('should work with ML-KEM-1024 + ChaCha20-Poly1305', () => {});
    it('should handle algorithm switching', () => {});
  });
  ```

- [ ] **Performance tests**:

  ```typescript
  describe('Performance Benchmarks', () => {
    it('should encrypt/decrypt within reasonable time', () => {});
    it('should handle large data efficiently', () => {});
    it('should perform better than RSA baseline', () => {});
  });
  ```

- [ ] **Security tests**:
  ```typescript
  describe('Security Properties', () => {
    it('should generate different keys each time', () => {});
    it('should detect tampering', () => {});
    it('should have proper entropy', () => {});
  });
  ```

**Acceptance Criteria**:

- ✅ Comprehensive test coverage
- ✅ Performance benchmarks
- ✅ Security property validation

---

## 📚 Phase 6: Documentation & Polish (1-2 hours)

### 6.1 Update Documentation (1 hour)

**Objective**: Clear documentation for modern API

**Tasks**:

- [ ] **Update README.md**:
  - Remove RSA references
  - Add modern examples
  - Update installation instructions
  - Add migration guide

- [ ] **Update API documentation**:
  - Document all new interfaces
  - Provide usage examples
  - Add troubleshooting guide

- [ ] **Create migration guide**:

  ```markdown
  # Migration Guide: v1 (RSA) → v2 (Modern)

  ## Breaking Changes

  - RSA support removed
  - Key format changed from PEM to binary
  - New data structure for encrypted data

  ## Migration Steps

  1. Backup existing keys
  2. Update client code to use Uint8Array keys
  3. Regenerate keys with modern algorithms
  ```

**Acceptance Criteria**:

- ✅ Complete API documentation
- ✅ Clear migration instructions
- ✅ Working examples

### 6.2 Performance Optimization (Optional, 1 hour)

**Objective**: Optimize for production use

**Tasks**:

- [ ] **Bundle size optimization**:
  - Tree-shake unused algorithms
  - Minimize dependencies
  - Optimize imports

- [ ] **Runtime optimization**:
  - Cache algorithm instances
  - Optimize key derivation
  - Reduce memory allocations

**Acceptance Criteria**:

- ✅ Bundle size < 100KB
- ✅ Encryption time < 10ms for small data
- ✅ Memory usage optimized

---

## ✅ Success Criteria & Acceptance

### 📊 Technical Metrics

- [ ] **No RSA dependencies** remain in codebase
- [ ] **All tests pass** with modern algorithms
- [ ] **Bundle size reduced** by 30-50%
- [ ] **Performance improved** vs RSA baseline
- [ ] **TypeScript strict mode** compliance
- [ ] **ESLint/Prettier** compliance

### 🛡️ Security Requirements

- [ ] **Post-quantum security** with ML-KEM
- [ ] **AEAD encryption** for all symmetric operations
- [ ] **Proper key derivation** using HKDF
- [ ] **Side-channel resistance** considerations
- [ ] **Cryptographic randomness** for all operations

### 🔄 Migration Support

- [ ] **Legacy key detection** working
- [ ] **Safe migration path** implemented
- [ ] **Backup mechanisms** for old keys
- [ ] **Clear error messages** for migration issues

### 📖 Documentation Quality

- [ ] **Complete API reference** available
- [ ] **Working examples** for all use cases
- [ ] **Migration guide** covers all scenarios
- [ ] **Performance benchmarks** documented

---

## 🚀 Release Strategy

### Version 2.0.0 Release Plan

**Pre-release**:

1. **Alpha** (Internal testing, core functionality)
2. **Beta** (Community testing, migration tools)
3. **RC** (Final testing, documentation polish)

**Release**:

1. **v2.0.0** - Modern algorithms only
2. **v2.1.0** - Additional algorithm support
3. **v2.2.0** - Performance optimizations

**Post-release**:

1. **Migration support** for 6 months
2. **v1.x security patches** for 12 months
3. **Community feedback** integration

---

## 🎯 Summary

This comprehensive plan transforms the library from RSA-dependent legacy code to
a modern, post-quantum ready hybrid encryption system. The approach prioritizes:

1. **Clean Architecture** - Algorithm-agnostic design
2. **Security First** - Post-quantum and modern crypto standards
3. **Developer Experience** - Simple APIs and clear documentation
4. **Future-Proof** - Easy extension for new algorithms
5. **Migration Support** - Safe transition path for existing users

**Expected Outcome**: A production-ready, modern hybrid encryption library
that's 50% smaller, faster, and quantum-safe. 🛡️✨
