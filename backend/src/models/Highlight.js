import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    pageTitle: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
      index: true,
    },
    aiEnhanced: {
      summary: { type: String, default: null },
      explanation: { type: String, default: null },
      example: { type: String, default: null },
      tags: [{ type: String, trim: true, lowercase: true }],
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', null],
        default: null,
      },
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user+status queries
highlightSchema.index({ userId: 1, status: 1 });
highlightSchema.index({ userId: 1, createdAt: -1 });
highlightSchema.index({ 'aiEnhanced.tags': 1 });

const Highlight = mongoose.model('Highlight', highlightSchema);

export default Highlight;
