import { Redis } from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Create a Redis connection for BullMQ.
 * BullMQ workers require maxRetriesPerRequest: null
 */
export function createRedisConnection() {
  const connection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
  });

  connection.on('connect', () => logger.info('Redis connected'));
  connection.on('error', (err) => logger.error('Redis error:', err.message));

  return connection;
}

export default createRedisConnection;
