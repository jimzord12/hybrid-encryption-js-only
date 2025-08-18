import { Preset } from '../core/common/enums';
import { createAppropriateError as coreCreateAppropriateError } from '../core/common/errors';
import { ErrorType } from '../core/common/errors/types.errors';

/**
 * Server-specific error creation utility
 * Wrapper around core error utility with server-specific defaults
 */
export function createAppropriateError(
  message: string,
  context: {
    errorType: ErrorType;
    preset: Preset;
    operation: string;
    cause?: Error;
  },
): Error {
  return coreCreateAppropriateError(message, context);
}

/**
 * Utility to safely extract error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Utility to check if an object has the basic structure of EncryptedData
 */
export function isEncryptedDataLike(obj: unknown): obj is Record<string, unknown> {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'preset' in obj &&
    'encryptedContent' in obj &&
    'cipherText' in obj &&
    'nonce' in obj
  );
}
