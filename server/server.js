const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Import your routes
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobs");
const analyticsRoutes = require("./routes/analytics");

dotenv.config();

const app = express();

/* ===================== CLEAN CORS ===================== */
app.use(cors({
  origin: true,  // Dynamically allows your frontend origin
  credentials: true,
}));

app.use(express.json());

/* ===================== DATABASE ===================== */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not defined');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
};
connectDB();

/* ===================== ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.send("API running"));

/* ===================== ERROR HANDLING ===================== */
// 404 handler - NO WILDCARD PATH
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server on port ${PORT}`);
});

