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

  const opts = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 1,
  };
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      log(`Attempting to connect to MongoDB (${attempt}/${maxAttempts})...`);
      cachedConnection = await mongoose.connect(config.mongoUri, opts);
      log(`MongoDB Connected: ${cachedConnection.connection.host}`);
      return cachedConnection;
    } catch (err) {
      if (attempt < maxAttempts) {
        log(`MongoDB connect attempt ${attempt} failed — retrying in 3s`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      console.error('\n================================');
      console.error('CRITICAL MONGODB CONNECTION ERROR:');
      console.error(err);
      console.error('================================\n');
      cachedConnection = null;
    }
  }
};

module.exports = connectDB;
