# Strategy Pattern Implementation for KeyManager

## Overview

The KeyManager has been successfully refactored to use the **Strategy Pattern**, making it algorithm-agnostic and easily extensible for different cryptographic schemes like RSA, ECC, Ed25519, etc.

## Architecture

### Before (Tightly Coupled)

```typescript
// Old - Directly coupled to RSA and HybridEncryption
class KeyManager {
  currentKeys: RSAKeyPair | null = null;

  needsRotation() {
    return HybridEncryption.isKeyPairExpired(this.currentKeys); // ❌ Direct dependency
  }

  generateKeys() {
    return generateRSAKeyPair(this.config.keySize); // ❌ Algorithm-specific
  }
}
```

### After (Strategy Pattern)

```typescript
// New - Algorithm-agnostic with provider strategy
class KeyManager {
  currentKeys: CryptoKeyPair | null = null;
  private keyProvider: KeyProvider; // ✅ Strategy interface

  needsRotation() {
    return this.keyProvider.isKeyPairExpired(this.currentKeys); // ✅ Delegated to provider
  }

  generateKeys() {
    return this.keyProvider.generateKeyPair(config); // ✅ Algorithm-independent
  }
}
```

## Key Components

### 1. Generic Interfaces

- **`CryptoKeyPair`**: Algorithm-agnostic key pair interface
- **`KeyProvider`**: Strategy interface for cryptographic operations
- **`KeyGenerationConfig`**: Flexible configuration for any algorithm

### 2. Strategy Implementation

- **`RSAKeyProvider`**: Maintains backward compatibility with existing RSA implementation
- **`KeyProviderFactory`**: Creates appropriate providers based on algorithm

### 3. Algorithm Support

- **Current**: RSA (2048-4096 bit keys)
- **Future-ready**: ECC (P-256, P-384, P-521), Ed25519, etc.

## Usage Examples

### Current Usage (RSA - No Changes Required)

```typescript
// Existing code continues to work unchanged
const manager = KeyManager.getInstance({
  certPath: './certs',
  keySize: 2048,
  keyExpiryMonths: 6,
});

await manager.initialize();
const publicKey = await manager.getPublicKey();
```

### New Algorithm Support (Future)

```typescript
// ECC support (when implemented)
const manager = KeyManager.getInstance({
  algorithm: 'ecc',
  curve: 'P-256',
  certPath: './certs',
  keyExpiryMonths: 6,
});

// Ed25519 support (when implemented)
const manager = KeyManager.getInstance({
  algorithm: 'ed25519',
  certPath: './certs',
  keyExpiryMonths: 6,
});
```

## Benefits

### 1. **Decoupling**

- KeyManager no longer depends on HybridEncryption class
- Algorithm-specific logic isolated in providers
- Clean separation of concerns

### 2. **Extensibility**

- Easy to add new cryptographic algorithms
- No changes required to core KeyManager logic
- Plugin-like architecture for key providers

### 3. **Testability**

- Each provider can be tested independently
- Easy to mock providers for unit testing
- Better isolation of test scenarios

### 4. **Backward Compatibility**

- Existing RSA implementation continues to work
- No breaking changes to public APIs
- Smooth migration path

## Adding New Algorithms

To add a new algorithm (e.g., ECC), you would:

### 1. Create Provider Implementation

```typescript
export class ECCKeyProvider implements KeyProvider {
  getAlgorithm(): 'ecc' {
    return 'ecc';
  }

  generateKeyPair(config: KeyGenerationConfig): CryptoKeyPair {
    // ECC-specific key generation logic
    const eccKeys = generateECCKeyPair(config.curve || 'P-256');
    return {
      publicKey: eccKeys.publicKey,
      privateKey: eccKeys.privateKey,
      algorithm: 'ecc',
      curve: config.curve,
      // ... other properties
    };
  }

  validateKeyPair(keyPair: CryptoKeyPair): boolean {
    // ECC-specific validation logic
    return ECCEncryption.validateKeyPair(keyPair);
  }

  isKeyPairExpired(keyPair: CryptoKeyPair): boolean {
    // Standard expiry logic or ECC-specific
    return keyPair.expiresAt ? new Date() > keyPair.expiresAt : false;
  }

  // ... implement other required methods
}
```

### 2. Register with Factory

```typescript
KeyProviderFactory.registerProvider('ecc', () => new ECCKeyProvider());
```

### 3. Ready to Use

```typescript
const manager = KeyManager.getInstance({
  algorithm: 'ecc',
  curve: 'P-256',
});
```

## Implementation Details

### Key Provider Interface

```typescript
interface KeyProvider {
  generateKeyPair(config: KeyGenerationConfig): CryptoKeyPair;
  validateKeyPair(keyPair: CryptoKeyPair): boolean;
  isKeyPairExpired(keyPair: CryptoKeyPair): boolean;
  getPrivateKeyFormat(): string;
  getMinKeySize(): number;
  getAlgorithm(): 'rsa' | 'ecc' | 'ed25519';
  serializeKeyPair(keyPair: CryptoKeyPair): SerializedKeys;
  deserializeKeyPair(data: SerializedKeys): CryptoKeyPair;
  validateConfig(config: KeyGenerationConfig): string[];
}
```

### Generic Key Pair

```typescript
interface CryptoKeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: 'rsa' | 'ecc' | 'ed25519';
  version?: number;
  createdAt?: Date;
  expiresAt?: Date;
  keySize?: number; // For RSA
  curve?: string; // For ECC
}
```

## Migration Impact

### What Changed

- Internal implementation now uses strategy pattern
- KeyManager constructor accepts `algorithm` parameter
- Key storage format includes algorithm metadata

### What Stayed the Same

- All public APIs remain unchanged
- RSA keys continue to work exactly as before
- File formats are backward compatible
- Test suite passes without modifications

## Future Enhancements

1. **ECC Provider**: Implement Elliptic Curve Cryptography support
2. **Ed25519 Provider**: Add post-quantum ready signature algorithm
3. **Hardware Security Module (HSM)**: Support for hardware-backed keys
4. **Multi-Algorithm**: Support for hybrid key sets
5. **Key Migration**: Tools for migrating between algorithms

## Conclusion

The Strategy Pattern implementation successfully decouples the KeyManager from specific cryptographic implementations while maintaining full backward compatibility. This architecture is now ready for future cryptographic algorithm support without requiring changes to the core key management logic.
