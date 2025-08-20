export class PublicKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicKeyError';
  }
}
