import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Type declarations for Node.js globals
declare var process: {
  env: { [key: string]: string | undefined };
};
declare var console: {
  error: (...args: any[]) => void;
};

// Avoid connecting during build time
const createConnection = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required in production');
  }
  
  // Don't create connection during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  
  return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

const connection = createConnection();

// Create queues conditionally
export const matchingQueue = connection ? new Queue('daily-matching', { 
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
}) : null;

// Reminders queue  
export const reminderQueue = connection ? new Queue('reminders', {
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
}) : null;

// Notifications queue
export const notificationQueue = connection ? new Queue('notifications', {
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
}) : null;

// Note: QueueScheduler is deprecated in BullMQ v4+
// Delayed jobs now work automatically with Queue instances

// Health check
export async function getQueuesHealth() {
  try {
    if (!matchingQueue || !reminderQueue || !notificationQueue) {
      return { error: 'Queues not initialized' };
    }

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