import 'dotenv/config';
import mongoose from 'mongoose';
import emailService from './src/services/emailService.js';
import User from './src/models/User.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne();
    if (!user) {
      console.log('No user found in the database');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email}. Sending test email...`);
    
    const digest = {
      totalHighlights: 2,
      tagGroups: {
        'SYSTEM DESIGN': [
          {
            text: 'This blog shows how to ace the BookMyShow System Design interview by treating it as a high-contention e-commerce problem...',
            sourceUrl: 'https://example.com/bookmyshow',
            pageTitle: 'BookMyShow System Design',
            aiEnhanced: { summary: 'This blog shows how to ace the BookMyShow System Design interview by treating it as a high-contention e-commerce problem and designing seat locking, payments, and failures...' }
          },
          {
            text: 'In system design, containerization architecture describes the process of encapsulating an application and its dependencies into a portable, lightweight container...',
            sourceUrl: 'https://example.com/containers',
            pageTitle: 'Containerization Architecture',
            aiEnhanced: { summary: 'In system design, containerization architecture describes the process of encapsulating an application and its dependencies into a portable, lightweight container that is easily deployable in a variety...' }
          }
        ]
      },
      aiDigest: 'This week you focused heavily on System Design concepts, including high-scale architectures and container orchestration. You reviewed high contention scaling and Docker container setups.',
      period: { from: new Date(Date.now() - 7*24*60*60*1000), to: new Date() }
    };
    
    const success = await emailService.sendWeeklyDigest(
      user.email,
      user.name || 'Ishaan',
      digest
    );
    
    if (success) {
      console.log('Test email sent successfully!');
    } else {
      console.log('Failed to send test email.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
