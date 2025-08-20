import { Base64 } from '../core';
import { PublicKeyError } from './errors';
import { api } from './utils';

export class ClientKeyManager {
  static cachedKey: Base64 | Uint8Array | null = null;
  static ttl: number | null = null;
  static publicKeyBaseURL: string | null = null;

  static async getKey(keyUrl: string): Promise<Base64 | Uint8Array | null> {
    if (keyUrl == null) throw new PublicKeyError('Public key Base URL is required');
    if (this.publicKeyBaseURL !== keyUrl) {
      this.publicKeyBaseURL = keyUrl;
      this.clearKey(); // Clear cache when switching URLs
    }
    if (this.cachedKey === null) await this.fetchKey();
    if (this.ttl !== null && Date.now() > this.ttl) {
      this.clearKey();
      await this.fetchKey();
    }

    return this.cachedKey;
  }

  static setKey(key: Base64 | Uint8Array | null, expiresIn = 86_400_000) {
    this.cachedKey = key;
    this.ttl = Date.now() + expiresIn;
  }

  static clearKey() {
    this.cachedKey = null;
    this.ttl = null;
  }

  static async fetchKey() {
    if (this.publicKeyBaseURL === null)
      throw new PublicKeyError('To Fetch the Public key, Base URL is required');

    const response = await api.get<{ publicKey: Base64 }>(this.publicKeyBaseURL + '/public-key');
    this.setKey(response.data.publicKey);
  }
}

export const ckm = ClientKeyManager;
