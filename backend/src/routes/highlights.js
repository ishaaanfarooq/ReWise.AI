import { Router } from 'express';
import auth from '../middleware/auth.js';
import { validateHighlight, validateObjectId } from '../middleware/validate.js';
import Highlight from '../models/Highlight.js';
import { addHighlightJob } from '../queue/highlightQueue.js';
import logger from '../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(auth);

/**
 * POST /highlights
 * Save a new highlight — immediately persists, then queues for AI processing
 */
router.post('/', validateHighlight, async (req, res, next) => {
  try {
    const { text, sourceUrl, pageTitle } = req.body;

    // Save raw highlight immediately (never lose user data)
    const highlight = await Highlight.create({
      userId: req.userId,
      text,
      sourceUrl,
      pageTitle: pageTitle || '',
      status: 'pending',
    });

    // Queue for async AI processing
    try {
      await addHighlightJob(highlight._id.toString(), text);
      logger.info(`Highlight ${highlight._id} queued for processing`);
    } catch (queueError) {
      // Don't fail the request if queue is down — highlight is still saved
      logger.warn(`Queue unavailable, highlight ${highlight._id} saved but not queued:`, queueError.message);
    }

    res.status(201).json({
      success: true,
      highlight: {
        _id: highlight._id,
        text: highlight.text,
        sourceUrl: highlight.sourceUrl,
        pageTitle: highlight.pageTitle,
        status: highlight.status,
        createdAt: highlight.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /highlights
 * Fetch all highlights for the logged-in user
 * Supports pagination: ?page=1&limit=20&status=processed
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId: req.userId };
    if (req.query.status && ['pending', 'processing', 'processed', 'failed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.tag) {
      filter['aiEnhanced.tags'] = req.query.tag.toLowerCase();
    }

    const [highlights, total] = await Promise.all([
      Highlight.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Highlight.countDocuments(filter),
    ]);

    res.json({
      success: true,
      highlights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /highlights/:id
 * Fetch a single highlight by ID
 */
router.get('/:id', validateObjectId, async (req, res, next) => {
  try {
    const highlight = await Highlight.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!highlight) {
      return res.status(404).json({ success: false, error: 'Highlight not found' });
    }

    res.json({ success: true, highlight });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /highlights/:id
 * Delete a highlight
 */
router.delete('/:id', validateObjectId, async (req, res, next) => {
  try {
    const highlight = await Highlight.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!highlight) {
      return res.status(404).json({ success: false, error: 'Highlight not found' });
    }

    res.json({ success: true, message: 'Highlight deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /highlights/:id/reprocess
 * Re-queue a failed highlight for AI processing
 */
router.post('/:id/reprocess', validateObjectId, async (req, res, next) => {
  try {
    const highlight = await Highlight.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!highlight) {
      return res.status(404).json({ success: false, error: 'Highlight not found' });
    }

    highlight.status = 'pending';
    highlight.lastError = null;
    await highlight.save();

    await addHighlightJob(highlight._id.toString(), highlight.text);

    res.json({ success: true, message: 'Highlight re-queued for processing' });
  } catch (error) {
    next(error);
  }
});

export default router;
