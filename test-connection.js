require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/:([^:]+)@/, ':*****@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB');  
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\nTroubleshooting steps:');
  console.log('1. Verify your MongoDB Atlas username and password');
  console.log('2. Check if your IP is whitelisted in MongoDB Atlas Network Access');
  console.log('3. Ensure the database name (MYGALARY) exists');
  console.log('4. Check your internet connection');
  process.exit(1);
});
