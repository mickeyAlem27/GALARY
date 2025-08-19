const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority',
});

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('Using connection string:', uri.replace(/:[^:]*@/, ':*****@'));
  
  try {
    console.log('Attempting to connect...');
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test a simple command
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('📂 Collections in database:', collections.map(c => c.name).join(', ') || 'None');
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n🔧 Possible solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify your IP is whitelisted in MongoDB Atlas');
      console.error('3. Try using a VPN (some ISPs block MongoDB connections)');
      console.error('4. Check if MongoDB Atlas is experiencing any outages');
    }
    
    return false;
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
