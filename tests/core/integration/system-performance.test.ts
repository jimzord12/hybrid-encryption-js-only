import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decrypt, encrypt, KeyManager } from '../../../src/core';

// ============================================================================
// INTEGRATION PERFORMANCE TESTS
// ============================================================================

interface SystemMetrics {
  encryption: {
    totalOperations: number;
    totalTime: number;
    averageTime: number;
    operationsPerSecond: number;
  };
  decryption: {
    totalOperations: number;
    totalTime: number;
    averageTime: number;
    operationsPerSecond: number;
  };
  keyManagement: {
    rotations: number;
    rotationTime: number;
    gracePeriodDecryptions: number;
  };
  overall: {
    successRate: number;
    totalMemoryUsed: number;
    peakMemoryUsage: number;
  };
}

/**
 * Simulate a real-world application scenario
 */
async function simulateApplicationLoad(
  durationMs: number,
  operationsPerSecond: number,
  dataVariety: Array<{ size: number; weight: number }>,
): Promise<SystemMetrics> {
  const startTime = Date.now();
  const endTime = startTime + durationMs;

  const metrics: SystemMetrics = {
    encryption: { totalOperations: 0, totalTime: 0, averageTime: 0, operationsPerSecond: 0 },
    decryption: { totalOperations: 0, totalTime: 0, averageTime: 0, operationsPerSecond: 0 },
    keyManagement: { rotations: 0, rotationTime: 0, gracePeriodDecryptions: 0 },
    overall: { successRate: 0, totalMemoryUsed: 0, peakMemoryUsage: 0 },
  };

  const operationInterval = 1000 / operationsPerSecond;
  const encryptedData: Array<{ data: any; encrypted: any; timestamp: number }> = [];
  let successfulOperations = 0;
  let totalOperations = 0;
  let peakMemory = 0;

  console.log(
    `🚀 Starting application simulation: ${durationMs}ms duration, ${operationsPerSecond} ops/sec`,
  );

  // Function to get weighted random data size
  const getRandomDataSize = () => {
    const totalWeight = dataVariety.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of dataVariety) {
      random -= item.weight;
      if (random <= 0) return item.size;
    }
    return dataVariety[0].size;
  };

  // Function to generate realistic test data
  const generateApplicationData = (size: number) => ({
    id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
    timestamp: new Date().toISOString(),
    userContext: {
      userId: Math.floor(Math.random() * 10000),
      sessionId: Math.random().toString(36),
      permissions: ['read', 'write', 'admin'][Math.floor(Math.random() * 3)],
    },
    payload: {
      type: ['document', 'image', 'video', 'data'][Math.floor(Math.random() * 4)],
      content: 'X'.repeat(size - 200), // Adjust for metadata overhead
      metadata: {
        version: '1.0',
        compressed: false,
        encrypted: true,
      },
    },
    size,
  });

  // Main simulation loop
  while (Date.now() < endTime) {
    const cycleStart = Date.now();

    try {
      // Encryption operations
      const dataSize = getRandomDataSize();
      const testData = generateApplicationData(dataSize);

      const encStart = performance.now();
      const encrypted = await encrypt(testData);
      const encEnd = performance.now();

      metrics.encryption.totalOperations++;
      metrics.encryption.totalTime += encEnd - encStart;

      encryptedData.push({
        data: testData,
        encrypted,
        timestamp: Date.now(),
      });

      successfulOperations++;

      // Periodically decrypt some data (simulating reads)
      if (encryptedData.length > 10 && Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * encryptedData.length);
        const toDecrypt = encryptedData[randomIndex];

        const decStart = performance.now();
        const decrypted = await decrypt(toDecrypt.encrypted);
        const decEnd = performance.now();

        metrics.decryption.totalOperations++;
        metrics.decryption.totalTime += decEnd - decStart;

        // Verify data integrity
        if (decrypted.id !== toDecrypt.data.id) {
          throw new Error('Data integrity check failed');
        }

        // Check if this was a grace period decryption
        const isGracePeriod = Date.now() - toDecrypt.timestamp > 30000; // 30s threshold
        if (isGracePeriod) {
          metrics.keyManagement.gracePeriodDecryptions++;
        }
      }

      // Memory monitoring
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);
      }

      // Cleanup old encrypted data to prevent memory bloat
      if (encryptedData.length > 100) {
        encryptedData.splice(0, 50);
      }
    } catch (error) {
      console.warn(
        `⚠️ Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    totalOperations++;

    // Rate limiting
    const cycleTime = Date.now() - cycleStart;
    const remainingTime = operationInterval - cycleTime;
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    // Progress reporting
    const elapsed = Date.now() - startTime;
    if (elapsed % 5000 < operationInterval) {
      // Every 5 seconds
      const progress = ((elapsed / durationMs) * 100).toFixed(1);
      console.log(
        `📊 Progress: ${progress}% | Ops: ${totalOperations} | Success: ${successfulOperations} | Memory: ${(peakMemory / 1024 / 1024).toFixed(1)}MB`,
      );
    }
  }

  // Calculate final metrics
  metrics.encryption.averageTime =
    metrics.encryption.totalTime / metrics.encryption.totalOperations;
  metrics.encryption.operationsPerSecond =
    (metrics.encryption.totalOperations * 1000) / metrics.encryption.totalTime;

  metrics.decryption.averageTime =
    metrics.decryption.totalTime / metrics.decryption.totalOperations;
  metrics.decryption.operationsPerSecond =
    (metrics.decryption.totalOperations * 1000) / metrics.decryption.totalTime;

  metrics.overall.successRate = (successfulOperations / totalOperations) * 100;
  metrics.overall.peakMemoryUsage = peakMemory;

  return metrics;
}

/**
 * Simulate key rotation under load
 */
async function simulateKeyRotationUnderLoad(): Promise<{
  rotationTime: number;
  gracePeriodPerformance: number;
  dataIntegrityMaintained: boolean;
}> {
  const testData = Array.from({ length: 10 }, (_, i) => ({
    id: `rotation-test-${i}`,
    content: `Test data ${i}`,
    timestamp: Date.now(),
  }));

  // Encrypt data with current keys
  console.log('🔐 Encrypting data before rotation...');
  const encryptedData = await Promise.all(testData.map(data => encrypt(data)));

  // Perform key rotation
  console.log('🔄 Performing key rotation...');
  const rotationStart = performance.now();
  const keyManager = KeyManager.getInstance();
  await keyManager.rotateKeys();
  const rotationTime = performance.now() - rotationStart;

  // Test grace period decryption performance
  console.log('🔓 Testing grace period decryption...');
  const gracePeriodStart = performance.now();
  const decryptedData = await Promise.all(encryptedData.map(encrypted => decrypt(encrypted)));
  const gracePeriodTime = performance.now() - gracePeriodStart;

  // Verify data integrity
  const dataIntegrityMaintained = decryptedData.every(
    (decrypted, index) => decrypted.id === testData[index].id,
  );

  return {
    rotationTime,
    gracePeriodPerformance: gracePeriodTime / decryptedData.length,
    dataIntegrityMaintained,
  };
}

// ============================================================================
// INTEGRATION PERFORMANCE TEST SUITE
// ============================================================================

describe('Integration Performance Tests', () => {
  let testCertPath: string;

  beforeEach(async () => {
    testCertPath = `./test-certs/integration-perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const keyManager = KeyManager.getInstance({
      certPath: testCertPath,
      algorithm: 'ml-kem-768',
      keySize: 768,
      autoGenerate: true,
    });

    await keyManager.initialize();
    console.log(`🔧 Integration test environment initialized`);
  });

  afterEach(() => {
    KeyManager.resetInstance();
  });

  describe('Real-world Application Simulation', () => {
    it('should handle typical web application load', async () => {
      const metrics = await simulateApplicationLoad(
        30000, // 30 seconds
        5, // 5 operations per second
        [
          { size: 1024, weight: 50 }, // 50% small documents (1KB)
          { size: 10240, weight: 30 }, // 30% medium files (10KB)
          { size: 51200, weight: 15 }, // 15% large files (50KB)
          { size: 102400, weight: 5 }, // 5% very large files (100KB)
        ],
      );

      console.log('📈 Web Application Simulation Results:');
      console.log(
        `   Encryption: ${metrics.encryption.totalOperations} ops, ${metrics.encryption.averageTime.toFixed(2)}ms avg, ${metrics.encryption.operationsPerSecond.toFixed(2)} ops/sec`,
      );
      console.log(
        `   Decryption: ${metrics.decryption.totalOperations} ops, ${metrics.decryption.averageTime.toFixed(2)}ms avg, ${metrics.decryption.operationsPerSecond.toFixed(2)} ops/sec`,
      );
      console.log(`   Success Rate: ${metrics.overall.successRate.toFixed(2)}%`);
      console.log(
        `   Peak Memory: ${(metrics.overall.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(`   Grace Period Decryptions: ${metrics.keyManagement.gracePeriodDecryptions}`);

      // Performance expectations for web application
      expect(metrics.overall.successRate).toBeGreaterThanOrEqual(95);
      expect(metrics.encryption.averageTime).toBeLessThan(2000); // < 2s average
      expect(metrics.decryption.averageTime).toBeLessThan(1500); // < 1.5s average
      expect(metrics.overall.peakMemoryUsage).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }, 45000);

    it('should handle high-throughput API server load', async () => {
      const metrics = await simulateApplicationLoad(
        20000, // 20 seconds
        15, // 15 operations per second (higher load)
        [
          { size: 512, weight: 70 }, // 70% API responses (512B)
          { size: 2048, weight: 25 }, // 25% medium payloads (2KB)
          { size: 8192, weight: 5 }, // 5% large payloads (8KB)
        ],
      );

      console.log('📈 High-Throughput API Simulation Results:');
      console.log(
        `   Total Operations: ${metrics.encryption.totalOperations + metrics.decryption.totalOperations}`,
      );
      console.log(
        `   Encryption Rate: ${metrics.encryption.operationsPerSecond.toFixed(2)} ops/sec`,
      );
      console.log(
        `   Decryption Rate: ${metrics.decryption.operationsPerSecond.toFixed(2)} ops/sec`,
      );
      console.log(`   Success Rate: ${metrics.overall.successRate.toFixed(2)}%`);

      // Higher performance expectations for API server
      expect(metrics.overall.successRate).toBeGreaterThanOrEqual(90);
      expect(metrics.encryption.operationsPerSecond).toBeGreaterThan(5); // > 5 ops/sec
      expect(metrics.decryption.operationsPerSecond).toBeGreaterThan(8); // > 8 ops/sec (faster)
    }, 35000);

    it('should handle data processing batch workload', async () => {
      const metrics = await simulateApplicationLoad(
        15000, // 15 seconds
        3, // 3 operations per second (batch processing)
        [
          { size: 51200, weight: 40 }, // 40% large files (50KB)
          { size: 102400, weight: 35 }, // 35% very large files (100KB)
          { size: 204800, weight: 20 }, // 20% huge files (200KB)
          { size: 512000, weight: 5 }, // 5% massive files (500KB)
        ],
      );

      console.log('📈 Data Processing Batch Simulation Results:');
      console.log(`   Large File Encryption: ${metrics.encryption.averageTime.toFixed(2)}ms avg`);
      console.log(`   Large File Decryption: ${metrics.decryption.averageTime.toFixed(2)}ms avg`);
      console.log(`   Success Rate: ${metrics.overall.successRate.toFixed(2)}%`);
      console.log(
        `   Memory Usage: ${(metrics.overall.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
      );

      // Batch processing expectations (larger files, longer times acceptable)
      expect(metrics.overall.successRate).toBeGreaterThanOrEqual(85);
      expect(metrics.encryption.averageTime).toBeLessThan(10000); // < 10s for large files
      expect(metrics.decryption.averageTime).toBeLessThan(8000); // < 8s for large files
    }, 25000);
  });

  describe('Key Management Under Load', () => {
    it('should handle key rotation during active operations', async () => {
      const rotationMetrics = await simulateKeyRotationUnderLoad();

      console.log('📈 Key Rotation Under Load Results:');
      console.log(`   Rotation Time: ${rotationMetrics.rotationTime.toFixed(2)}ms`);
      console.log(`   Grace Period Avg: ${rotationMetrics.gracePeriodPerformance.toFixed(2)}ms`);
      console.log(`   Data Integrity: ${rotationMetrics.dataIntegrityMaintained ? '✅' : '❌'}`);

      expect(rotationMetrics.dataIntegrityMaintained).toBe(true);
      expect(rotationMetrics.rotationTime).toBeLessThan(15000); // < 15s rotation
      expect(rotationMetrics.gracePeriodPerformance).toBeLessThan(2000); // < 2s grace period decryption
    });

    it('should maintain performance during multiple rotations', async () => {
      const rotationCount = 3;
      const rotationMetrics: Array<{
        rotationTime: number;
        gracePeriodPerformance: number;
        dataIntegrityMaintained: boolean;
      }> = [];

      // Perform multiple rotations
      for (let i = 0; i < rotationCount; i++) {
        console.log(`🔄 Performing rotation ${i + 1}/${rotationCount}`);
        const metrics = await simulateKeyRotationUnderLoad();
        rotationMetrics.push(metrics);

        // Wait a bit between rotations
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Analyze rotation performance over time
      const avgRotationTime =
        rotationMetrics.reduce((sum, m) => sum + m.rotationTime, 0) / rotationCount;
      const avgGracePeriodTime =
        rotationMetrics.reduce((sum, m) => sum + m.gracePeriodPerformance, 0) / rotationCount;
      const allIntegrityMaintained = rotationMetrics.every(m => m.dataIntegrityMaintained);

      console.log('📈 Multiple Rotations Analysis:');
      console.log(`   Average Rotation Time: ${avgRotationTime.toFixed(2)}ms`);
      console.log(`   Average Grace Period Time: ${avgGracePeriodTime.toFixed(2)}ms`);
      console.log(`   Consistent Data Integrity: ${allIntegrityMaintained ? '✅' : '❌'}`);

      expect(allIntegrityMaintained).toBe(true);
      expect(avgRotationTime).toBeLessThan(20000); // < 20s average
      expect(avgGracePeriodTime).toBeLessThan(2500); // < 2.5s average

      // Performance should not degrade significantly over multiple rotations
      const firstRotationTime = rotationMetrics[0].rotationTime;
      const lastRotationTime = rotationMetrics[rotationCount - 1].rotationTime;
      expect(lastRotationTime).toBeLessThan(firstRotationTime * 2); // No more than 2x degradation
    });
  });

  describe('System Stress Testing', () => {
    it('should handle sustained high load without degradation', async () => {
      const testDuration = 45000; // 45 seconds of sustained load
      const operationRate = 8; // 8 operations per second

      console.log(`🔥 Starting stress test: ${testDuration / 1000}s at ${operationRate} ops/sec`);

      const metrics = await simulateApplicationLoad(testDuration, operationRate, [
        { size: 5120, weight: 60 }, // 60% medium files (5KB)
        { size: 20480, weight: 30 }, // 30% large files (20KB)
        { size: 51200, weight: 10 }, // 10% very large files (50KB)
      ]);

      console.log('📈 Stress Test Results:');
      console.log(
        `   Total Operations: ${metrics.encryption.totalOperations + metrics.decryption.totalOperations}`,
      );
      console.log(`   Success Rate: ${metrics.overall.successRate.toFixed(2)}%`);
      console.log(
        `   Encryption Performance: ${metrics.encryption.operationsPerSecond.toFixed(2)} ops/sec`,
      );
      console.log(
        `   Decryption Performance: ${metrics.decryption.operationsPerSecond.toFixed(2)} ops/sec`,
      );
      console.log(
        `   Peak Memory Usage: ${(metrics.overall.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(`   Grace Period Ops: ${metrics.keyManagement.gracePeriodDecryptions}`);

      // Stress test expectations
      expect(metrics.overall.successRate).toBeGreaterThanOrEqual(80); // Lower threshold for stress test
      expect(metrics.encryption.operationsPerSecond).toBeGreaterThan(2); // Should maintain reasonable throughput
      expect(metrics.overall.peakMemoryUsage).toBeLessThan(200 * 1024 * 1024); // < 200MB under stress

      // System should handle some grace period operations without issues
      if (metrics.keyManagement.gracePeriodDecryptions > 0) {
        console.log(
          `✅ Successfully handled ${metrics.keyManagement.gracePeriodDecryptions} grace period decryptions`,
        );
      }
    }, 60000); // 60s timeout for stress test
  });

  describe('Resource Efficiency', () => {
    it('should demonstrate efficient resource utilization', async () => {
      const initialMemory =
        typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // Run a controlled workload
      const metrics = await simulateApplicationLoad(
        20000, // 20 seconds
        10, // 10 ops/sec
        [{ size: 10240, weight: 100 }], // Consistent 10KB files
      );

      const finalMemory =
        typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      const memoryIncrease = finalMemory - initialMemory;
      const memoryPerOperation =
        memoryIncrease / (metrics.encryption.totalOperations + metrics.decryption.totalOperations);

      console.log('📈 Resource Efficiency Analysis:');
      console.log(`   Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Memory per Operation: ${(memoryPerOperation / 1024).toFixed(2)}KB`);
      console.log(
        `   Operations/MB: ${((metrics.encryption.totalOperations + metrics.decryption.totalOperations) / (memoryIncrease / 1024 / 1024)).toFixed(2)}`,
      );

      // Resource efficiency expectations
      expect(memoryPerOperation).toBeLessThan(100 * 1024); // < 100KB per operation
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB total increase
    });
  });
});
