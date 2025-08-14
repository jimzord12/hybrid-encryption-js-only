



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
