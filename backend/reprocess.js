import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Highlight from './src/models/Highlight.js';
import { addHighlightJob } from './src/queue/highlightQueue.js';

dotenv.config();

async function reprocessFailed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Mongo");

  // Get all highlights that might have failed AI or are uncategorized
  const highlights = await Highlight.find({});
  
  console.log(`Found ${highlights.length} highlights. Re-queueing them...`);

  for (const h of highlights) {
    if (h.aiEnhanced?.tags?.length === 0 || h.aiEnhanced?.summary === null || !h.aiEnhanced) {
      h.status = 'pending';
      h.aiEnhanced = null;
      await h.save();
      await addHighlightJob(h._id.toString(), h.text);
      console.log(`Queued ${h._id}`);
    }
  }

  console.log("Done");
  process.exit();
}

reprocessFailed();
