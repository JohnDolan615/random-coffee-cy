import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Type declarations for Node.js globals
declare var process: {
  env: { [key: string]: string | undefined };
};
declare var console: {
  error: (...args: any[]) => void;
};
declare var window: any;

// Avoid connecting during build time
const createConnection = () => {
  // Don't create connection during build or if we're in a browser/edge environment
  if (process.env.NEXT_PHASE === 'phase-production-build' ||
      typeof window !== 'undefined' ||
      process.env.NEXT_RUNTIME === 'edge') {
    return null;
  }

  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required in production');
  }

  return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

let connection: IORedis | null = null;

// Lazy initialization
const getConnection = () => {
  if (connection === undefined) {
    connection = createConnection();
  }
  return connection;
};

// Lazy queue initialization
let _matchingQueue: Queue | null = null;
let _reminderQueue: Queue | null = null;
let _notificationQueue: Queue | null = null;

export const matchingQueue = {
  get instance() {
    if (!_matchingQueue) {
      const conn = getConnection();
      _matchingQueue = conn ? new Queue('daily-matching', {
        connection: conn,
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
    }
    return _matchingQueue;
  }
};

export const reminderQueue = {
  get instance() {
    if (!_reminderQueue) {
      const conn = getConnection();
      _reminderQueue = conn ? new Queue('reminders', {
        connection: conn,
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
    }
    return _reminderQueue;
  }
};

export const notificationQueue = {
  get instance() {
    if (!_notificationQueue) {
      const conn = getConnection();
      _notificationQueue = conn ? new Queue('notifications', {
        connection: conn,
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
    }
    return _notificationQueue;
  }
};

// Note: QueueScheduler is deprecated in BullMQ v4+
// Delayed jobs now work automatically with Queue instances

// Health check
export async function getQueuesHealth() {
  try {
    const matching = matchingQueue.instance;
    const reminder = reminderQueue.instance;
    const notification = notificationQueue.instance;

    if (!matching || !reminder || !notification) {
      return { error: 'Queues not initialized' };
    }

    const matchingStats = {
      waiting: await matching.getWaiting(),
      active: await matching.getActive(),
      completed: await matching.getCompleted(),
      failed: await matching.getFailed()
    };

    const reminderStats = {
      waiting: await reminder.getWaiting(),
      active: await reminder.getActive(),
      completed: await reminder.getCompleted(),
      failed: await reminder.getFailed()
    };

    const notificationStats = {
      waiting: await notification.getWaiting(),
      active: await notification.getActive(),
      completed: await notification.getCompleted(),
      failed: await notification.getFailed()
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