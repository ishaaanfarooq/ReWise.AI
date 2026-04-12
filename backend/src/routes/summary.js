import { Router } from 'express';
import auth from '../middleware/auth.js';
import Highlight from '../models/Highlight.js';
import { generateDigest } from '../services/aiService.js';
import logger from '../utils/logger.js';

const router = Router();

router.use(auth);

/**
 * GET /summary/weekly
 * Generate weekly digest for the logged-in user
 */
router.get('/weekly', async (req, res, next) => {
  try {
    // Get highlights from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const highlights = await Highlight.find({
      userId: req.userId,
      status: 'processed',
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (highlights.length === 0) {
      return res.json({
        success: true,
        summary: null,
        message: 'No processed highlights found for the past week.',
      });
    }

    // Group by tags
    const tagGroups = {};
    const untagged = [];

    for (const h of highlights) {
      const tags = h.aiEnhanced?.tags || [];
      if (tags.length === 0) {
        untagged.push(h);
      } else {
        for (const tag of tags) {
          if (!tagGroups[tag]) tagGroups[tag] = [];
          tagGroups[tag].push(h);
        }
      }
    }

    // Try to generate an AI digest
    let aiDigest = null;
    try {
      const highlightTexts = highlights.map((h) => ({
        text: h.text,
        summary: h.aiEnhanced?.summary || '',
        tags: h.aiEnhanced?.tags || [],
      }));
      aiDigest = await generateDigest(highlightTexts);
    } catch (aiError) {
      logger.warn('AI digest generation failed, returning raw grouping:', aiError.message);
    }

    res.json({
      success: true,
      summary: {
        period: {
          from: oneWeekAgo.toISOString(),
          to: new Date().toISOString(),
        },
        totalHighlights: highlights.length,
        tagGroups,
        untagged,
        aiDigest,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /summary/stats
 * Quick stats for the user dashboard
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [total, processed, pending, failed] = await Promise.all([
      Highlight.countDocuments({ userId: req.userId }),
      Highlight.countDocuments({ userId: req.userId, status: 'processed' }),
      Highlight.countDocuments({ userId: req.userId, status: 'pending' }),
      Highlight.countDocuments({ userId: req.userId, status: 'failed' }),
    ]);

    // Get top tags
    const topTags = await Highlight.aggregate([
      { $match: { userId: req.userId, status: 'processed' } },
      { $unwind: '$aiEnhanced.tags' },
      { $group: { _id: '$aiEnhanced.tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        processed,
        pending,
        failed,
        topTags: topTags.map((t) => ({ tag: t._id, count: t.count })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /summary/test-digest
 * Immediately sends a weekly digest email for testing
 * Uses all processed highlights (not just last 7 days) if recent ones are empty
 */
router.post('/test-digest', async (req, res, next) => {
  try {
    // Get the user's info
    const User = (await import('../models/User.js')).default;
    const emailService = (await import('../services/emailService.js')).default;

    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Try last 7 days first, fallback to all processed highlights
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let highlights = await Highlight.find({
      userId: req.userId,
      status: 'processed',
      createdAt: { $gte: oneWeekAgo },
    }).sort({ createdAt: -1 }).lean();

    // If no recent highlights, grab all processed ones for testing
    if (highlights.length === 0) {
      highlights = await Highlight.find({
        userId: req.userId,
        status: 'processed',
      }).sort({ createdAt: -1 }).limit(20).lean();
    }

    if (highlights.length === 0) {
      return res.json({
        success: false,
        message: 'No processed highlights found. Highlight some text first and wait for AI processing to complete.',
      });
    }

    // Group by tags
    const tagGroups = {};
    for (const h of highlights) {
      const tags = h.aiEnhanced?.tags?.length > 0 ? h.aiEnhanced.tags : ['Uncategorized'];
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
      logger.warn('AI digest failed for test:', aiErr.message);
    }

    // Send immediately
    const result = await emailService.sendWeeklyDigest(user.email, user.name, {
      totalHighlights: highlights.length,
      tagGroups,
      aiDigest,
      period: {
        from: oneWeekAgo.toISOString(),
        to: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: result
        ? `✅ Test digest sent to ${user.email}! Check your inbox (or spam folder).`
        : '⚠️ Email service not configured. Check SMTP settings in .env.',
      highlightsIncluded: highlights.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
