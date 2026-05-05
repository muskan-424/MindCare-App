require('dotenv').config();
const m = require('mongoose');
async function run() {
  await m.connect(process.env.MONGODB_URI);
  const Appointment = require('./models/Appointment');
  const IssueReport = require('./models/IssueReport');
  const EC = require('./models/EmergencyContact');
  const WP = require('./models/WellnessPlan');
  const DR = require('./models/DeletionRequest');

  console.log({
    appts: await Appointment.find({ status: 'awaiting_admin' }).lean(),
    issues: await IssueReport.find({ adminVerified: false }).lean(),
    ec: await EC.find({ status: 'awaiting_admin' }).lean(),
    wp: await WP.find({ status: 'awaiting_admin' }).lean(),
    dr: await DR.find({ status: 'pending' }).lean()
  });
  await m.disconnect();
}
run().catch(console.error);
