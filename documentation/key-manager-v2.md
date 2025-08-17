# KeyManagerV2 Documentation

## Overview

The `KeyManagerV2` is a new, refactored version of the key management system. It is designed to be more modular, testable, and maintainable than its predecessor. The new architecture is based on a set of small, focused services, each with a specific responsibility. The `KeyManagerV2` class acts as a facade, orchestrating these services to provide the key management functionalities.

This new `v2` implementation lives alongside the original `v1` implementation to ensure backward compatibility.

## Architecture

The `KeyManagerV2` architecture consists of the following components:

-   **`KeyManagerV2`**: The main public-facing class that acts as a facade for the key management system. It is a singleton and is responsible for orchestrating the other services.
-   **`KeyStorageService`**: Handles all file system operations related to keys, such as loading, saving, and backing up keys.
-   **`KeyRotationService`**: Manages the logic for key rotation, including checking if rotation is needed and performing the rotation.
-   **`RotationHistoryService`**: Manages the rotation history, including reading, updating, and caching the history.
-   **`KeyLifecycleService`**: Handles the lifecycle of the keys, including generation, validation, and secure clearing of key material.
-   **`KeyConfigurationService`**: Manages the validation of the key manager configuration.

## Usage

### Initialization

To use the `KeyManagerV2`, you first need to get an instance of it and then initialize it.

```typescript
import { KeyManagerV2 } from '../src/v2/core/key-management/key-manager.v2';
import { Preset } from '../src/core/common/enums';

const config = {
  preset: Preset.NORMAL,
  certPath: './test-certs-v2',
  keyExpiryMonths: 1,
  autoGenerate: true,
  enableFileBackup: true,
  rotationGracePeriod: 0.05,
};

const keyManager = KeyManagerV2.getInstance(config);
await keyManager.initialize();
```

### Accessing Keys

Once the `KeyManagerV2` is initialized, you can access the public and private keys.

```typescript
// Get public key as a Base64 string
const publicKeyBase64 = await keyManager.getPublicKeyBase64();

// Get private key as a Base64 string (server-side only)
const privateKeyBase64 = await keyManager.getPrivateKeyBase64();
```

### Key Rotation

Key rotation is handled automatically by the `KeyManagerV2`. When you request a key, the key manager will first check if the current keys need rotation. If they do, it will perform the rotation before returning the key.

You can also trigger a rotation manually:

```typescript
await keyManager.rotateKeys();
```

### Health Check

You can check the health of the key manager using the `healthCheck` method.

```typescript
const health = await keyManager.healthCheck();
if (health.healthy) {
  console.log('Key manager is healthy.');
} else {
  console.log('Key manager is not healthy:', health.issues);
}
```
