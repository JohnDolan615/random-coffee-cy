import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../lib/logger.js';

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

// Setup daily matching cron job
export async function setupDailyMatchingCron() {
  try {
    // Remove existing cron jobs
    await matchingQueue.obliterate({ force: true });
    
    // Schedule daily matching for different timezones
    const timezones = [
      'Europe/London',
      'Europe/Berlin', 
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney'
    ];

    for (const timezone of timezones) {
      await matchingQueue.add(
        'daily-match',
        { timezone },
        {
          repeat: {
            pattern: '0 9 * * *', // 9 AM daily
            tz: timezone
          },
          jobId: `daily-match-${timezone}`
        }
      );
    }

    logger.info({ timezones }, 'Daily matching cron jobs scheduled');

  } catch (error) {
    logger.error(error, 'Error setting up daily matching cron');
    throw error;
  }
}

// Schedule a reminder
export async function scheduleReminder(
  pairingId: string,
  scheduledAt: Date,
  type: 'initial' | '48h' | 'day_of'
) {
  try {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    
    await reminderQueue.add(
      'pairing-reminder',
      { pairingId, type },
      {
        delay,
        jobId: `reminder-${pairingId}-${type}`
      }
    );

    logger.info({ pairingId, type, scheduledAt }, 'Reminder scheduled');

  } catch (error) {
    logger.error(error, 'Error scheduling reminder');
  }
}

// Schedule a notification
export async function scheduleNotification(
  userId: string,
  type: string,
  data: any,
  delayMs: number = 0
) {
  try {
    await notificationQueue.add(
      type,
      { userId, ...data },
      {
        delay: delayMs,
        jobId: `${type}-${userId}-${Date.now()}`
      }
    );

    logger.info({ userId, type, delayMs }, 'Notification scheduled');

  } catch (error) {
    logger.error(error, 'Error scheduling notification');
  }
}

// Graceful shutdown
export async function shutdown() {
  try {
    logger.info('Shutting down queues...');

    await matchingScheduler.close();
    await reminderScheduler.close(); 
    await notificationScheduler.close();

    await matchingQueue.close();
    await reminderQueue.close();
    await notificationQueue.close();

    await connection.quit();

    logger.info('Queues shut down gracefully');

  } catch (error) {
    logger.error(error, 'Error shutting down queues');
  }
}

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
    logger.error(error, 'Error getting queue health');
    return { error: 'Unable to get queue health' };
  }
}