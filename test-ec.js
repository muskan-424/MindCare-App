require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const EmergencyContact = require('./backend/models/EmergencyContact');

async function testFeature() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mindcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ DB Connected');

    // 1. Create a dummy user
    const user = new User({
      name: 'Test Setup User',
      email: `test_ec_${Date.now()}@example.com`,
      password: 'password123',
    });
    await user.save();
    console.log('✅ Created User:', user._id);

    // 2. Add an Emergency Contact
    const contact = await EmergencyContact.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          user: user._id,
          name: 'Mom',
          relationship: 'Parent',
          phone: '+919876543210',
          reachVia: 'both',
          userMessage: 'Test Context Note',
          consentGiven: true,
          status: 'awaiting_admin',
        },
      },
      { upsert: true, new: true }
    );
    console.log('✅ Added Emergency Contact. Status:', contact.status);

    // 3. Admin Verify it
    const verifiedContact = await EmergencyContact.findByIdAndUpdate(
      contact._id,
      { $set: { status: 'verified', adminNote: 'Looks good' } },
      { new: true }
    );
    console.log('✅ Admin Verified Contact. Status:', verifiedContact.status);

    // 4. Log a test call
    const loggedContact = await EmergencyContact.findOneAndUpdate(
      { user: user._id, status: 'verified' },
      {
        $push: {
          callLog: {
            calledAt: new Date(),
            outcome: 'reached',
            adminNote: 'Spoke successfully.',
            triggeredBy: 'some-report-id',
          },
        },
      },
      { new: true }
    );
    console.log('✅ Logged a crisis call! Total calls logged:', loggedContact.callLog.length);

    console.log('\nAll Emergency Contact database paths verified successfully! 🎉');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await mongoose.connection.close();
  }
}

testFeature();
