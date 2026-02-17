const Job = require('../models/Job')
const { emitToUser } = require('../utils/socket')

// CREATE JOB
const createJob = async (req, res) => {
  try {
    // Debug logging
    console.log('👤 Creating job for user ID:', req.user.id)
    console.log('👤 Full user object:', req.user)
    console.log('📝 Request body:', req.body)

    const { company, position, status, notes, salary, location, contact, jobUrl } = req.body

    // Validation
    if (!company || !company.trim()) {
      return res.status(400).json({ 
        success: false,
        msg: 'Company name is required' 
      })
    }

    if (!position || !position.trim()) {
      return res.status(400).json({ 
        success: false,
        msg: 'Position title is required' 
      })
    }

    // Validate status
    const validStatuses = ['applied', 'interview', 'technical', 'offer', 'rejected', 'accepted']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        msg: `Status must be one of: ${validStatuses.join(', ')}` 
      })
    }

    // Create job - ✅ FIXED: Use req.user.id (not userId)
    const jobData = {
      company: company.trim(),
      position: position.trim(),
      status: status || 'applied',
      notes: notes ? notes.trim() : '',
      salary: salary ? salary.trim() : '',
      location: location ? location.trim() : '',
      contact: contact ? contact.trim() : '',
      jobUrl: jobUrl ? jobUrl.trim() : '',
      createdBy: req.user.id // ✅ Use 'id' to match Job model
    }

    console.log('📝 Creating job with data:', jobData)

    const job = await Job.create(jobData)

    console.log(`✅ Job created successfully: ${job.company} (ID: ${job._id})`)

    // Emit WebSocket event
    try {
      emitToUser(req.user.id, 'job-created', job)
    } catch (wsError) {
      console.log('WebSocket not available:', wsError.message)
    }

    res.status(201).json({
      success: true,
      msg: 'Job created successfully',
      data: job
    })

  } catch (error) {
    console.error('❌ Create job error details:')
    console.error('Name:', error.name)
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        success: false,
        msg: 'Validation error',
        errors: messages 
      })
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        msg: 'Duplicate job found. You already have a job with this company and position.' 
      })
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error creating job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// GET ALL JOBS
const getJobs = async (req, res) => {
  try {
    const { status, search, page, limit, sort } = req.query

    // 🔥 ADDED DEBUG LOGGING
    console.log('🔐 Current user ID from req.user:', req.user.id)
    console.log('🔐 Current user object:', req.user)
    
    // Filters - only show user's own jobs - ✅ FIXED: Use req.user.id
    const queryObject = { createdBy: req.user.id }
    
    if (status) {
      const validStatuses = ['applied', 'interview', 'technical', 'offer', 'rejected', 'accepted']
      if (validStatuses.includes(status)) {
        queryObject.status = status
      }
    }
    
    if (search && search.trim()) {
      queryObject.$or = [
        { company: { $regex: search.trim(), $options: 'i' } },
        { position: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    // Pagination
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10))
    const skip = (pageNum - 1) * limitNum

    // Sorting
    let sortOption = '-createdAt' // Default: newest first
    if (sort) {
      const validSorts = ['createdAt', '-createdAt', 'company', '-company', 'status', '-status', 'position', '-position']
      if (validSorts.includes(sort)) {
        sortOption = sort
      }
    }

    // Execute query
    const jobs = await Job.find(queryObject)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select('-__v') // Exclude version key

    // 🔥 ADDED: Check what jobs we found
    console.log(`📊 Found ${jobs.length} jobs for user ${req.user.id}`)
    if (jobs.length > 0) {
      console.log('📋 Sample job createdBy:', jobs[0].createdBy)
      console.log('📋 Sample job company:', jobs[0].company)
    }

    const totalJobs = await Job.countDocuments(queryObject)
    const numOfPages = Math.ceil(totalJobs / limitNum)

    console.log(`📊 User ${req.user.id} retrieved ${jobs.length} jobs`)

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalJobs,
      numOfPages,
      currentPage: pageNum,
      data: jobs
    })

  } catch (error) {
    console.error('Get jobs error:', error)
    res.status(500).json({ 
      success: false,
      msg: 'Server error retrieving jobs' 
    })
  }
}

// GET SINGLE JOB
const getJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user.id, // ✅ FIXED: Use req.user.id
    })

    if (!job) {
      return res.status(404).json({ 
        success: false,
        msg: 'Job not found' 
      })
    }

    res.status(200).json({
      success: true,
      data: job
    })

  } catch (error) {
    console.error('Get job error:', error)
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid job ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error retrieving job' 
    })
  }
}

// UPDATE JOB
const updateJob = async (req, res) => {
  try {
    const { company, position, status, notes, salary, location, contact, jobUrl } = req.body

    // Prepare update data - INCLUDING ALL FIELDS
    const updateData = {}
    
    if (company !== undefined) {
      if (!company.trim()) {
        return res.status(400).json({ 
          success: false,
          msg: 'Company name cannot be empty' 
        })
      }
      updateData.company = company.trim()
    }
    
    if (position !== undefined) {
      if (!position.trim()) {
        return res.status(400).json({ 
          success: false,
          msg: 'Position title cannot be empty' 
        })
      }
      updateData.position = position.trim()
    }
    
    if (status !== undefined) {
      const validStatuses = ['applied', 'interview', 'technical', 'offer', 'rejected', 'accepted']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false,
          msg: `Status must be one of: ${validStatuses.join(', ')}` 
        })
      }
      updateData.status = status
    }
    
    if (notes !== undefined) {
      updateData.notes = notes.trim()
    }
    
    if (salary !== undefined) {
      updateData.salary = salary.trim()
    }
    
    if (location !== undefined) {
      updateData.location = location.trim()
    }
    
    if (contact !== undefined) {
      updateData.contact = contact.trim()
    }
    
    if (jobUrl !== undefined) {
      updateData.jobUrl = jobUrl.trim()
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false,
        msg: 'No update data provided' 
      })
    }

    // Update job - ✅ FIXED: Use req.user.id
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query' 
      }
    )

    if (!job) {
      return res.status(404).json({ 
        success: false,
        msg: 'Job not found' 
      })
    }

    console.log(`✅ Job updated: ${job.company} by user ${req.user.id}`)

    // Emit WebSocket event
    try {
      emitToUser(req.user.id, 'job-updated', job)
    } catch (error) {
      console.log('WebSocket error:', error.message)
    }

    res.status(200).json({
      success: true,
      msg: 'Job updated successfully',
      data: job
    })

  } catch (error) {
    console.error('Update job error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid job ID format' 
      })
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        success: false,
        msg: 'Validation error',
        errors: messages 
      })
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error updating job' 
    })
  }
}

// DELETE JOB
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id, // ✅ FIXED: Use req.user.id
    })

    if (!job) {
      return res.status(404).json({ 
        success: false,
        msg: 'Job not found' 
      })
    }

    console.log(`🗑️ Job deleted: ${job.company} by user ${req.user.id}`)

    // Emit WebSocket event
    try {
      emitToUser(req.user.id, 'job-deleted', { 
        id: req.params.id,
        company: job.company 
      })
    } catch (error) {
      console.log('WebSocket error:', error.message)
    }

    res.status(200).json({
      success: true,
      msg: 'Job deleted successfully',
      data: {
        id: job._id,
        company: job.company
      }
    })

  } catch (error) {
    console.error('Delete job error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid job ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error deleting job' 
    })
  }
}

// EXPORT STATUS OPTIONS (for frontend)
const getJobStatusOptions = (req, res) => {
  const statusOptions = [
    { value: 'applied', label: 'Applied', color: '#3b82f6' },
    { value: 'interview', label: 'Interview', color: '#f59e0b' },
    { value: 'technical', label: 'Technical', color: '#8b5cf6' },
    { value: 'offer', label: 'Offer', color: '#10b981' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444' },
    { value: 'accepted', label: 'Accepted', color: '#059669' }
  ]
  
  res.status(200).json({
    success: true,
    data: statusOptions
  })
}

// DEBUG ENDPOINT - Add this new function
const debugAuth = (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Authentication successful',
    timestamp: new Date().toISOString()
  })
}

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getJobStatusOptions,
  debugAuth
}