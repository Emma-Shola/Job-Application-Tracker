const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getJobStatusOptions,
  debugAuth
} = require('../controllers/jobController');
const auth = require('../middleware/authMiddleware');

// All routes require authentication
router.use(auth);

// Debug endpoint to verify authentication
router.get('/debug/auth', debugAuth);

// Get all jobs for current user
router.get('/', getJobs);

// Get job status options
router.get('/status-options', getJobStatusOptions);

// Get single job
router.get('/:id', getJob);

// Create new job
router.post('/', createJob);

// Update job
router.put('/:id', updateJob);

// Delete job
router.delete('/:id', deleteJob);

module.exports = router;