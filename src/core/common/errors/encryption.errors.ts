/**
 * Custom Error Classes for Modern Encryption System
 *
 * Specialized error types for better error handling and debugging
 * in the modern encryption system
 */

import { Preset } from '../enums';
import { ErrorType } from './types.errors';

/**
 * Base class for all modern encryption errors
 * Provides common properties and better error tracking
 */
export class EncryptionError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly algorithm?: string,
    public readonly operation?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'EncryptionError';
    this.timestamp = new Date();
    this.errorId = `me-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EncryptionError);
    }
  }

  /**
   * Convert error to JSON for logging/reporting
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      algorithm: this.algorithm,
      operation: this.operation,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error for key validation failures
 * Used when keys fail format or security validation
 */
export class KeyValidationError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly preset: Preset,
    public readonly validationErrors?: string[],
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'KeyValidationError';
    this.timestamp = new Date();
    this.errorId = `kv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KeyValidationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      preset: this.preset,
      validationErrors: this.validationErrors,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

export class KeyGenerationError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly preset: Preset,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'KeyGenerationError';
    this.timestamp = new Date();
    this.errorId = `kgen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KeyGenerationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      preset: this.preset,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error for when requested algorithms are not found
 * Provides helpful information about available alternatives
 */
export class AlgorithmError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    public readonly message: string,
    public readonly preset: Preset,
    public readonly algorithmType: 'asymmetric' | 'symmetric' | 'kdf',
    public readonly cause?: Error,
  ) {
    super(message);

    this.name = 'AlgorithmError';
    this.timestamp = new Date();
    this.errorId = `anf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlgorithmError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      preset: this.preset,
      algorithmType: this.algorithmType,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
    };
  }
}

export class AlgorithmAsymmetricError extends AlgorithmError {
  constructor(message: string, preset: Preset, cause?: Error) {
    super(message, preset, 'asymmetric', cause);
    this.name = 'AlgorithmAsymmetricError';
  }
}
export class AlgorithmSymmetricError extends AlgorithmError {
  constructor(message: string, preset: Preset, cause?: Error) {
    super(message, preset, 'symmetric', cause);
    this.name = 'AlgorithmSymmetricError';
  }
}
export class AlgorithmKDFError extends AlgorithmError {
  constructor(message: string, preset: Preset, cause?: Error) {
    super(message, preset, 'kdf', cause);
    this.name = 'AlgorithmKDFError';
  }
}

/**
 * Error for key derivation failures
 * Specialized for KDF-related operations
 */
export class KeyDerivationError extends EncryptionError {
  constructor(
    message: string,
    public readonly kdfAlgorithm: string,
    public readonly inputLength?: number,
    public readonly outputLength?: number,
    cause?: Error,
  ) {
    super(message, kdfAlgorithm, 'key-derivation', cause);
    this.name = 'KeyDerivationError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kdfAlgorithm: this.kdfAlgorithm,
      inputLength: this.inputLength,
      outputLength: this.outputLength,
    };
  }
}

/**
 * Error for cryptographic operation failures
 * Covers encryption, decryption, signing, verification operations
 */
export class CryptographicOperationError extends EncryptionError {
  constructor(
    message: string,
    operation: 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'key-generation',
    algorithm?: string,
    public readonly inputSize?: number,
    public readonly expectedOutputSize?: number,
    cause?: Error,
  ) {
    super(message, algorithm, operation, cause);
    this.name = 'CryptographicOperationError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      inputSize: this.inputSize,
      expectedOutputSize: this.expectedOutputSize,
    };
  }
}

/**
 * Error for format conversion failures
 * When converting between different data formats (Base64, binary, etc.)
 */
export class FormatConversionError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly sourceFormat: string,
    public readonly targetFormat: string,
    public readonly dataLength?: number,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'FormatConversionError';
    this.timestamp = new Date();
    this.errorId = `fc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FormatConversionError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      sourceFormat: this.sourceFormat,
      targetFormat: this.targetFormat,
      dataLength: this.dataLength,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error for algorithm configuration issues
 * When algorithms are misconfigured or have invalid parameters
 */
export class AlgorithmConfigurationError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly algorithm: string,
    public readonly parameterName?: string,
    public readonly parameterValue?: any,
    public readonly validValues?: any[],
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'AlgorithmConfigurationError';
    this.timestamp = new Date();
    this.errorId = `ac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlgorithmConfigurationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      algorithm: this.algorithm,
      parameterName: this.parameterName,
      parameterValue: this.parameterValue,
      validValues: this.validValues,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error for KeyManager operation failures
 * Covers key rotation, key storage, initialization, and lifecycle management
 */
export class KeyManagerError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly operation:
      | 'initialization'
      | 'rotation'
      | 'storage'
      | 'validation'
      | 'retrieval'
      | 'backup'
      | 'cleanup',
    public readonly keyVersion?: number,
    public readonly algorithm?: string,
    public readonly filePath?: string,
    public readonly rotationState?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'KeyManagerError';
    this.timestamp = new Date();
    this.errorId = `km-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KeyManagerError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      keyVersion: this.keyVersion,
      algorithm: this.algorithm,
      filePath: this.filePath,
      rotationState: this.rotationState,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * Utility function to create appropriate error based on context
 * Helps choose the right error type for different scenarios
 */
export function createAppropriateError(
  message: string,
  context: {
    errorType: ErrorType;
    preset: Preset;
    operation?: string;
    cause?: Error | undefined;
    [key: string]: any;
  },
): Error {
  const { operation, errorType, cause, preset, ...additionalContext } = context;

  switch (errorType) {
    case 'validation':
      return new KeyValidationError(message, preset, additionalContext.validationErrors, cause);

    case 'algorithm-asymmetric':
      return new AlgorithmAsymmetricError(message, preset, cause);

    case 'algorithm-symmetric':
      return new AlgorithmSymmetricError(message, preset, cause);

    case 'algorithm-kdf':
      return new AlgorithmKDFError(message, preset, cause);

    case 'operation':
      return new CryptographicOperationError(
        message,
        (operation as any) || 'encrypt',
        preset,
        additionalContext.inputSize,
        additionalContext.expectedOutputSize,
        cause,
      );

    case 'format':
      return new FormatConversionError(
        message,
        additionalContext.sourceFormat || 'unknown',
        additionalContext.targetFormat || 'unknown',
        additionalContext.dataLength,
        cause,
      );

    case 'config':
      return new AlgorithmConfigurationError(
        message,
        preset || 'unknown',
        additionalContext.parameterName,
        additionalContext.parameterValue,
        additionalContext.validValues,
        cause,
      );

    case 'keymanager':
      return new KeyManagerError(
        message,
        (additionalContext.operation as any) || 'initialization',
        additionalContext.keyVersion,
        preset,
        additionalContext.filePath,
        additionalContext.rotationState,
        cause,
      );

    default:
      return new EncryptionError(message, preset, operation, cause);
  }
}
