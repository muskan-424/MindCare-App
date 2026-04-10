require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');
const Profile = require('../models/Profile');

async function resetAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: npm run reset-admin <new_admin_email> <new_password>');
    console.error('Example: npm run reset-admin newadmin@mindcare.com mypassword123');
    process.exit(1);
  }

  const [newEmail, newPassword] = args;

  if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    console.log(`\n1. Creating or overriding admin user with email: ${newEmail}`);
    
    // Check if the user already exists. If yes, we'll just update password. If no, we create them.
    let user = await User.findOne({ email: newEmail.toLowerCase() });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (user) {
      console.log('User already exists. Wiping old password and updating...');
      user.password = hashedPassword;
      await user.save();
    } else {
      console.log('Creating brand new user entry...');
      user = new User({
        name: 'MindCare Admin',
        email: newEmail.toLowerCase(),
        password: hashedPassword,
        age: 'Adult',
        gender: 'other',
      });
      await user.save();

      // Create profile to prevent errors during login
      const profile = new Profile({
        userId: user._id,
        name: 'MindCare Admin',
        email: newEmail.toLowerCase(),
      });
      await profile.save();
    }

    console.log(`\n2. Updating backend/.env to flag ${newEmail} as the application administrator...`);
    
    const envPath = path.join(__dirname, '..', '.env');
    let envData = fs.readFileSync(envPath, 'utf8');

    // Replace or add ADMIN_EMAIL_1
    const adminEmailRegex = /^ADMIN_EMAIL_1=.*$/m;
    if (adminEmailRegex.test(envData)) {
      envData = envData.replace(adminEmailRegex, `ADMIN_EMAIL_1=${newEmail.toLowerCase()}`);
    } else {
      envData += `\nADMIN_EMAIL_1=${newEmail.toLowerCase()}\n`;
    }

    fs.writeFileSync(envPath, envData);

    console.log(`\n✅ Success! `);
    console.log(`You can now login as admin using:`);
    console.log(`Email: ${newEmail}`);
    console.log(`Password: ${newPassword}`);
    console.log(`\nNote: If you ever forget this password, you can use the "Forgot Password" feature on the App login screen to recover it!`);
    console.log(`Make sure to restart your backend server so it picks up the .env change.`);

    process.exit(0);
  } catch (err) {
    console.error('Error during admin reset:', err.message);
    process.exit(1);
  }
}

resetAdmin();
