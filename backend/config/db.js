const mongoose = require('mongoose');

// Cache the connection promise so serverless warm invocations
// reuse the existing connection instead of opening a new one.
let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse the cached connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('MongoDB: reusing cached connection');
    return cachedConnection;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast after 10s
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (err) {
    console.error('\n================================');
    console.error('CRITICAL MONGODB CONNECTION ERROR:');
    console.error(err);
    console.error('================================\n');
    cachedConnection = null;
  }
};

module.exports = connectDB;
