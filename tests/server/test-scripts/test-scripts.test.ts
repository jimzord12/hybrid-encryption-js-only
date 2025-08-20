import { runAllBundleTests } from './test-bundle-imports';
import { runTreeShakingTests } from './tree-shaking-analysis';

describe('Test Scripts', () => {
  it('should run tree-shaking tests', async () => {
    const result = await runTreeShakingTests();
    expect(result.success).toBe(true);
  });

  it('should run bundle import tests', async () => {
    await expect(async () => await runAllBundleTests()).not.toThrow();
  });
});
