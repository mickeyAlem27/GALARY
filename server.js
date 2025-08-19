// Enable debug logging for MongoDB driver
const debug = require('debug');
debug.enable('mongoose:*');

require('dotenv').config();
const { MongoClient } = require('mongodb');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Disable mongoose buffering
mongoose.set('bufferCommands', false);

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Simple route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Gallery App API' });
});

// Import routes
const memoryRoutes = require('./routes/memories');
const authRoutes = require('./routes/auth');

// Mount routers
app.use('/api/memories', memoryRoutes);
app.use('/api/auth', authRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  let error = { ...err };
  error.message = err.message;
  
  // Log to console for dev
  console.log(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found'
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gallery-app';

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Function to test MongoDB connection
async function testMongoDBConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    const client = new mongoose.mongo.MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    });
    
    await client.connect();
    await client.db().admin().ping();
    console.log('✅ MongoDB connection test successful');
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    return false;
  }
}

// MongoDB connection function with retry logic
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retryCount = 0) => {
  console.log('🔌 Connecting to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
  
  // Debug: Log environment variables
  console.log('Environment variables loaded:', Object.keys(process.env).filter(k => k.startsWith('MONGODB') || k === 'NODE_ENV'));
  
  try {
    // Connect using mongoose with minimal options
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Start the server after successful DB connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`🌐 Network: http://${getLocalIpAddress()}:${PORT}`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in 3 seconds... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }
    
    console.error('🔧 Troubleshooting steps:');
    console.error('1. Check your internet connection');
    console.error('2. Verify your IP is whitelisted in MongoDB Atlas');
    console.error('3. Check your MongoDB credentials in .env');
    console.error('4. Try using a VPN (some ISPs block MongoDB connections)');
    console.error('5. Check if MongoDB Atlas is experiencing any outages');
    console.error('6. Try using MongoDB Compass to test the connection');
    console.error('7. Check if your firewall is blocking the connection');
    console.error('8. Make sure your IP is whitelisted in MongoDB Atlas network access');
    console.error('9. Try connecting with MongoDB Compass using the same connection string');
    
    // Log the full error for debugging
    console.error('\nFull error details:');
    console.error(error);
    
    process.exit(1);
  }
};

// Helper function to get local IP address
function getLocalIpAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      const { address, family, internal } = iface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 5000;

// Start the server with error handling
connectDB().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Perform cleanup if needed, then exit
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});