import { KeyPair } from '../../../../src/core/common/interfaces/keys.interfaces';

const allErrors = [
  'Secret Key Length is=',
  'Public Key Length is=',
  'Invalid Preset, supported only: normal,high_security',
  'Invalid Secret Key, Uint8Array is expected',
  'Invalid Public Key, Uint8Array is expected',
  'Invalid createdAt date',
  'Invalid expiresAt date',
  'Invalid version',
];

const lastCasesErrors = allErrors.slice(2);
lastCasesErrors.splice(1, 2);

const typesToTest = [
  null,
  undefined,
  'undefined',
  '',
  0,
  -1,
  false,
  true,
  NaN,
  new Uint8Array(),
  new Uint8Array(0),
  new Uint8Array(32),
];

export const expected: string[][] = [
  allErrors.slice(2), // 0
  allErrors.slice(2), // 1
  allErrors.slice(2), // 2
  allErrors.slice(2), // 3
  allErrors.slice(2), // 4
  allErrors.slice(2).slice(0, -1), // 5
  allErrors.slice(2), // 6
  allErrors.slice(2), // 7
  allErrors.slice(2), // 8
  lastCasesErrors, // 9
  lastCasesErrors, // 10
  lastCasesErrors, // 11
];

export const keyPairsToTest = typesToTest.map(
  type =>
    ({
      publicKey: type as any,
      secretKey: type as any,
      metadata: {
        preset: type as any,
        createdAt: type as any,
        expiresAt: type as any,
        version: type as any,
      },
    }) satisfies KeyPair,
);
