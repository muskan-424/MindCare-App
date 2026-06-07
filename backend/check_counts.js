const mongoose = require('mongoose');
require('dotenv').config();
const Appointment = require('./src/domains/therapy/models/Appointment');
const IssueReport = require('./src/domains/admin/models/IssueReport');
const EmergencyContact = require('./src/domains/admin/models/EmergencyContact');
const WellnessPlan = require('./src/domains/wellness/models/WellnessPlan');
const DeletionRequest = require('./src/domains/identity/models/DeletionRequest');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mindcare').then(async () => {
  const counts = await Promise.all([
    Appointment.countDocuments({ status: 'awaiting_admin' }),
    IssueReport.countDocuments({ adminVerified: false, riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),
    EmergencyContact.countDocuments({ status: 'awaiting_admin' }),
    WellnessPlan.countDocuments({ status: 'awaiting_admin' }),
    DeletionRequest.countDocuments({ status: 'pending' })
  ]);
  console.log('Counts:', counts);
  process.exit(0);
}).catch(console.error);
