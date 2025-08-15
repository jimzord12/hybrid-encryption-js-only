export type Branded<T, B> = T & { __brand: B };

export type Base64 = Branded<string, 'Base64'>;

export type HexString = Branded<string, 'HexString'>;
