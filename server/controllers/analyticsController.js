const Job = require('../models/Job')
const mongoose = require('mongoose')

const getStats = async (req, res) => {
  try {
    console.log('🔍 Getting stats for user ID:', req.user.id)
    
    // Validate that userId exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        msg: 'User ID not found in token',
        error: 'Authentication required' 
      })
    }
    
    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.error('Invalid ObjectId format:', req.user.id)
      return res.status(400).json({ 
        msg: 'Invalid user ID format',
        error: 'User ID must be a valid MongoDB ObjectId',
        receivedId: req.user.id
      })
    }
    
    // Convert userId string to MongoDB ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id)
    console.log('Converted User ID to ObjectId:', userId)
    
    // Try aggregation first
    try {
      const stats = await Job.aggregate([
        { 
          $match: { 
            createdBy: userId 
          } 
        },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 } 
          } 
        },
      ])

      console.log('📊 Aggregation result:', stats)

      const defaultStats = {
        applied: 0,
        interview: 0,
        technical: 0,
        offer: 0,
        rejected: 0,
        accepted: 0
      }

      // Safely map aggregation results to defaultStats
      stats.forEach((item) => {
        if (item._id && defaultStats.hasOwnProperty(item._id)) {
          defaultStats[item._id] = item.count
        } else if (item._id) {
          console.warn(`⚠️ Unexpected status found: ${item._id}`)
        }
      })

      console.log('✅ Final stats (aggregation):', defaultStats)
      return res.status(200).json(defaultStats)
      
    } catch (aggregationError) {
      console.log('Aggregation failed, trying alternative method:', aggregationError.message)
      
      // Fallback: Use find() and count manually
      const jobs = await Job.find({ createdBy: userId })
      console.log(`📁 Found ${jobs.length} jobs for user (fallback method)`)
      
      const defaultStats = {
        applied: 0,
        interview: 0,
        technical: 0,
        offer: 0,
        rejected: 0,
        accepted: 0
      }

      // Count statuses manually
      jobs.forEach((job) => {
        const status = job.status
        if (defaultStats.hasOwnProperty(status)) {
          defaultStats[status]++
        } else {
          console.warn(`⚠️ Job has unexpected status: ${status}`)
        }
      })

      console.log('✅ Final stats (fallback):', defaultStats)
      return res.status(200).json(defaultStats)
    }
    
  } catch (error) {
    console.error('❌ Stats error details:')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Check specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        msg: 'Invalid user ID format - cannot convert to ObjectId',
        error: error.message,
        receivedId: req.user?.id
      })
    }
    
    if (error.name === 'MongoServerError') {
      return res.status(500).json({ 
        msg: 'Database error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
    
    res.status(500).json({ 
      msg: 'Server error while fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      hint: 'Check if jobs exist for this user and if user ID is valid'
    })
  }
}

// Alternative simpler version (for testing)
const getStatsSimple = async (req, res) => {
  try {
    console.log('🔍 Getting stats (simple method) for user:', req.user.id)
    
    const jobs = await Job.find({ createdBy: req.user.id })
    console.log(`📁 Found ${jobs.length} jobs`)
    
    const stats = {
      applied: 0,
      interview: 0,
      technical: 0,
      offer: 0,
      rejected: 0,
      accepted: 0
    }
    
    jobs.forEach(job => {
      if (stats.hasOwnProperty(job.status)) {
        stats[job.status]++
      }
    })
    
    console.log('✅ Simple stats:', stats)
    res.status(200).json(stats)
    
  } catch (error) {
    console.error('Simple stats error:', error)
    res.status(500).json({ 
      msg: 'Error getting statistics',
      error: error.message 
    })
  }
}

// Export both versions for testing
module.exports = { 
  getStats,        // Original with fallback
  getStatsSimple   // Simpler version for testing
}