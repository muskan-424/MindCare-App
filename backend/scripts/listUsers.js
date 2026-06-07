/**
 * MindCare — List All Users in Database
 * Run: node scripts/listUsers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/domains/identity/models/User');
const Profile = require('../src/domains/identity/models/Profile');

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('  MindCare — Current Database Users');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const users = await User.find({}).sort({ createdAt: 1 }).lean();

  if (users.length === 0) {
    console.log('  No users found in database.\n');
    await mongoose.disconnect();
    return;
  }

  // Fetch all profiles in one shot
  const profileMap = {};
  const profiles = await Profile.find({}).lean();
  profiles.forEach(p => { profileMap[String(p.userId)] = p; });

  const ADMIN_EMAILS = [
    process.env.ADMIN_EMAIL_1,
    process.env.ADMIN_EMAIL_2,
  ].filter(Boolean).map(e => e.toLowerCase());

  // Role breakdown counters
  const counts = { admin: 0, clinician: 0, user: 0, other: 0 };

  users.forEach((u, i) => {
    const profile = profileMap[String(u._id)] || {};
    const isAdmin = ADMIN_EMAILS.includes((u.email || '').toLowerCase());
    const role = isAdmin ? 'admin' : (u.role || 'user');

    counts[role] !== undefined ? counts[role]++ : counts.other++;

    const roleLabel = role === 'admin' ? '🔴 ADMIN' :
                      role === 'clinician' ? '🟡 CLINICIAN' : '🟢 USER';

    console.log(`  ┌── User ${i + 1} ──────────────────────────────────────────────`);
    console.log(`  │  ID       : ${u._id}`);
    console.log(`  │  Name     : ${u.name || '—'}`);
    console.log(`  │  Email    : ${u.email}`);
    console.log(`  │  Role     : ${roleLabel}`);
    console.log(`  │  Gender   : ${u.gender || '—'}`);
    console.log(`  │  Age      : ${u.age || '—'}`);
    console.log(`  │  Phone    : ${profile.phone_no || '—'}`);
    console.log(`  │  Concerns : ${(profile.concerns || []).join(', ') || 'none'}`);
    console.log(`  │  Bio      : ${(profile.bio || '').slice(0, 60) || '—'}`);
    console.log(`  │  Created  : ${u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN') : '—'}`);
    console.log(`  └──────────────────────────────────────────────────────────\n`);
  });

  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`  Total Users  : ${users.length}`);
  console.log(`  🔴 Admins    : ${counts.admin}`);
  console.log(`  🟡 Clinicians: ${counts.clinician}`);
  console.log(`  🟢 Patients  : ${counts.user}`);
  console.log('══════════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

listUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
