require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Profile = require('./models/Profile');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    await connectDB();
    const email = 'muskanmittal151@gmail.com';
    const password = 'Suy23098#';

    // Remove if exists to do a clean overwrite
    await User.deleteOne({ email });
    await Profile.deleteOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: 'System Admin',
      email: email,
      password: hashedPassword,
      role: 'user'
    });
    await user.save();

    const profile = new Profile({
      userId: user._id,
      name: 'System Admin',
      email: email,
      age: '99',
      gender: 'other',
      phone_no: '',
      bio: 'Administrator',
      concerns: [],
    });
    await profile.save();

    console.log(`Admin user created securely:\nEmail: ${email}\nPassword: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
