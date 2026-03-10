const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log(`Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`\n================================`);
    console.error(`CRITICAL MONGODB CONNECTION ERROR:`);
    console.error(err);
    console.error(`================================\n`);
    // Removed process.exit(1) so the container stays alive long enough to log this to Render
  }
};

module.exports = connectDB;
