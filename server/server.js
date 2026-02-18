// Load environment variables - UPDATED SECTION
const path = require('path');
const fs = require('fs');

// Determine which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

const envPath = path.join(__dirname, envFile);

// Check if env file exists, if not try .env as fallback
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envFile}`);
  require('dotenv').config({ path: envPath });
} else {
  console.log(`⚠️  ${envFile} not found, falling back to .env or system env`);
  require('dotenv').config();
}

// Debug - remove after confirming it works
console.log('✅ Environment loaded:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? 'Found ✓' : 'Missing ✗'}`);
console.log(`   CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

// Import routes
const authRoutes = require('./routes/authRoutes')
const jobRoutes = require('./routes/jobs')
const analyticsRoutes = require('./routes/analytics')

const app = express()

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://job-application-tracker-1-drsa.onrender.com', // Your frontend URL
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean); // Remove undefined values

// CORS middleware
const cors = require('cors');

// Allow ALL origins temporarily for testing (USE THIS FIRST TO CONFIRM IT WORKS)
app.use(cors({
  origin: '*', // TEMPORARY - allows all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// For preflight requests
app.options('*', cors());
app.use(express.json())

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    // Don't exit in development, just log error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/analytics', analyticsRoutes)

// Base route
app.get('/', (req, res) => {
  res.send('Job Application Tracker API is running')
})

// Create HTTP server
const server = http.createServer(app)

// WebSocket setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  }
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id)
  
  // Join user to their own room for private notifications
  socket.on('join-user', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`)
      console.log(`👤 User ${userId} joined their room`)
    }
  })
  
  // Handle job updates
  socket.on('job-updated', (jobData) => {
    if (jobData && jobData.createdBy) {
      socket.to(`user-${jobData.createdBy}`).emit('job-changed', jobData)
      console.log(`📝 Job updated notification sent to user ${jobData.createdBy}`)
    }
  })
  
  // Handle job creation
  socket.on('job-created', (jobData) => {
    if (jobData && jobData.createdBy) {
      socket.to(`user-${jobData.createdBy}`).emit('new-job', jobData)
      console.log(`✨ New job notification sent to user ${jobData.createdBy}`)
    }
  })
  
  // Handle job deletion
  socket.on('job-deleted', (data) => {
    if (data && data.createdBy) {
      socket.to(`user-${data.createdBy}`).emit('job-removed', data)
      console.log(`🗑️ Job deleted notification sent to user ${data.createdBy}`)
    }
  })
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id)
  })
})

// Make io accessible to routes
app.set('io', io)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler for routes that don't exist - FIXED VERSION
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log('\n🚀 ====================================')
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🚀 WebSocket server running on port ${PORT}`)
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🚀 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
  console.log('====================================\n')
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

module.exports = { app, server, io }
