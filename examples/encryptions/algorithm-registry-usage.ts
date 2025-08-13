/**
 * Example demonstrating the enhanced Algorithm Registry usage
 * Shows how to work with both symmetric and asymmetric algorithms
 */

import {
  AlgorithmRegistry,
  asymmetricRegistry,
  mixedAlgorithmRegistry,
  symmetricRegistry,
} from '../../src/core/encryption/algorithm-registry';
import { AsymmetricAlgorithm } from '../../src/core/encryption/asymmetric/base';
import { SymmetricAlgorithm } from '../../src/core/encryption/symmetric/base';

/**
 * Example 1: Using type-specific registries
 */
function demonstrateSpecificRegistries(): void {
  console.log('🔍 === Type-Specific Registries Demo ===');

  // Asymmetric algorithms only
  console.log('\n📊 Asymmetric Registry Stats:');
  console.log(asymmetricRegistry.getStats());

  try {
    const defaultAsymmetric = asymmetricRegistry.getDefault('asymmetric');
    console.log(`✅ Default asymmetric algorithm: ${defaultAsymmetric.getAlgorithmId()}`);
  } catch (error) {
    console.error(`❌ Error getting default asymmetric: ${error}`);
  }

  // Symmetric algorithms only
  console.log('\n📊 Symmetric Registry Stats:');
  console.log(symmetricRegistry.getStats());

  try {
    const defaultSymmetric = symmetricRegistry.getDefault('symmetric');
    console.log(`✅ Default symmetric algorithm: ${defaultSymmetric.getAlgorithmId()}`);
  } catch (error) {
    console.error(`❌ Error getting default symmetric: ${error}`);
  }
}

/**
 * Example 2: Using the mixed registry for both types
 */
function demonstrateMixedRegistry(): void {
  console.log('\n🔍 === Mixed Registry Demo ===');

  const stats = mixedAlgorithmRegistry.getStats();
  console.log('\n📊 Mixed Registry Stats:');
  console.log(`Total algorithms: ${stats.totalAlgorithms}`);
  console.log(`Asymmetric algorithms: ${stats.asymmetricCount}`);
  console.log(`Symmetric algorithms: ${stats.symmetricCount}`);
  console.log(`Defaults:`, stats.defaults);

  // Get default algorithms
  try {
    const defaultAsymmetric = mixedAlgorithmRegistry.getDefaultAsymmetric();
    console.log(`✅ Default asymmetric: ${defaultAsymmetric.getAlgorithmId()}`);

    const defaultSymmetric = mixedAlgorithmRegistry.getDefaultSymmetric();
    console.log(`✅ Default symmetric: ${defaultSymmetric.getAlgorithmId()}`);
  } catch (error) {
    console.error(`❌ Error getting defaults: ${error}`);
  }

  // List algorithms by type
  console.log('\n📋 Algorithm Lists:');
  console.log(`Asymmetric: ${mixedAlgorithmRegistry.list('asymmetric').join(', ')}`);
  console.log(`Symmetric: ${mixedAlgorithmRegistry.list('symmetric').join(', ')}`);
  console.log(`All: ${mixedAlgorithmRegistry.list().join(', ')}`);
}

/**
 * Example 3: Creating a custom registry
 */
function demonstrateCustomRegistry(): void {
  console.log('\n🔍 === Custom Registry Demo ===');

  // Create a custom mixed registry with specific configuration
  const customRegistry = new AlgorithmRegistry<AsymmetricAlgorithm | SymmetricAlgorithm>('mixed', {
    asymmetricDefault: 'ML-KEM-768',
    symmetricDefault: 'AES-GCM-256',
    autoRegisterDefaults: true,
  });

  console.log('\n📊 Custom Registry Stats:');
  console.log(customRegistry.getStats());

  // Test algorithm type checking
  const algorithms = customRegistry.list();
  algorithms.forEach(id => {
    const type = customRegistry.getAlgorithmType(id);
    console.log(`🔖 ${id}: ${type}`);
  });
}

/**
 * Example 4: Error handling and validation
 */
function demonstrateErrorHandling(): void {
  console.log('\n🔍 === Error Handling Demo ===');

  const testRegistry = new AlgorithmRegistry<AsymmetricAlgorithm>('asymmetric');

  // Test getting non-existent algorithm
  try {
    testRegistry.get('non-existent-algorithm');
  } catch (error) {
    console.log(`✅ Expected error caught: ${error instanceof Error ? error.message : error}`);
  }

  // Test setting default for wrong type
  try {
    testRegistry.setDefault('some-id', 'symmetric' as any);
  } catch (error) {
    console.log(`✅ Expected error caught: ${error instanceof Error ? error.message : error}`);
  }

  // Test unregistering default algorithm
  try {
    const stats = testRegistry.getStats();
    if (stats.defaults.asymmetric) {
      testRegistry.unregister(stats.defaults.asymmetric);
    }
  } catch (error) {
    console.log(`✅ Expected error caught: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Example 5: Registry operations
 */
function demonstrateRegistryOperations(): void {
  console.log('\n🔍 === Registry Operations Demo ===');

  const operationsRegistry = new AlgorithmRegistry<AsymmetricAlgorithm | SymmetricAlgorithm>(
    'mixed',
    { autoRegisterDefaults: false },
  );

  console.log('📊 Empty registry stats:');
  console.log(operationsRegistry.getStats());

  // The registry is empty since autoRegisterDefaults is false
  console.log('\n🧹 Registry cleared, no algorithms available');

  // Check if algorithm exists
  console.log(`❓ Has ML-KEM-768: ${operationsRegistry.has('ML-KEM-768')}`);
  console.log(`❓ Has AES-GCM-256: ${operationsRegistry.has('AES-GCM-256')}`);
}

/**
 * Run all examples
 */
function runAllExamples(): void {
  console.log('🚀 Starting Algorithm Registry Examples...\n');

  try {
    demonstrateSpecificRegistries();
    demonstrateMixedRegistry();
    demonstrateCustomRegistry();
    demonstrateErrorHandling();
    demonstrateRegistryOperations();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

if (import.meta.main) {
  runAllExamples();
}

export {
  demonstrateCustomRegistry,
  demonstrateErrorHandling,
  demonstrateMixedRegistry,
  demonstrateRegistryOperations,
  demonstrateSpecificRegistries,
  runAllExamples,
};
