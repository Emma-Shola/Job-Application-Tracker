const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require('path');

// Import your routes
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobs");
const analyticsRoutes = require("./routes/analytics");

// =============================================
// ENVIRONMENT VARIABLES - LOADS CORRECT .env FILE
// =============================================
// Determine which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

const envPath = path.join(__dirname, envFile);
console.log(`📁 Looking for env file: ${envPath}`);

// Try to load the environment-specific file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log(`⚠️  Could not load ${envFile}, falling back to .env`);
  // Fall back to default .env
  dotenv.config();
} else {
  console.log(`✅ Loaded environment from: ${envFile}`);
}

// Debug - see what's loaded
console.log('🔍 Current NODE_ENV:', process.env.NODE_ENV || 'development (default)');
console.log('🔍 MONGO_URI:', process.env.MONGO_URI ? 'Found ✓' : 'Missing ✗');
console.log('🔍 PORT:', process.env.PORT || 'not set (will use default 10000)');

const app = express();

/* ===================== CORS CONFIGURATION ===================== */
app.use(cors({
  origin: true,  // Dynamically allows your frontend origin
  credentials: true,
}));

app.use(express.json());

/* ===================== DATABASE CONNECTION ===================== */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting due to production database error');
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Job Application Tracker API is running");
});

/* ===================== ERROR HANDLING ===================== */
// 404 handler for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Database: ${process.env.MONGO_URI ? 'Connected ✓' : 'Not connected ✗'}`);
  console.log('====================================\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Server closed');
    mongoose.connection.close(false, () => {
      console.log('💤 Database connection closed');
      process.exit(0);
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION!');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION!');
  console.log(err.name, err.message);
  console.log(err.stack);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app; // For testing