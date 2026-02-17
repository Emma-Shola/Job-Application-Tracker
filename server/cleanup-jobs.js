// Create a new file: cleanup-jobs.js in your server root
const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('./models/Job');

async function cleanupJobs() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // 1. Find all jobs without createdBy field
    const jobsWithoutOwner = await Job.find({ createdBy: { $exists: false } });
    console.log(`Found ${jobsWithoutOwner.length} jobs wi
      thout createdBy field`);
    
    if (jobsWithoutOwner.length > 0) {
      console.log('Deleting jobs without owner...');
      await Job.deleteMany({ createdBy: { $exists: false } });
      console.log('Deleted jobs without owner');
    }

    // 2. Find all jobs with invalid createdBy (not ObjectId)
    const allJobs = await Job.find({});
    const invalidJobs = [];
    
    for (const job of allJobs) {
      if (job.createdBy && !mongoose.Types.ObjectId.isValid(job.createdBy)) {
        invalidJobs.push(job._id);
      }
    }
    
    console.log(`Found ${invalidJobs.length} jobs with invalid createdBy format`);
    if (invalidJobs.length > 0) {
      await Job.deleteMany({ _id: { $in: invalidJobs } });
      console.log('Deleted jobs with invalid createdBy');
    }

    // 3. Optional: Assign old jobs to a specific user if you want to keep them
    // const yourUserId = 'YOUR_USER_ID_HERE';
    // await Job.updateMany(
    //   { createdBy: { $exists: true } }, 
    //   { $set: { createdBy: new mongoose.Types.ObjectId(yourUserId) } }
    // );

    console.log('✅ Database cleanup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
}

cleanupJobs();