const cron = require('node-cron')
const Job = require('./models/Job')
const sendEmail = require('./utils/sendEmail')
const User = require('./models/User')

// Runs every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  const jobs = await Job.find({ status: 'applied' }).populate('createdBy')
  jobs.forEach((job) => {
    sendEmail(
      job.createdBy.email,
      'Follow-up Reminder',
      `Remember to follow up on your application at ${job.company}`
    )
  })
  console.log('Reminders sent')
})
