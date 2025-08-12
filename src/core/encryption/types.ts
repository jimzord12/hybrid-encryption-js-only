export interface KeyPair {
  readonly publicKey: Uint8Array;
  readonly privateKey: Uint8Array;
}

export interface SharedSecretResult {
  readonly sharedSecret: Uint8Array;
  readonly keyMaterial: Uint8Array;
}

export interface SymmetricEncryptionResult {
  readonly encryptedData: Uint8Array;
  readonly authData?: Uint8Array;
  readonly nonce: Uint8Array;
}

export interface KeyMaterial {
  readonly key: Uint8Array;
  readonly nonce: Uint8Array;
  readonly info?: Uint8Array;
}

export interface EncryptionPayload {
  readonly asymmetricAlgorithm: string;
  readonly symmetricAlgorithm: string;
  readonly keyMaterial: readonly number[];
  readonly salt: readonly number[];
  readonly nonce: readonly number[];
  readonly encryptedData: readonly number[];
  readonly authData?: readonly number[];
  readonly timestamp: number;
}

export interface AlgorithmInfo {
  readonly algorithm: string;
  readonly publicKey: Uint8Array;
  readonly privateKey?: Uint8Array;
}
