const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./routes/analytics');

// Import error handlers
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobs'); // ✅ Use the new unified route

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Job Tracker API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes); // ✅ This now uses your controller-based routes





// Add this to your routes section
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFoundMiddleware);

// Error handler
app.use(errorHandlerMiddleware);



module.exports = app;