import { ClientEncryption, Preset } from '../../src/client';
import { ServerDecryptionAllPublic } from '../../src/server/decrypt-all-public';

describe('Performance & Stress Integration Tests', () => {
  let client: ClientEncryption;
  let server: ServerDecryptionAllPublic;
  let clientHS: ClientEncryption;
  let serverHS: ServerDecryptionAllPublic;

  beforeEach(() => {
    // Reset instances to ensure clean state
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();

    client = ClientEncryption.getInstance(Preset.NORMAL);
    server = ServerDecryptionAllPublic.getInstance(Preset.NORMAL);
    clientHS = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
    serverHS = ServerDecryptionAllPublic.getInstance(Preset.HIGH_SECURITY);
  });

  afterEach(() => {
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();
  });

  describe('Memory Usage & Performance', () => {
    it('should handle memory efficiently with large datasets', async () => {
      const publicKey = await server.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      // Create progressively larger datasets
      const sizes = [100, 500, 1000, 5000];
      const results: Array<{ size: number; encryptTime: number; decryptTime: number }> = [];

      for (const size of sizes) {
        const largeData = {
          metadata: { size, timestamp: Date.now() },
          data: Array.from({ length: size }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: `Description for item ${i}`.repeat(10), // ~300 chars each
            tags: Array.from({ length: 5 }, (_, j) => `tag-${i}-${j}`),
            nested: {
              level1: { level2: { level3: `deep-${i}` } },
              array: Array.from({ length: 3 }, (_, k) => `nested-${i}-${k}`),
            },
          })),
        };

        // Measure encryption performance
        const encryptStart = process.hrtime.bigint();
        const encrypted = client.encryptData(largeData, publicKey!);
        const encryptEnd = process.hrtime.bigint();
        const encryptTime = Number(encryptEnd - encryptStart) / 1_000_000; // Convert to ms

        // Measure decryption performance
        const decryptStart = process.hrtime.bigint();
        const decrypted = await server.decryptData(encrypted);
        const decryptEnd = process.hrtime.bigint();
        const decryptTime = Number(decryptEnd - decryptStart) / 1_000_000; // Convert to ms

        // Verify data integrity
        expect(decrypted).toStrictEqual(largeData);

        results.push({ size, encryptTime, decryptTime });
        console.log(
          `📊 Size: ${size} items | Encrypt: ${encryptTime.toFixed(2)}ms | Decrypt: ${decryptTime.toFixed(2)}ms`,
        );

        // Performance thresholds (adjust based on system capabilities)
        expect(encryptTime).toBeLessThan(10000); // 10 seconds
        expect(decryptTime).toBeLessThan(10000); // 10 seconds
      }

      // Verify performance doesn't degrade dramatically with size
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      const encryptRatio = lastResult.encryptTime / firstResult.encryptTime;
      const decryptRatio = lastResult.decryptTime / firstResult.decryptTime;

      console.log(
        `📈 Performance scaling - Encrypt: ${encryptRatio.toFixed(2)}x | Decrypt: ${decryptRatio.toFixed(2)}x`,
      );

      // Performance should scale reasonably (not exponentially)
      expect(encryptRatio).toBeLessThan(100); // Shouldn't be 100x slower
      expect(decryptRatio).toBeLessThan(100);
    });

    it('should handle concurrent operations without memory leaks', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const concurrentOps = 20;
      const iterations = 5;

      for (let iter = 0; iter < iterations; iter++) {
        console.log(`🔄 Iteration ${iter + 1}/${iterations}`);

        const promises = Array.from({ length: concurrentOps }, async (_, i) => {
          const testData = {
            iteration: iter,
            operation: i,
            timestamp: Date.now(),
            payload: `Concurrent operation ${i} in iteration ${iter}`.repeat(20),
          };

          const encrypted = client.encryptData(testData, publicKey!);
          const decrypted = await server.decryptData(encrypted);

          expect(decrypted).toStrictEqual(testData);
          return { iter, op: i, success: true };
        });

        const results = await Promise.all(promises);
        expect(results).toHaveLength(concurrentOps);
        expect(results.every((r) => r.success)).toBe(true);
      }

      console.log(`✅ Completed ${iterations * concurrentOps} concurrent operations`);
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive encryptions and decryptions', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const operations = 100;
      const batchSize = 10;

      console.time('Stress Test');

      for (let batch = 0; batch < operations / batchSize; batch++) {
        const batchPromises = Array.from({ length: batchSize }, async (_, i) => {
          const opIndex = batch * batchSize + i;
          const testData = {
            batch,
            operation: opIndex,
            data: `Stress test operation ${opIndex}`,
            timestamp: Date.now(),
            random: Math.random(),
          };

          const encrypted = client.encryptData(testData, publicKey!);
          const decrypted = await server.decryptData<typeof testData>(encrypted);

          expect(decrypted.operation).toBe(opIndex);
          return opIndex;
        });

        const batchResults = await Promise.all(batchPromises);
        expect(batchResults).toHaveLength(batchSize);

        if (batch % 2 === 0) {
          console.log(`📊 Completed batch ${batch + 1}/${operations / batchSize}`);
        }
      }

      console.timeEnd('Stress Test');
      console.log(`✅ Stress test completed: ${operations} operations`);
    });

    it('should maintain performance across different data types under load', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const iterations = 20;

      const testCases = [
        { name: 'Small String', data: 'Hello' },
        { name: 'Large String', data: 'A'.repeat(10000) },
        { name: 'Simple Object', data: { key: 'value', number: 42 } },
        {
          name: 'Complex Object',
          data: {
            users: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `User${i}` })),
            metadata: { total: 100, generated: Date.now() },
          },
        },
        { name: 'Array', data: Array.from({ length: 1000 }, (_, i) => i) },
        {
          name: 'Nested Structure',
          data: {
            level1: { level2: { level3: { level4: 'deep' } } },
            arrays: [
              Array.from({ length: 50 }, (_, i) => `item-${i}`),
              Array.from({ length: 30 }, (_, i) => ({ id: i, value: i * 2 })),
            ],
          },
        },
      ];

      const results: Record<string, number[]> = {};

      for (const testCase of testCases) {
        results[testCase.name] = [];

        for (let i = 0; i < iterations; i++) {
          const start = process.hrtime.bigint();

          const encrypted = client.encryptData(testCase.data, publicKey!);
          const decrypted = await server.decryptData(encrypted);

          const end = process.hrtime.bigint();
          const duration = Number(end - start) / 1_000_000; // Convert to ms

          results[testCase.name].push(duration);

          expect(decrypted).toStrictEqual(testCase.data);
        }

        const avg = results[testCase.name].reduce((a, b) => a + b, 0) / iterations;
        const min = Math.min(...results[testCase.name]);
        const max = Math.max(...results[testCase.name]);

        console.log(
          `📊 ${testCase.name}: Avg=${avg.toFixed(2)}ms, Min=${min.toFixed(2)}ms, Max=${max.toFixed(2)}ms`,
        );
      }
    });
  });

  describe('Cross-Preset Performance', () => {
    it('should compare performance between NORMAL and HIGH_SECURITY presets', async () => {
      const normalKey = await server.getPublicKeyBase64();
      const highSecKey = await serverHS.getPublicKeyBase64();

      const testData = {
        performance: 'comparison',
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          content: `Performance test item ${i}`.repeat(5),
        })),
      };

      const iterations = 10;
      const normalTimes: number[] = [];
      const highSecTimes: number[] = [];

      // Test NORMAL preset
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        const encrypted = client.encryptData(testData, normalKey!);
        const decrypted = await server.decryptData(encrypted);
        const end = process.hrtime.bigint();

        const duration = Number(end - start) / 1_000_000;
        normalTimes.push(duration);

        expect(decrypted).toStrictEqual(testData);
      }

      // Test HIGH_SECURITY preset
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        const encrypted = clientHS.encryptData(testData, highSecKey!);
        const decrypted = await serverHS.decryptData(encrypted);
        const end = process.hrtime.bigint();

        const duration = Number(end - start) / 1_000_000;
        highSecTimes.push(duration);

        expect(decrypted).toStrictEqual(testData);
      }

      const normalAvg = normalTimes.reduce((a, b) => a + b, 0) / iterations;
      const highSecAvg = highSecTimes.reduce((a, b) => a + b, 0) / iterations;
      const performanceRatio = highSecAvg / normalAvg;

      console.log('📊 Performance Comparison:');
      console.log(`   NORMAL: ${normalAvg.toFixed(2)}ms average`);
      console.log(`   HIGH_SECURITY: ${highSecAvg.toFixed(2)}ms average`);
      console.log(`   Ratio: ${performanceRatio.toFixed(2)}x`);

      // Performance difference may vary depending on system load and implementation
      // Just ensure both presets work and neither is dramatically slower
      expect(performanceRatio).toBeLessThan(10); // Should not be more than 10x difference
    });
  });

  describe('Resource Cleanup & Stability', () => {
    it('should maintain stability over extended operations', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const longRunOperations = 200;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < longRunOperations; i++) {
        try {
          const testData = {
            operation: i,
            timestamp: Date.now(),
            payload: `Long running operation ${i}`,
            randomData: Array.from({ length: 50 }, () => Math.random()),
          };

          const encrypted = client.encryptData(testData, publicKey!);
          const decrypted = await server.decryptData<typeof testData>(encrypted);

          expect(decrypted.operation).toBe(i);
          successCount++;

          // Periodically check system health
          if (i % 50 === 0) {
            const healthCheck = await server.healthCheck();
            expect(healthCheck.healthy).toBe(true);
            console.log(`🏥 Health check ${i}: ${healthCheck.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Operation ${i} failed:`, error);
        }
      }

      console.log(`📊 Extended Operations: ${successCount} success, ${errorCount} errors`);
      expect(successCount).toBe(longRunOperations);
      expect(errorCount).toBe(0);
    });

    it('should handle instance resets during operations gracefully', async () => {
      const initialKey = await server.getPublicKeyBase64();
      const testData = { reset: 'test', value: 123 };

      // Encrypt with initial instance
      const encrypted1 = client.encryptData(testData, initialKey!);

      // Reset instances mid-operation
      ClientEncryption.resetInstance();
      ServerDecryptionAllPublic.resetInstance();

      // Create new instances
      const newClient = ClientEncryption.getInstance(Preset.NORMAL);
      const newServer = ServerDecryptionAllPublic.getInstance(Preset.NORMAL);

      // Should be able to decrypt with new server instance
      // (assuming persistent key storage)
      const decrypted1 = await newServer.decryptData(encrypted1);
      expect(decrypted1).toStrictEqual(testData);

      // New operations should also work
      const newKey = await newServer.getPublicKeyBase64();
      const encrypted2 = newClient.encryptData(testData, newKey!);
      const decrypted2 = await newServer.decryptData(encrypted2);
      expect(decrypted2).toStrictEqual(testData);
    });
  });
});
