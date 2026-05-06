require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Profile = require('./models/Profile');
const bcrypt = require('bcryptjs');

const seedTestUser = async () => {
  try {
    await connectDB();
    const email = 'testuser@example.com';
    const password = 'password123';

    // Remove if exists to do a clean overwrite
    await User.deleteOne({ email });
    await Profile.deleteOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: 'Test User',
      email: email,
      password: hashedPassword,
      role: 'user'
    });
    await user.save();

    const profile = new Profile({
      userId: user._id,
      name: 'Test User',
      email: email,
      age: '30',
      gender: 'other',
      phone_no: '1234567890',
      bio: 'A test user account',
      concerns: ['testing'],
    });
    await profile.save();

    console.log(`Test user created successfully:\nEmail: ${email}\nPassword: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedTestUser();
