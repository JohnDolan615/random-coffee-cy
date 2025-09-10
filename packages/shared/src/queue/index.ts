import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// Daily matching queue
export const matchingQueue = new Queue('daily-matching', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    }
  }
});

// Reminders queue  
export const reminderQueue = new Queue('reminders', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 50,
    attempts: 5,
    backoff: {
      type: 'exponential', 
      delay: 5000,
    }
  }
});

// Notifications queue
export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    }
  }
});

// Queue schedulers (required for delayed jobs)
export const matchingScheduler = new QueueScheduler('daily-matching', { connection });
export const reminderScheduler = new QueueScheduler('reminders', { connection });
export const notificationScheduler = new QueueScheduler('notifications', { connection });

// Health check
export async function getQueuesHealth() {
  try {
    const matchingStats = {
      waiting: await matchingQueue.getWaiting(),
      active: await matchingQueue.getActive(),
      completed: await matchingQueue.getCompleted(),
      failed: await matchingQueue.getFailed()
    };

    const reminderStats = {
      waiting: await reminderQueue.getWaiting(),
      active: await reminderQueue.getActive(),
      completed: await reminderQueue.getCompleted(),
      failed: await reminderQueue.getFailed()
    };

    const notificationStats = {
      waiting: await notificationQueue.getWaiting(),
      active: await notificationQueue.getActive(),
      completed: await notificationQueue.getCompleted(),
      failed: await notificationQueue.getFailed()
    };

    return {
      matching: {
        waiting: matchingStats.waiting.length,
        active: matchingStats.active.length,
        completed: matchingStats.completed.length,
        failed: matchingStats.failed.length
      },
      reminders: {
        waiting: reminderStats.waiting.length,
        active: reminderStats.active.length,
        completed: reminderStats.completed.length,
        failed: reminderStats.failed.length
      },
      notifications: {
        waiting: notificationStats.waiting.length,
        active: notificationStats.active.length,
        completed: notificationStats.completed.length,
        failed: notificationStats.failed.length
      }
    };

  } catch (error) {
    console.error('Error getting queue health:', error);
    return { error: 'Unable to get queue health' };
  }
}