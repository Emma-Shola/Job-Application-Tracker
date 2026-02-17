const express = require('express');
const router = express.Router();
const { getStats, getStatsSimple } = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');

// All routes require authentication
router.use(auth);

// Get job statistics
router.get('/stats', getStats);

// Get simple stats (for testing)
router.get('/stats/simple', getStatsSimple);

module.exports = router;