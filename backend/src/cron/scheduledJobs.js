import { setupCronJobs } from './weeklyDigest.js';
import { startWorker } from '../queue/highlightWorker.js';
import logger from '../utils/logger.js';

let workerInstance = null;

/**
 * Initialize all background services (crons and workers)
 */
export async function initBackgroundServices() {
  try {
    // 1. Setup Crons
    setupCronJobs();
    
    // 2. Start BullMQ Worker
    workerInstance = await startWorker();
    
    logger.info('✅ All background services initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize background services:', error.message);
    throw error;
  }
}

/**
 * Gracefully shut down background services
 */
export async function shutdownBackgroundServices() {
  if (workerInstance) {
    logger.info('Closing background worker...');
    await workerInstance.close();
  }
}
