import { 
  matchingQueue, 
  reminderQueue, 
  notificationQueue
} from '@random-coffee/shared';
import { logger } from '../lib/logger.js';

// Setup daily matching cron job
export async function setupDailyMatchingCron() {
  try {
    if (!matchingQueue) {
      logger.warn('Matching queue not available, skipping cron setup');
      return;
    }
    
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
    if (!reminderQueue) {
      logger.warn('Reminder queue not available, skipping reminder');
      return;
    }
    
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
    if (!notificationQueue) {
      logger.warn('Notification queue not available, skipping notification');
      return;
    }
    
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

    if (matchingQueue) await matchingQueue.close();
    if (reminderQueue) await reminderQueue.close();
    if (notificationQueue) await notificationQueue.close();

    logger.info('Queues shut down gracefully');

  } catch (error) {
    logger.error(error, 'Error shutting down queues');
  }
}

// Note: Queue health check is available from @random-coffee/shared package