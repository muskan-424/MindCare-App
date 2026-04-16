require('dotenv').config();
const mongoose = require('mongoose');

async function deleteAllUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await mongoose.connection.db.collection('users').deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} user(s) from the database.`);

  await mongoose.disconnect();
  console.log('Disconnected.');
  process.exit(0);
}

deleteAllUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
