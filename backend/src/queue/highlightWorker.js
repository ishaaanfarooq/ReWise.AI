import { Worker } from 'bullmq';
import { createRedisConnection } from './connection.js';
import Highlight from '../models/Highlight.js';
import aiService from '../services/aiService.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;

/**
 * Start the highlight processing worker
 */
export async function startWorker() {
  const connection = createRedisConnection();

  const worker = new Worker(
    'highlight-processing',
    async (job) => {
      const { highlightId, text } = job.data;
      logger.info(`Processing highlight ${highlightId} (attempt ${job.attemptsMade + 1})`);

      // Update status to processing
      await Highlight.findByIdAndUpdate(highlightId, { status: 'processing' });

      try {
        // Run AI pipeline
        const aiResult = await aiService.processHighlight(text);

        // Update highlight with AI results
        await Highlight.findByIdAndUpdate(highlightId, {
          status: 'processed',
          aiEnhanced: {
            summary: aiResult.summary,
            explanation: aiResult.explanation,
            example: aiResult.example,
            tags: aiResult.tags,
            difficulty: aiResult.difficulty,
          },
          lastError: null,
        });

        logger.info(`Highlight ${highlightId} processed successfully`);
        return { success: true, highlightId };
      } catch (error) {
        // Update with error info
        await Highlight.findByIdAndUpdate(highlightId, {
          status: job.attemptsMade + 1 >= MAX_RETRIES ? 'failed' : 'pending',
          lastError: error.message,
          $inc: { retryCount: 1 },
        });

        throw error; // Let BullMQ handle retry
      }
    },
    {
      connection,
      concurrency: 3, // Process 3 highlights simultaneously
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute (respects API rate limits)
      },
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    logger.error('Worker error:', error.message);
  });

  logger.info('🚀 Highlight processing worker initialized');

  return worker;
}
