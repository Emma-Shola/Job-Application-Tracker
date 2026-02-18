// Load environment variables
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

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobs');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// =============================================
// FIXED CORS CONFIGURATION - NO '*'
// =============================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://job-application-tracker-1-drsa.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean);

// CORS middleware - NOT using '*' to avoid path-to-regexp error
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('❌ Blocked origin:', origin);
      return callback(new Error('CORS not allowed'), false);
    }
    console.log('✅ Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ FIXED: Handle preflight requests WITHOUT using '*'
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || allowedOrigins[0] || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Body parser middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// =============================================
// DATABASE CONNECTION
// =============================================
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit in development, just log error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

connectDB();

// =============================================
// ROUTES
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Job Application Tracker API is running');
});

// Health check endpoint (useful for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =============================================
// CREATE HTTP SERVER
// =============================================
const server = http.createServer(app);

// =============================================
// WEBSOCKET SETUP
// =============================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join user to their own room for private notifications
  socket.on('join-user', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    }
  });
  
  // Handle job updates
  socket.on('job-updated', (jobData) => {
    if (jobData && jobData.createdBy) {
      socket.to(`user-${jobData.createdBy}`).emit('job-changed', jobData);
      console.log(`📝 Job updated notification sent to user ${jobData.createdBy}`);
    }
  });
  
  // Handle job creation
  socket.on('job-created', (jobData) => {
    if (jobData && jobData.createdBy) {
      socket.to(`user-${jobData.createdBy}`).emit('new-job', jobData);
      console.log(`✨ New job notification sent to user ${jobData.createdBy}`);
    }
  });
  
  // Handle job deletion
  socket.on('job-deleted', (data) => {
    if (data && data.createdBy) {
      socket.to(`user-${data.createdBy}`).emit('job-removed', data);
      console.log(`🗑️ Job deleted notification sent to user ${data.createdBy}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// =============================================
// ERROR HANDLING
// =============================================
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log('====================================\n');
});

// =============================================
// PROCESS HANDLERS
// =============================================
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, io };
