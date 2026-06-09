const mongoose = require('mongoose');
const { config } = require('./env');

// Cache the connection promise so serverless warm invocations
// reuse the existing connection instead of opening a new one.
let cachedConnection = null;

// Quiet during tests to keep CI output readable.
const log = (...args) => { if (process.env.NODE_ENV !== 'test') console.log(...args); };

const connectDB = async () => {
  // If already connected, reuse the cached connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    log('MongoDB: reusing cached connection');
    return cachedConnection;
  }

  try {
    log('Attempting to connect to MongoDB...');
    cachedConnection = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000, // fail fast after 10s
      socketTimeoutMS: 45000,
      maxPoolSize: 5,  // keep low for M0 free tier connection limits
      minPoolSize: 1,  // keep 1 connection alive for fast subsequent requests
    });
    log(`MongoDB Connected: ${cachedConnection.connection.host}`);
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
