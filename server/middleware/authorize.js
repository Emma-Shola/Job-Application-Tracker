 const Job = require('../models/Job');
const { ForbiddenError, NotFoundError } = require('../errors');
const asyncHandler = require('./async-handler');

const authorizeJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    throw new NotFoundError('Job', req.params.id);
  }
  
  // Check ownership
  if (job.createdBy.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to access this job');
  }
  
  req.job = job;
  next();
});

module.exports = {
  authorizeJob
};