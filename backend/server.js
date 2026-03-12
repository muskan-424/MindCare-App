require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const app = express();

const startServer = async () => {
  console.log('-----------------------------------');
  console.log('🚀 Starting MindCare API Server...');
  console.log('-----------------------------------');

  // Connect to Databases (non-fatal so deploy succeeds even if DB/Redis unavailable)
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed (server will still start):', err.message);
  }
  try {
    await connectRedis();
  } catch (err) {
    console.error('Redis connection failed (server will still start):', err.message);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/', (req, res) => {
    res.json({ status: 'MindCare API is running', version: '1.0.0' });
  });

  // Routes
  app.use('/api/user', require('./routes/user'));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/profile', require('./routes/profile'));
  app.use('/api/quotes', require('./routes/quotes'));
  app.use('/api/chat', require('./routes/chat'));
  app.use('/api/fitness', require('./routes/fitness'));
  app.use('/api/content', require('./routes/content'));
  app.use('/api/blogs', require('./routes/blogs'));
  app.use('/api/journals', require('./routes/journals'));
  app.use('/api/therapists', require('./routes/therapists'));
  app.use('/api/issues', require('./routes/issues'));
  app.use('/api/mood', require('./routes/mood'));

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n===================================`);
    console.log(`✅ MindCare API running on port ${PORT}`);
    console.log(`===================================\n`);
  });
};

// Execute the startup
startServer().catch(err => {
  console.error("Critical Unhandled Server Error:", err);
});
