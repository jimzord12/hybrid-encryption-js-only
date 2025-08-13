/**
 * Custom Error Classes for Modern Encryption System
 *
 * Specialized error types for better error handling and debugging
 * in the modern encryption system
 */

/**
 * Base class for all modern encryption errors
 * Provides common properties and better error tracking
 */
export class ModernEncryptionError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    public readonly algorithm?: string,
    public readonly operation?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ModernEncryptionError';
    this.timestamp = new Date();
    this.errorId = `me-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ModernEncryptionError);
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
    public readonly keyType?: string,
    public readonly algorithm?: string,
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
      keyType: this.keyType,
      algorithm: this.algorithm,
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

/**
 * Error for when requested algorithms are not found
 * Provides helpful information about available alternatives
 */
export class AlgorithmNotFoundError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    algorithm: string,
    public readonly algorithmType: 'asymmetric' | 'symmetric' | 'kdf',
    public readonly availableAlgorithms: string[],
    public readonly suggestedAlternatives?: string[],
  ) {
    const availableList = availableAlgorithms.join(', ');
    const suggestedList = suggestedAlternatives
      ? ` Suggested: ${suggestedAlternatives.join(', ')}`
      : '';

    super(
      `Algorithm '${algorithm}' not found for type '${algorithmType}'. Available: ${availableList}.${suggestedList}`,
    );

    this.name = 'AlgorithmNotFoundError';
    this.timestamp = new Date();
    this.errorId = `anf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlgorithmNotFoundError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      algorithmType: this.algorithmType,
      availableAlgorithms: this.availableAlgorithms,
      suggestedAlternatives: this.suggestedAlternatives,
      timestamp: this.timestamp.toISOString(),
      errorId: this.errorId,
      stack: this.stack,
    };
  }
}

/**
 * Error for key derivation failures
 * Specialized for KDF-related operations
 */
export class KeyDerivationError extends ModernEncryptionError {
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
export class CryptographicOperationError extends ModernEncryptionError {
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
    operation?: string;
    algorithm?: string;
    errorType?: 'validation' | 'algorithm' | 'operation' | 'format' | 'config' | 'keymanager';
    cause?: Error;
    [key: string]: any;
  },
): Error {
  const { operation, algorithm, errorType, cause, ...additionalContext } = context;

  switch (errorType) {
    case 'validation':
      return new KeyValidationError(
        message,
        additionalContext.keyType,
        algorithm,
        additionalContext.validationErrors,
        cause,
      );

    case 'algorithm':
      return new AlgorithmNotFoundError(
        algorithm || 'unknown',
        additionalContext.algorithmType || 'asymmetric',
        additionalContext.availableAlgorithms || [],
        additionalContext.suggestedAlternatives,
      );

    case 'operation':
      return new CryptographicOperationError(
        message,
        (operation as any) || 'encrypt',
        algorithm,
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
        algorithm || 'unknown',
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
        algorithm,
        additionalContext.filePath,
        additionalContext.rotationState,
        cause,
      );

    default:
      return new ModernEncryptionError(message, algorithm, operation, cause);
  }
}
