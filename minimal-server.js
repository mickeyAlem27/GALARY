require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Connect to MongoDB
async function connectDB() {
  console.log('🔌 Connecting to MongoDB...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('🔧 Troubleshooting steps:');
    console.error('1. Check your internet connection');
    console.error('2. Verify your IP is whitelisted in MongoDB Atlas');
    console.error('3. Try using a VPN (some ISPs block MongoDB connections)');
    process.exit(1);
  }
}

// Start the application
connectDB();
