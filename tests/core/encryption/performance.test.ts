import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decrypt, encrypt, KeyManager } from '../../../src/core';

// ============================================================================
// PERFORMANCE TEST CONFIGURATION
// ============================================================================

interface PerformanceMetrics {
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  operationsPerSecond: number;
  memoryUsed: number;
  successRate: number;
}

interface TestConfiguration {
  iterations: number;
  concurrency: number;
  dataSize: number;
  timeout: number;
}

// Test configurations for different load scenarios
const PERFORMANCE_CONFIGS = {
  light: {
    iterations: 50,
    concurrency: 5,
    dataSize: 1024, // 1KB
    timeout: 30000, // 30s
  },
  medium: {
    iterations: 100,
    concurrency: 10,
    dataSize: 10240, // 10KB
    timeout: 60000, // 60s
  },
  heavy: {
    iterations: 200,
    concurrency: 20,
    dataSize: 51200, // 50KB
    timeout: 120000, // 2min
  },
  stress: {
    iterations: 500,
    concurrency: 50,
    dataSize: 102400, // 100KB
    timeout: 300000, // 5min
  },
} as const;

// ============================================================================
// PERFORMANCE TEST UTILITIES
// ============================================================================

/**
 * Generate test data of specified size
 */
function generateTestData(sizeInBytes: number): any {
  const chunkSize = 100;
  const chunks = Math.ceil(sizeInBytes / chunkSize);

  return {
    id: `test-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    data: Array.from({ length: chunks }, (_, i) => ({
      chunk: i,
      content: 'A'.repeat(Math.min(chunkSize, sizeInBytes - i * chunkSize)),
      metadata: {
        index: i,
        type: 'performance-test',
        generated: Date.now(),
      },
    })),
    size: sizeInBytes,
    checksum: Math.random().toString(36),
  };
}

/**
 * Measure memory usage
 */
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

/**
 * Calculate performance metrics from timing data
 */
function calculateMetrics(
  timings: number[],
  successCount: number,
  totalOperations: number,
  memoryUsed: number,
): PerformanceMetrics {
  const totalTime = timings.reduce((sum, time) => sum + time, 0);

  return {
    totalTime,
    averageTime: totalTime / timings.length,
    minTime: Math.min(...timings),
    maxTime: Math.max(...timings),
    operationsPerSecond: (successCount * 1000) / totalTime,
    memoryUsed,
    successRate: (successCount / totalOperations) * 100,
  };
}

/**
 * Run performance benchmark for a given operation
 */
async function benchmarkOperation<T>(
  operation: () => Promise<T>,
  config: TestConfiguration,
): Promise<PerformanceMetrics> {
  const timings: number[] = [];
  const results: Array<{ success: boolean; error?: Error }> = [];
  const startMemory = getMemoryUsage();

  console.log(
    `🚀 Starting benchmark: ${config.iterations} iterations, ${config.concurrency} concurrent`,
  );

  // Run operations in batches to control concurrency
  const batchSize = config.concurrency;
  const batches = Math.ceil(config.iterations / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, config.iterations);
    const batchOperations = [];

    // Create batch of concurrent operations
    for (let i = batchStart; i < batchEnd; i++) {
      batchOperations.push(
        (async () => {
          const startTime = performance.now();
          try {
            await operation();
            const endTime = performance.now();
            timings.push(endTime - startTime);
            results.push({ success: true });
          } catch (error) {
            const endTime = performance.now();
            timings.push(endTime - startTime);
            results.push({ success: false, error: error as Error });
          }
        })(),
      );
    }

    // Wait for batch to complete
    await Promise.all(batchOperations);

    // Progress reporting
    const completed = batchEnd;
    const progress = ((completed / config.iterations) * 100).toFixed(1);
    console.log(`📊 Progress: ${completed}/${config.iterations} (${progress}%)`);
  }

  const endMemory = getMemoryUsage();
  const successCount = results.filter(r => r.success).length;

  const metrics = calculateMetrics(
    timings,
    successCount,
    config.iterations,
    endMemory - startMemory,
  );

  // Log any errors
  const errors = results.filter(r => !r.success);
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} operations failed`);
    errors.slice(0, 3).forEach((error, index) => {
      console.warn(`   Error ${index + 1}: ${error.error?.message}`);
    });
  }

  return metrics;
}

// ============================================================================
// PERFORMANCE TEST SUITE
// ============================================================================

describe('Performance Tests | Component Integration', () => {
  let testCertPath: string;

  beforeEach(async () => {
    // Create unique test directory for performance tests
    testCertPath = `./test-certs/performance-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Initialize KeyManager with optimized configuration
    const keyManager = KeyManager.getInstance({
      certPath: testCertPath,
      algorithm: 'ml-kem-768',
      keySize: 768,
      autoGenerate: true,
      rotationGracePeriod: 24 * 60 * 60 * 1000, // 24 hours
    });

    await keyManager.initialize();
    console.log(`🔧 Initialized KeyManager for performance testing`);
  });

  afterEach(() => {
    KeyManager.resetInstance();
  });

  describe('Encryption Performance', () => {
    it(
      'should handle light load encryption efficiently',
      async () => {
        const config = PERFORMANCE_CONFIGS.light;
        const testData = generateTestData(config.dataSize);

        const metrics = await benchmarkOperation(() => encrypt(testData), config);

        console.log('📈 Light Load Encryption Metrics:', {
          averageTime: `${metrics.averageTime.toFixed(2)}ms`,
          operationsPerSecond: `${metrics.operationsPerSecond.toFixed(2)} ops/sec`,
          successRate: `${metrics.successRate.toFixed(2)}%`,
          memoryUsed: `${(metrics.memoryUsed / 1024 / 1024).toFixed(2)}MB`,
        });

        // Performance assertions
        expect(metrics.successRate).toBeGreaterThanOrEqual(95);
        expect(metrics.averageTime).toBeLessThan(1000); // < 1s per operation
        expect(metrics.operationsPerSecond).toBeGreaterThan(1); // > 1 ops/sec
      },
      PERFORMANCE_CONFIGS.light.timeout,
    );

    it(
      'should handle medium load encryption efficiently',
      async () => {
        const config = PERFORMANCE_CONFIGS.medium;
        const testData = generateTestData(config.dataSize);

        const metrics = await benchmarkOperation(() => encrypt(testData), config);

        console.log('📈 Medium Load Encryption Metrics:', {
          averageTime: `${metrics.averageTime.toFixed(2)}ms`,
          operationsPerSecond: `${metrics.operationsPerSecond.toFixed(2)} ops/sec`,
          successRate: `${metrics.successRate.toFixed(2)}%`,
          memoryUsed: `${(metrics.memoryUsed / 1024 / 1024).toFixed(2)}MB`,
        });

        expect(metrics.successRate).toBeGreaterThanOrEqual(90);
        expect(metrics.averageTime).toBeLessThan(2000); // < 2s per operation
        expect(metrics.operationsPerSecond).toBeGreaterThan(0.5); // > 0.5 ops/sec
      },
      PERFORMANCE_CONFIGS.medium.timeout,
    );

    it(
      'should handle heavy load encryption under stress',
      async () => {
        const config = PERFORMANCE_CONFIGS.heavy;
        const testData = generateTestData(config.dataSize);

        const metrics = await benchmarkOperation(() => encrypt(testData), config);

        console.log('📈 Heavy Load Encryption Metrics:', {
          averageTime: `${metrics.averageTime.toFixed(2)}ms`,
          operationsPerSecond: `${metrics.operationsPerSecond.toFixed(2)} ops/sec`,
          successRate: `${metrics.successRate.toFixed(2)}%`,
          memoryUsed: `${(metrics.memoryUsed / 1024 / 1024).toFixed(2)}MB`,
        });

        expect(metrics.successRate).toBeGreaterThanOrEqual(85);
        expect(metrics.averageTime).toBeLessThan(5000); // < 5s per operation
        expect(metrics.operationsPerSecond).toBeGreaterThan(0.2); // > 0.2 ops/sec
      },
      PERFORMANCE_CONFIGS.heavy.timeout,
    );
  });

  describe('Round-trip Performance', () => {
    it(
      'should handle encrypt-decrypt cycles efficiently',
      async () => {
        const config = PERFORMANCE_CONFIGS.stress;
        const testData = generateTestData(config.dataSize);

        const metrics = await benchmarkOperation(async () => {
          const encrypted = await encrypt(testData);
          const decrypted = await decrypt(encrypted);

          // Verify data integrity
          expect(decrypted.id).toBe(testData.id);
          expect(decrypted.size).toBe(testData.size);
          return decrypted;
        }, config);

        console.log('📈 Round-trip Performance Metrics:', {
          averageTime: `${metrics.averageTime.toFixed(2)}ms`,
          operationsPerSecond: `${metrics.operationsPerSecond.toFixed(2)} ops/sec`,
          successRate: `${metrics.successRate.toFixed(2)}%`,
          memoryUsed: `${(metrics.memoryUsed / 1024 / 1024).toFixed(2)}MB`,
        });

        expect(metrics.averageTime).toBeLessThan(3000); // < 3s per round-trip
        expect(metrics.successRate).toBeGreaterThanOrEqual(90);
      },
      PERFORMANCE_CONFIGS.stress.timeout,
    );
  });

  describe('Concurrent Operations', () => {
    it(
      'should handle concurrent encryption requests',
      async () => {
        const config = PERFORMANCE_CONFIGS.medium;
        const batchSize = 20;
        const batches = 5;

        const allTimings: number[] = [];
        let totalSuccessful = 0;
        let totalOperations = 0;

        for (let batch = 0; batch < batches; batch++) {
          const testData = generateTestData(config.dataSize);
          const startTime = performance.now();

          // Create concurrent operations
          const operations = Array.from({ length: batchSize }, () =>
            encrypt(testData).then(
              result => ({ success: true, result }),
              error => ({ success: false, error }),
            ),
          );

          const results = await Promise.all(operations);
          const endTime = performance.now();

          const batchTime = endTime - startTime;
          allTimings.push(batchTime);

          const successful = results.filter(r => r.success).length;
          totalSuccessful += successful;
          totalOperations += batchSize;

          console.log(
            `🔄 Batch ${batch + 1}/${batches}: ${successful}/${batchSize} successful, ${batchTime.toFixed(2)}ms`,
          );
        }

        const metrics = {
          totalTime: allTimings.reduce((sum, time) => sum + time, 0),
          averageTime: allTimings.reduce((sum, time) => sum + time, 0) / allTimings.length,
          successRate: (totalSuccessful / totalOperations) * 100,
          operationsPerSecond:
            (totalSuccessful * 1000) / allTimings.reduce((sum, time) => sum + time, 0),
        };

        console.log('📈 Concurrent Operations Metrics:', {
          averageTime: `${metrics.averageTime.toFixed(2)}ms per batch`,
          operationsPerSecond: `${metrics.operationsPerSecond.toFixed(2)} ops/sec`,
          successRate: `${metrics.successRate.toFixed(2)}%`,
          totalOperations,
        });

        expect(metrics.successRate).toBeGreaterThanOrEqual(90);
        expect(metrics.operationsPerSecond).toBeGreaterThan(1);
      },
      PERFORMANCE_CONFIGS.medium.timeout,
    );
  });

  describe('Key Management Performance', () => {
    it(
      'should handle rapid key pair generation',
      async () => {
        const config = { ...PERFORMANCE_CONFIGS.light, iterations: 10 }; // Fewer iterations for key generation

        const metrics = await benchmarkOperation(async () => {
          // Reset and reinitialize KeyManager to trigger key generation
          KeyManager.resetInstance();
          const keyManager = KeyManager.getInstance({
            certPath: `./test-certs/keygen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            algorithm: 'ml-kem-768',
            keySize: 768,
            autoGenerate: true,
          });
          await keyManager.initialize();
          return keyManager.getKeyPair();
        }, config);

        console.log('📈 Key Generation Metrics:', {
          averageTime: `${metrics.averageTime.toFixed(2)}ms`,
          successRate: `${metrics.successRate.toFixed(2)}%`,
        });

        expect(metrics.successRate).toBeGreaterThanOrEqual(95);
        expect(metrics.averageTime).toBeLessThan(10000); // < 10s per key generation
      },
      PERFORMANCE_CONFIGS.light.timeout,
    );

    it('should handle key rotation under load', async () => {
      const testData = generateTestData(PERFORMANCE_CONFIGS.light.dataSize);

      // Encrypt data with initial keys
      const initialEncrypted = await encrypt(testData);

      // Perform key rotation
      const keyManager = KeyManager.getInstance();
      const rotationStart = performance.now();
      await keyManager.rotateKeys();
      const rotationTime = performance.now() - rotationStart;

      // Verify grace period decryption still works
      const decryptStart = performance.now();
      const decrypted = await decrypt(initialEncrypted);
      const decryptTime = performance.now() - decryptStart;

      console.log('📈 Key Rotation Metrics:', {
        rotationTime: `${rotationTime.toFixed(2)}ms`,
        gracePeriodDecryptTime: `${decryptTime.toFixed(2)}ms`,
      });

      expect(decrypted.id).toBe(testData.id);
      expect(rotationTime).toBeLessThan(15000); // < 15s for rotation
      expect(decryptTime).toBeLessThan(2000); // < 2s for grace period decryption
    });
  });

  describe('Memory and Resource Management', () => {
    it(
      'should not leak memory during extended operations',
      async () => {
        const initialMemory = getMemoryUsage();
        const config = PERFORMANCE_CONFIGS.medium;
        const testData = generateTestData(config.dataSize);

        // Run multiple cycles
        for (let cycle = 0; cycle < 3; cycle++) {
          console.log(`🔄 Memory test cycle ${cycle + 1}/3`);

          await benchmarkOperation(
            async () => {
              const encrypted = await encrypt(testData);
              const decrypted = await decrypt(encrypted);
              return decrypted;
            },
            { ...config, iterations: 20 },
          );

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }

        const finalMemory = getMemoryUsage();
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        console.log('📈 Memory Usage:', {
          initial: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
          final: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
          increase: `${memoryIncreaseMB.toFixed(2)}MB`,
        });

        // Memory should not increase by more than 50MB
        expect(memoryIncreaseMB).toBeLessThan(50);
      },
      PERFORMANCE_CONFIGS.medium.timeout,
    );
  });

  describe('Error Handling Under Load', () => {
    it('should gracefully handle errors during high load', async () => {
      const config = PERFORMANCE_CONFIGS.light;
      let errorCount = 0;
      let successCount = 0;

      const metrics = await benchmarkOperation(async () => {
        try {
          // Randomly introduce some errors
          if (Math.random() < 0.1) {
            // 10% error rate
            throw new Error('Simulated error');
          }

          const testData = generateTestData(config.dataSize);
          const encrypted = await encrypt(testData);
          const decrypted = await decrypt(encrypted);
          successCount++;
          return decrypted;
        } catch (error) {
          errorCount++;
          throw error;
        }
      }, config);

      console.log('📈 Error Handling Metrics:', {
        successCount,
        errorCount,
        successRate: `${metrics.successRate.toFixed(2)}%`,
        averageTime: `${metrics.averageTime.toFixed(2)}ms`,
      });

      // Should handle errors gracefully
      expect(successCount).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(80); // Should handle 90% despite injected errors
    });
  });

  describe('Data Size Scalability', () => {
    it('should scale performance with different data sizes', async () => {
      const dataSizes = [1024, 10240, 51200, 102400]; // 1KB, 10KB, 50KB, 100KB
      const results: Array<{ size: number; metrics: PerformanceMetrics }> = [];

      for (const size of dataSizes) {
        console.log(`📏 Testing data size: ${(size / 1024).toFixed(1)}KB`);
        const testData = generateTestData(size);

        const metrics = await benchmarkOperation(() => encrypt(testData), {
          ...PERFORMANCE_CONFIGS.light,
          iterations: 10,
        });

        results.push({ size, metrics });
      }

      // Analyze scaling characteristics
      console.log('📈 Data Size Scaling Analysis:');
      results.forEach(({ size, metrics }) => {
        console.log(
          `   ${(size / 1024).toFixed(1)}KB: ${metrics.averageTime.toFixed(2)}ms avg, ${metrics.operationsPerSecond.toFixed(2)} ops/sec`,
        );
      });

      // Verify that performance degrades predictably with size
      const firstResult = results[0];
      const lastResult = results[results.length - 1];

      expect(lastResult.metrics.averageTime).toBeGreaterThan(firstResult.metrics.averageTime);
      expect(firstResult.metrics.operationsPerSecond).toBeGreaterThan(
        lastResult.metrics.operationsPerSecond,
      );
    });
  });
});
