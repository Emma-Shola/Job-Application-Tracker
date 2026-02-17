require('dotenv').config()
const app = require('./app')
const http = require('http')
const { Server } = require('socket.io')

const PORT = process.env.PORT || 5000
const connectDB = require('./config/connectDB')

connectDB()

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)
  
  // Join user to their own room for private notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`)
    console.log(`User ${userId} joined their room`)
  })
  
  // Handle job updates
  socket.on('job-updated', (jobData) => {
    socket.to(`user-${jobData.createdBy}`).emit('job-changed', jobData)
  })
  
  // Handle job creation
  socket.on('job-created', (jobData) => {
    socket.to(`user-${jobData.createdBy}`).emit('new-job', jobData)
  })
  
  // Handle job deletion
  socket.on('job-deleted', (data) => {
    socket.to(`user-${data.createdBy}`).emit('job-removed', data)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Make io accessible to routes
app.set('io', io)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server running on port ${PORT}`)
})