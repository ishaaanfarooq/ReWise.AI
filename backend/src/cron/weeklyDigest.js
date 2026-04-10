import cron from 'node-cron';
import User from '../models/User.js';
import Highlight from '../models/Highlight.js';
import { generateDigest } from '../services/aiService.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Weekly Digest Cron Job
 * Runs every Sunday at 9:00 AM
 * Fetches processed highlights per user and sends a digest email
 */
export function setupCronJobs() {
  // Every Sunday at 9:00 AM
  cron.schedule('0 9 * * 0', async () => {
    logger.info('🕘 Weekly digest cron started');

    try {
      // Get all users with weekly digest enabled
      const users = await User.find({ 'preferences.weeklyDigest': true }).lean();
      logger.info(`Processing digests for ${users.length} users`);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const user of users) {
        try {
          // Fetch this user's processed highlights from the last week
          const highlights = await Highlight.find({
            userId: user._id,
            status: 'processed',
            createdAt: { $gte: oneWeekAgo },
          })
            .sort({ createdAt: -1 })
            .lean();

          if (highlights.length === 0) {
            logger.debug(`No highlights for ${user.email}, skipping`);
            continue;
          }

          // Group by tags
          const tagGroups = {};
          for (const h of highlights) {
            const tags = h.aiEnhanced?.tags || ['uncategorized'];
            for (const tag of tags) {
              if (!tagGroups[tag]) tagGroups[tag] = [];
              tagGroups[tag].push(h);
            }
          }

          // Generate AI digest
          let aiDigest = null;
          try {
            const highlightData = highlights.map((h) => ({
              text: h.text,
              summary: h.aiEnhanced?.summary || '',
              tags: h.aiEnhanced?.tags || [],
            }));
            aiDigest = await generateDigest(highlightData);
          } catch (aiErr) {
            logger.warn(`AI digest failed for ${user.email}:`, aiErr.message);
          }

          // Send email
          await emailService.sendWeeklyDigest(user.email, user.name, {
            totalHighlights: highlights.length,
            tagGroups,
            aiDigest,
            period: {
              from: oneWeekAgo.toISOString(),
              to: new Date().toISOString(),
            },
          });
        } catch (userError) {
          logger.error(`Digest failed for ${user.email}:`, userError.message);
        }
      }

      logger.info('✅ Weekly digest cron completed');
    } catch (error) {
      logger.error('Weekly digest cron error:', error.message);
    }
  });

  logger.info('📅 Cron jobs scheduled: Weekly digest every Sunday at 9:00 AM');
}
