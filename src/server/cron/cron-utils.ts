import nodeCron from 'node-cron';

export const isJobScheduled = (jobName: string) => {
  const tasks = nodeCron.getTasks();
  const taskNames = Array.from(tasks.values()).map((task) => task.name);

  return taskNames.includes(jobName);
};
