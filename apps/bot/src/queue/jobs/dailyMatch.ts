import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runDailyMatching } from '../../services/pairing.js';
import { logger } from '../../lib/logger.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const dailyMatchWorker = new Worker(
  'daily-matching',
  async (job: Job) => {
    const startTime = Date.now();
    const { timezone } = job.data;
    
    logger.info({ jobId: job.id, timezone }, 'Starting daily matching job');

    try {
      await runDailyMatching(timezone);
      
      const duration = Date.now() - startTime;
      logger.info({ 
        jobId: job.id, 
        timezone, 
        duration 
      }, 'Daily matching completed successfully');

      return { 
        success: true, 
        timezone, 
        duration,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({ 
        jobId: job.id, 
        timezone, 
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Daily matching failed');

      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Allow 2 timezone matching jobs to run concurrently
    limiter: {
      max: 5,
      duration: 60000, // Max 5 jobs per minute
    }
  }
);

// Handle job events
dailyMatchWorker.on('completed', (job, result) => {
  logger.info({ 
    jobId: job.id, 
    result 
  }, 'Daily matching job completed');
});

dailyMatchWorker.on('failed', (job, err) => {
  logger.error({ 
    jobId: job?.id, 
    error: err instanceof Error ? err.message : 'Unknown error',
    data: job?.data
  }, 'Daily matching job failed');
});

dailyMatchWorker.on('stalled', (jobId) => {
  logger.warn({ jobId }, 'Daily matching job stalled');
});

dailyMatchWorker.on('error', (err) => {
  logger.error(err, 'Daily matching worker error');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down daily match worker...');
  await dailyMatchWorker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down daily match worker...');
  await dailyMatchWorker.close();
  await connection.quit();
  process.exit(0);
});