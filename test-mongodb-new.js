require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Set debug mode
    mongoose.set('debug', true);
    
    // Attempt to connect
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed.');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // Additional debug info
    console.log('\n🔧 Debug Information:');
    console.log('- Node.js version:', process.version);
    console.log('- Mongoose version:', require('mongoose/package.json').version);
    console.log('- Environment:', process.env.NODE_ENV || 'development');
    
    process.exit(1);
  }
};

testConnection();
