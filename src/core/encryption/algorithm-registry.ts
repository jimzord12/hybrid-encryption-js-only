import { AsymmetricAlgorithm } from './asymmetric/base';
import { MLKEMAlgorithm } from './asymmetric/implementations/post-quantom/ml-kem768-alg';
import { SymmetricAlgorithm } from './symmetric/base';
import { AES256GCMAlgorithm } from './symmetric/implementations/aes-gcm-256-alg';
import { ChaCha20Poly1305Algorithm } from './symmetric/implementations/cha-cha-20-alg';

/**
 * Interface for algorithms that can be registered in the registry
 */
export interface RegistrableAlgorithm {
  getAlgorithmId(): string;
}

/**
 * Algorithm type discriminator
 */
export type AlgorithmType = 'asymmetric' | 'symmetric';

/**
 * Custom error class for algorithm registry operations
 */
export class AlgorithmRegistryError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'AlgorithmRegistryError';
  }
}

/**
 * Configuration for algorithm registry defaults
 */
export interface RegistryConfig {
  asymmetricDefault?: string;
  symmetricDefault?: string;
  autoRegisterDefaults?: boolean;
}

/**
 * Generic algorithm registry that supports both symmetric and asymmetric algorithms
 * with type-safe operations and configurable defaults
 *
 * @template T - The algorithm type (must implement RegistrableAlgorithm)
 */
export class AlgorithmRegistry<T extends RegistrableAlgorithm> {
  private readonly algorithms = new Map<string, T>();
  private readonly algorithmTypes = new Map<string, AlgorithmType>();
  private asymmetricDefault: string | null = null;
  private symmetricDefault: string | null = null;
  private readonly registryType: AlgorithmType | 'mixed';

  constructor(registryType: AlgorithmType | 'mixed' = 'mixed', config: RegistryConfig = {}) {
    this.registryType = registryType;

    if (config.autoRegisterDefaults !== false) {
      this.registerDefaultAlgorithms(config);
    }
  }

  /**
   * Register default algorithms during initialization
   */
  private registerDefaultAlgorithms(config: RegistryConfig): void {
    try {
      if (this.registryType === 'asymmetric' || this.registryType === 'mixed') {
        // Register ML-KEM-768 as default asymmetric algorithm
        const mlkem = new MLKEMAlgorithm() as unknown as T;
        this.register(mlkem, 'asymmetric', true);
      }

      if (this.registryType === 'symmetric' || this.registryType === 'mixed') {
        // Register AES-GCM-256 as default symmetric algorithm
        const aesGcm = new AES256GCMAlgorithm() as unknown as T;
        this.register(aesGcm, 'symmetric', true);
        
        // Register ChaCha20-Poly1305 as additional symmetric algorithm
        const chaCha20 = new ChaCha20Poly1305Algorithm() as unknown as T;
        this.register(chaCha20, 'symmetric', false);
      }

      // Apply custom defaults from config
      if (config.asymmetricDefault) {
        this.asymmetricDefault = config.asymmetricDefault;
      }
      if (config.symmetricDefault) {
        this.symmetricDefault = config.symmetricDefault;
      }
    } catch (error) {
      throw new AlgorithmRegistryError(
        'Failed to register default algorithms',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Register a new algorithm in the registry
   * @param algorithm - The algorithm implementation to register
   * @param algorithmType - The type of algorithm (asymmetric or symmetric)
   * @param isDefault - Whether this should be the default algorithm for its type
   * @throws {AlgorithmRegistryError} When registration fails
   */
  register(algorithm: T, algorithmType: AlgorithmType, isDefault = false): void {
    if (!algorithm) {
      throw new AlgorithmRegistryError('Algorithm cannot be null or undefined');
    }

    if (this.registryType !== 'mixed' && this.registryType !== algorithmType) {
      throw new AlgorithmRegistryError(
        `Cannot register ${algorithmType} algorithm in ${this.registryType}-only registry`,
      );
    }

    const algorithmId = algorithm.getAlgorithmId();

    if (this.algorithms.has(algorithmId)) {
      console.warn(`⚠️ Algorithm ${algorithmId} already registered, overwriting...`);
    }

    this.algorithms.set(algorithmId, algorithm);
    this.algorithmTypes.set(algorithmId, algorithmType);

    // Set as default if requested or if no default exists for this type
    if (algorithmType === 'asymmetric' && (isDefault || this.asymmetricDefault === null)) {
      this.asymmetricDefault = algorithmId;
    } else if (algorithmType === 'symmetric' && (isDefault || this.symmetricDefault === null)) {
      this.symmetricDefault = algorithmId;
    }

    console.log(`✅ Registered ${algorithmType} algorithm: ${algorithmId} (${this.registryType} registry)`);
  }

  /**
   * Get an algorithm by its identifier
   * @param algorithmId - The algorithm identifier
   * @returns The requested algorithm
   * @throws {AlgorithmRegistryError} When algorithm is not found
   */
  get(algorithmId: string): T {
    if (!algorithmId || typeof algorithmId !== 'string') {
      throw new AlgorithmRegistryError('Algorithm ID must be a non-empty string');
    }

    const algorithm = this.algorithms.get(algorithmId);
    if (!algorithm) {
      throw new AlgorithmRegistryError(
        `Unsupported algorithm: ${algorithmId}. Available algorithms: ${this.list().join(', ')}`,
      );
    }

    return algorithm;
  }

  /**
   * Get the default algorithm for a specific type
   * @param algorithmType - The type of algorithm to get the default for
   * @returns The default algorithm for the specified type
   * @throws {AlgorithmRegistryError} When no default algorithm is set for the type
   */
  getDefault(algorithmType: AlgorithmType): T {
    const defaultId =
      algorithmType === 'asymmetric' ? this.asymmetricDefault : this.symmetricDefault;

    if (!defaultId) {
      throw new AlgorithmRegistryError(`No default ${algorithmType} algorithm set`);
    }

    return this.get(defaultId);
  }

  /**
   * Get the default asymmetric algorithm (convenience method)
   * @returns The default asymmetric algorithm
   */
  getDefaultAsymmetric(): T {
    return this.getDefault('asymmetric');
  }

  /**
   * Get the default symmetric algorithm (convenience method)
   * @returns The default symmetric algorithm
   */
  getDefaultSymmetric(): T {
    return this.getDefault('symmetric');
  }

  /**
   * List all registered algorithm identifiers
   * @param filterByType - Optional filter by algorithm type
   * @returns Array of algorithm identifiers
   */
  list(filterByType?: AlgorithmType): readonly string[] {
    if (!filterByType) {
      return Array.from(this.algorithms.keys());
    }

    return Array.from(this.algorithms.keys()).filter(
      id => this.algorithmTypes.get(id) === filterByType,
    );
  }

  /**
   * Set the default algorithm for a specific type
   * @param algorithmId - The algorithm identifier to set as default
   * @param algorithmType - The type of algorithm
   * @throws {AlgorithmRegistryError} When algorithm is not registered or type mismatch
   */
  setDefault(algorithmId: string, algorithmType: AlgorithmType): void {
    if (!algorithmId || typeof algorithmId !== 'string') {
      throw new AlgorithmRegistryError('Algorithm ID must be a non-empty string');
    }

    if (!this.algorithms.has(algorithmId)) {
      throw new AlgorithmRegistryError(
        `Cannot set default: unknown algorithm ${algorithmId}. Available algorithms: ${this.list().join(', ')}`,
      );
    }

    const registeredType = this.algorithmTypes.get(algorithmId);
    if (registeredType !== algorithmType) {
      throw new AlgorithmRegistryError(
        `Algorithm ${algorithmId} is registered as ${registeredType}, cannot set as default ${algorithmType}`,
      );
    }

    if (algorithmType === 'asymmetric') {
      this.asymmetricDefault = algorithmId;
    } else {
      this.symmetricDefault = algorithmId;
    }

    console.log(`🔄 Default ${algorithmType} algorithm changed to: ${algorithmId}`);
  }

  /**
   * Check if an algorithm is registered
   * @param algorithmId - The algorithm identifier to check
   * @returns True if the algorithm is registered
   */
  has(algorithmId: string): boolean {
    return this.algorithms.has(algorithmId);
  }

  /**
   * Get the type of a registered algorithm
   * @param algorithmId - The algorithm identifier
   * @returns The algorithm type or undefined if not registered
   */
  getAlgorithmType(algorithmId: string): AlgorithmType | undefined {
    return this.algorithmTypes.get(algorithmId);
  }

  /**
   * Get the current default algorithm IDs
   * @returns Object with default algorithm IDs for each type
   */
  getDefaultIds(): {
    asymmetric: string | null;
    symmetric: string | null;
  } {
    return {
      asymmetric: this.asymmetricDefault,
      symmetric: this.symmetricDefault,
    };
  }

  /**
   * Unregister an algorithm
   * @param algorithmId - The algorithm identifier to remove
   * @throws {AlgorithmRegistryError} When trying to remove a default algorithm
   */
  unregister(algorithmId: string): boolean {
    const algorithmType = this.algorithmTypes.get(algorithmId);

    if (algorithmId === this.asymmetricDefault || algorithmId === this.symmetricDefault) {
      throw new AlgorithmRegistryError(
        `Cannot unregister default ${algorithmType} algorithm: ${algorithmId}. Set a different default first.`,
      );
    }

    const removedAlgorithm = this.algorithms.delete(algorithmId);
    const removedType = this.algorithmTypes.delete(algorithmId);

    if (removedAlgorithm && removedType) {
      console.log(`🗑️ Unregistered ${algorithmType} algorithm: ${algorithmId} (${this.registryType} registry)`);
    }

    return removedAlgorithm;
  }

  /**
   * Get registry statistics
   * @returns Object with comprehensive registry information
   */
  getStats(): {
    totalAlgorithms: number;
    asymmetricCount: number;
    symmetricCount: number;
    defaults: {
      asymmetric: string | null;
      symmetric: string | null;
    };
    algorithms: {
      asymmetric: readonly string[];
      symmetric: readonly string[];
      all: readonly string[];
    };
    registryType: AlgorithmType | 'mixed';
  } {
    const asymmetricAlgorithms = this.list('asymmetric');
    const symmetricAlgorithms = this.list('symmetric');

    return {
      totalAlgorithms: this.algorithms.size,
      asymmetricCount: asymmetricAlgorithms.length,
      symmetricCount: symmetricAlgorithms.length,
      defaults: this.getDefaultIds(),
      algorithms: {
        asymmetric: asymmetricAlgorithms,
        symmetric: symmetricAlgorithms,
        all: this.list(),
      },
      registryType: this.registryType,
    };
  }

  /**
   * Clear all algorithms and reset defaults
   * @param preserveDefaults - Whether to preserve default settings
   */
  clear(preserveDefaults = false): void {
    this.algorithms.clear();
    this.algorithmTypes.clear();

    if (!preserveDefaults) {
      this.asymmetricDefault = null;
      this.symmetricDefault = null;
    }

    console.log('🧹 Algorithm registry cleared');
  }
}

// Export type-specific registry instances for convenience
export const asymmetricRegistry = new AlgorithmRegistry<AsymmetricAlgorithm>('asymmetric', {
  asymmetricDefault: 'ML-KEM-768',
});

export const symmetricRegistry = new AlgorithmRegistry<SymmetricAlgorithm>('symmetric', {
  symmetricDefault: 'AES-GCM-256',
});

// Export a mixed registry that can handle both types
export const mixedAlgorithmRegistry = new AlgorithmRegistry<
  AsymmetricAlgorithm | SymmetricAlgorithm
>('mixed', {
  asymmetricDefault: 'ML-KEM-768',
  symmetricDefault: 'AES-GCM-256',
});
