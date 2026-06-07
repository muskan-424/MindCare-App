require('dotenv').config();
const m = require('mongoose');
async function run() {
  await m.connect(process.env.MONGODB_URI);
  const Therapist = require('./src/domains/therapy/models/Therapist');
  const defaults = ['Dr. Brain Wofe', 'Dr. Selkon Kane', 'Dr. SN Mohanty', 'Kate Williams'];
  const res = await Therapist.deleteMany({ name: { $in: defaults } });
  console.log(`Deleted ${res.deletedCount} seeded/default therapists.`);
  await m.disconnect();
}
run().catch(console.error);
