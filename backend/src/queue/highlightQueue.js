import { Queue } from 'bullmq';
import { createRedisConnection } from './connection.js';
import logger from '../utils/logger.js';

let highlightQueue = null;

/**
 * Get or create the highlight processing queue
 */
function getQueue() {
  if (!highlightQueue) {
    try {
      const connection = createRedisConnection();
      highlightQueue = new Queue('highlight-processing', {
        connection,
        defaultJobOptions: {
          removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
          removeOnFail: { count: 50 },      // Keep last 50 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });
      logger.info('Highlight queue initialized');
    } catch (error) {
      logger.error('Failed to initialize highlight queue:', error.message);
      throw error;
    }
  }
  return highlightQueue;
}

/**
 * Add a highlight to the processing queue
 * @param {string} highlightId - MongoDB document ID
 * @param {string} text - The highlighted text to process
 */
export async function addHighlightJob(highlightId, text) {
  const queue = getQueue();
  const job = await queue.add(
    'process-highlight',
    { highlightId, text },
    {
      jobId: `highlight-${highlightId}`, // Prevent duplicate jobs
      priority: 1,
    }
  );
  logger.debug(`Job ${job.id} added for highlight ${highlightId}`);
  return job;
}

/**
 * Get queue health metrics
 */
export async function getQueueStats() {
  const queue = getQueue();
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
}

export default getQueue;
