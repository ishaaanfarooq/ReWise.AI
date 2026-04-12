import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import config from './config/index.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import highlightRoutes from './routes/highlights.js';
import summaryRoutes from './routes/summary.js';
import { initBackgroundServices, shutdownBackgroundServices } from './cron/scheduledJobs.js';

const app = express();

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts in auth pages
}));

// ─── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'chrome-extension://*',
    config.frontendUrl,
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many login attempts.' },
});

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Passport ────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Request Logging ─────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/auth', authLimiter, authRoutes);
app.use('/highlights', apiLimiter, highlightRoutes);
app.use('/summary', apiLimiter, summaryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Database & Server Start ─────────────────────────────────
async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info('✅ Connected to MongoDB');

    // Initialize background services (Crons & Workers)
    await initBackgroundServices();

    // Start server
    app.listen(config.port, () => {
      logger.info(`🚀 Rewise AI backend running on port ${config.port}`);
      logger.info(`📡 Environment: ${config.nodeEnv}`);
      logger.info(`🤖 AI Provider: ${config.ai.provider}`);
    });
  } catch (error) {
    logger.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await shutdownBackgroundServices();
  await mongoose.disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

start();

export default app;
