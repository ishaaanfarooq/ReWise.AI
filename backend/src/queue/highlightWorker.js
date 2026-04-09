import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { createRedisConnection } from './connection.js';
import Highlight from '../models/Highlight.js';
import aiService from '../services/aiService.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;

/**
 * Start the highlight processing worker
 * This runs as a separate process: `npm run worker`
 */
async function startWorker() {
  // Connect to MongoDB
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Worker connected to MongoDB');
  } catch (error) {
    logger.error('Worker MongoDB connection failed:', error.message);
    process.exit(1);
  }

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

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down worker...`);
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('🚀 Highlight processing worker started');
}

startWorker().catch((error) => {
  logger.error('Worker startup failed:', error);
  process.exit(1);
});
