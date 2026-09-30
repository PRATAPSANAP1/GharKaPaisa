const { Queue, Worker, Job } = require('bullmq');
const { createClient } = require('redis');
const logger = require('../../config/logger');

/**
 * BullMQ Queue Service for Async Verification Processing
 * 
 * Handles traffic spikes by queuing verification requests:
 * - Redis-backed queue for reliability
 * - Priority-based job processing
 * - Automatic retry with exponential backoff
 * - Dead letter queue for failed jobs
 */
class BullQueueService {
  constructor() {
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    };

    this.queueConfig = {
      connection: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 3600, // 1 hour
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
          age: 86400, // 24 hours
        },
      },
    };

    this.queues = {};
    this.workers = {};
  }

  /**
   * Initialize queue for verification processing
   */
  async initializeVerificationQueue() {
    try {
      // Create Redis connection
      this.redisConnection = createClient(this.redisConfig);
      await this.redisConnection.connect();

      // Create verification queue
      this.queues.verification = new Queue('attendance-verification', this.queueConfig);

      logger.info('[BULLMQ] Verification queue initialized');

      return {
        success: true,
        queueName: 'attendance-verification',
      };
    } catch (err) {
      logger.error('[BULLMQ] Failed to initialize queue:', err.message);
      return {
        success: false,
        reason: 'INITIALIZATION_FAILED',
      };
    }
  }

  /**
   * Add verification job to queue
   */
  async addVerificationJob(jobData, options = {}) {
    try {
      if (!this.queues.verification) {
        await this.initializeVerificationQueue();
      }

      const job = await this.queues.verification.add(
        'verify-attendance',
        jobData,
        {
          priority: options.priority || 5, // 1-10, lower is higher priority
          delay: options.delay || 0,
          ...options,
        }
      );

      logger.info(`[BULLMQ] Added verification job ${job.id} with priority ${options.priority || 5}`);

      return {
        success: true,
        jobId: job.id,
        queuePosition: await this.getQueuePosition(job.id),
      };
    } catch (err) {
      logger.error('[BULLMQ] Failed to add job:', err.message);
      return {
        success: false,
        reason: 'ADD_JOB_FAILED',
      };
    }
  }

  /**
   * Get queue position for a job
   */
  async getQueuePosition(jobId) {
    try {
      const waiting = await this.queues.verification.getWaiting();
      const position = waiting.findIndex(job => job.id === jobId);
      return position >= 0 ? position + 1 : 0;
    } catch (err) {
      logger.error('[BULLMQ] Failed to get queue position:', err.message);
      return -1;
    }
  }

  /**
   * Start worker for processing verification jobs
   */
  async startVerificationWorker(processor) {
    try {
      if (this.workers.verification) {
        logger.warn('[BULLMQ] Verification worker already running');
        return {
          success: true,
          message: 'Worker already running',
        };
      }

      this.workers.verification = new Worker(
        'attendance-verification',
        async (job) => {
          logger.info(`[BULLMQ] Processing job ${job.id}`);
          
          try {
            const result = await processor(job.data);
            
            logger.info(`[BULLMQ] Job ${job.id} completed successfully`);
            return result;
          } catch (err) {
            logger.error(`[BULLMQ] Job ${job.id} failed:`, err.message);
            throw err;
          }
        },
        {
          connection: this.redisConnection,
          concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
          limiter: {
            max: 10,
            duration: 1000, // 10 jobs per second
          },
        }
      );

      this.workers.verification.on('completed', (job) => {
        logger.info(`[BULLMQ] Worker completed job ${job.id}`);
      });

      this.workers.verification.on('failed', (job, err) => {
        logger.error(`[BULLMQ] Worker failed job ${job.id}:`, err.message);
      });

      this.workers.verification.on('error', (err) => {
        logger.error('[BULLMQ] Worker error:', err.message);
      });

      logger.info('[BULLMQ] Verification worker started');

      return {
        success: true,
        concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
      };
    } catch (err) {
      logger.error('[BULLMQ] Failed to start worker:', err.message);
      return {
        success: false,
        reason: 'WORKER_START_FAILED',
      };
    }
  }

  /**
   * Stop worker
   */
  async stopVerificationWorker() {
    try {
      if (this.workers.verification) {
        await this.workers.verification.close();
        this.workers.verification = null;
        logger.info('[BULLMQ] Verification worker stopped');
      }

      return {
        success: true,
      };
    } catch (err) {
      logger.error('[BULLMQ] Failed to stop worker:', err.message);
      return {
        success: false,
        reason: 'WORKER_STOP_FAILED',
      };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      if (!this.queues.verification) {
        return {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        };
      }

      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        this.queues.verification.getWaitingCount(),
        this.queues.verification.getActiveCount(),
        this.queues.verification.getCompletedCount(),
        this.queues.verification.getFailedCount(),
        this.queues.verification.getDelayedCount(),
        this.queues.verification.getPausedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
        total: waiting + active + delayed,
      };
    } catch (err) {
      logger.error('[BULLMQ] Failed to get queue stats:', err.message);
      return null;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue() {
    try {
      if (this.queues.verification) {
        await this.queues.verification.pause();
        logger.info('[BULLMQ] Queue paused');
      }

      return { success: true };
    } catch (err) {
      logger.error('[BULLMQ] Failed to pause queue:', err.message);
      return { success: false };
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    try {
      if (this.queues.verification) {
        await this.queues.verification.resume();
        logger.info('[BULLMQ] Queue resumed');
      }

      return { success: true };
    } catch (err) {
      logger.error('[BULLMQ] Failed to resume queue:', err.message);
      return { success: false };
    }
  }

  /**
   * Clean up queue
   */
  async cleanQueue(grace = 5000) {
    try {
      if (this.queues.verification) {
        await this.queues.verification.clean(grace, 'completed');
        await this.queues.verification.clean(grace, 'failed');
        logger.info('[BULLMQ] Queue cleaned');
      }

      return { success: true };
    } catch (err) {
      logger.error('[BULLMQ] Failed to clean queue:', err.message);
      return { success: false };
    }
  }

  /**
   * Drain queue (remove all jobs)
   */
  async drainQueue() {
    try {
      if (this.queues.verification) {
        await this.queues.verification.drain();
        logger.info('[BULLMQ] Queue drained');
      }

      return { success: true };
    } catch (err) {
      logger.error('[BULLMQ] Failed to drain queue:', err.message);
      return { success: false };
    }
  }

  /**
   * Close all connections
   */
  async close() {
    try {
      await this.stopVerificationWorker();
      
      if (this.queues.verification) {
        await this.queues.verification.close();
        this.queues.verification = null;
      }

      if (this.redisConnection) {
        await this.redisConnection.quit();
        this.redisConnection = null;
      }

      logger.info('[BULLMQ] All connections closed');
    } catch (err) {
      logger.error('[BULLMQ] Failed to close connections:', err.message);
    }
  }
}

module.exports = new BullQueueService();
