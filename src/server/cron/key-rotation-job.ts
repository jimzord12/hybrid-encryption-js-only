import cron from 'node-cron';
import { KeyManager } from '../../core';

export const registerRotationJob = (weeks = 3) => {
  const days = weeks * 7;
  const cronExpression = `0 0 */${days} * *`;

  cron.schedule(
    cronExpression,
    async () => {
      try {
        console.log(`Running key rotation job every ${weeks} weeks at:`, new Date().toISOString());
        const keyManager = KeyManager.getInstance();
        await keyManager.rotateKeys();
        console.log('Key rotation completed successfully');
      } catch (error) {
        console.error('Key rotation failed:', error);
      }
    },
    {
      name: 'Key Rotation Job',
      timezone: 'UTC',
    },
  );
};

export const registerRotationJob_TEST = (intervalSeconds = 2) => {
  const cronExpression = `*/${intervalSeconds} * * * * *`; // Every X seconds

  console.log(`Test: Scheduling key rotation every ${intervalSeconds} seconds`);

  return cron.schedule(
    cronExpression,
    async () => {
      try {
        console.log('TEST: Running key rotation job at:', new Date().toISOString());
        const keyManager = KeyManager.getInstance();
        await keyManager.rotateKeys();
        console.log('TEST: Key rotation completed successfully');
      } catch (error) {
        console.error('TEST: Key rotation failed:', error);
      }
    },
    {
      name: `Test Key Rotation Job (every ${intervalSeconds}s)`,
      timezone: 'UTC',
    },
  );
};
