/**
 * MindCare — Reset Database (Keep Admin Only)
 * =============================================
 * Deletes ALL users except the admin, and clears ALL their associated data
 * across every collection. Admin user + their profile are preserved.
 *
 * Run: node scripts/resetDbKeepAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Load every model ──────────────────────────────────────────────────────────
const User                  = require('../models/User');
const Profile               = require('../models/Profile');
const MoodEntry             = require('../models/MoodEntry');
const JournalEntry          = require('../models/JournalEntry');
const IssueReport           = require('../models/IssueReport');
const EmergencyContact      = require('../models/EmergencyContact');
const Appointment           = require('../models/Appointment');
const WellnessPlan          = require('../models/WellnessPlan');
const Goal                  = require('../models/Goal');
const PeerConnection        = require('../models/PeerConnection');
const AssessmentSession     = require('../models/AssessmentSession');
const AssessmentFeatureVector = require('../models/AssessmentFeatureVector');
const AssessmentFusionResult  = require('../models/AssessmentFusionResult');
const ActivityLog           = require('../models/ActivityLog');
const AdminAuditLog         = require('../models/AdminAuditLog');
const BlogPost              = require('../models/BlogPost');
const DeletionRequest       = require('../models/DeletionRequest');
const GroupSession          = require('../models/GroupSession');
const TherapistNote         = require('../models/TherapistNote');
const Therapist             = require('../models/Therapist');
const Notification          = require('../models/Notification');

// ── Helpers ───────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
].filter(Boolean).map(e => e.toLowerCase());

const log  = (msg, n) => console.log(`  ✅  ${msg}${n !== undefined ? `  (removed: ${n})` : ''}`);
const warn = (msg)    => console.log(`  ⚠️   ${msg}`);
const sep  = ()       => console.log('');

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('  MindCare — Database Reset (Keeping Admin Only)');
  console.log('══════════════════════════════════════════════════════════════════\n');

  // ── 1. Identify admin user(s) to keep ─────────────────────────────────────
  const adminUsers = await User.find({ email: { $in: ADMIN_EMAILS } }).lean();
  if (adminUsers.length === 0) {
    warn('No admin user found matching ADMIN_EMAIL_1 / ADMIN_EMAIL_2 — aborting for safety.');
    await mongoose.disconnect();
    return;
  }

  const adminIds = adminUsers.map(u => u._id);
  const adminEmails = adminUsers.map(u => u.email);
  console.log(`  Admin(s) to preserve:`);
  adminUsers.forEach(u => console.log(`    • ${u.name} <${u.email}>`));
  sep();

  // ── 2. Find all non-admin user IDs ────────────────────────────────────────
  const nonAdminUsers = await User.find({ _id: { $nin: adminIds } }).lean();
  const nonAdminIds   = nonAdminUsers.map(u => u._id);
  const nonAdminEmails = nonAdminUsers.map(u => u.email);

  if (nonAdminIds.length === 0) {
    warn('No non-admin users to delete. Database is already clean.');
    await mongoose.disconnect();
    return;
  }

  console.log(`  Non-admin users to delete (${nonAdminIds.length}):`);
  nonAdminUsers.forEach(u => console.log(`    • [${u.role || 'user'}] ${u.name} <${u.email}>`));
  sep();
  console.log('  Deleting data...\n');

  // ── 3. Delete user-scoped data ────────────────────────────────────────────

  const r1 = await User.deleteMany({ _id: { $in: nonAdminIds } });
  log('Users deleted', r1.deletedCount);

  const r2 = await Profile.deleteMany({ userId: { $in: nonAdminIds } });
  log('Profiles deleted', r2.deletedCount);

  const r3 = await MoodEntry.deleteMany({ user: { $in: nonAdminIds } });
  log('Mood entries deleted', r3.deletedCount);

  const r4 = await JournalEntry.deleteMany({ user: { $in: nonAdminIds } });
  log('Journal entries deleted', r4.deletedCount);

  const r5 = await IssueReport.deleteMany({ user: { $in: nonAdminIds } });
  log('Issue reports / AI assessments deleted', r5.deletedCount);

  const r6 = await EmergencyContact.deleteMany({ user: { $in: nonAdminIds } });
  log('Emergency contacts deleted', r6.deletedCount);

  const r7 = await Appointment.deleteMany({ user: { $in: nonAdminIds } });
  log('Appointments deleted', r7.deletedCount);

  const r8 = await WellnessPlan.deleteMany({ user: { $in: nonAdminIds } });
  log('Wellness plans deleted', r8.deletedCount);

  const r9 = await Goal.deleteMany({ userId: { $in: nonAdminIds } });
  log('Goals deleted', r9.deletedCount);

  const r10 = await PeerConnection.deleteMany({
    $or: [{ requester: { $in: nonAdminIds } }, { recipient: { $in: nonAdminIds } }]
  });
  log('Peer connections deleted', r10.deletedCount);

  const r11 = await AssessmentSession.deleteMany({ user: { $in: nonAdminIds } });
  log('Assessment sessions deleted', r11.deletedCount);

  const r12 = await AssessmentFeatureVector.deleteMany({ user: { $in: nonAdminIds } });
  log('Assessment feature vectors deleted', r12.deletedCount);

  const r13 = await AssessmentFusionResult.deleteMany({ user: { $in: nonAdminIds } });
  log('Assessment fusion results deleted', r13.deletedCount);

  const r14 = await ActivityLog.deleteMany({ user: { $in: nonAdminIds } });
  log('Activity logs deleted', r14.deletedCount);

  const r15 = await DeletionRequest.deleteMany({ user: { $in: nonAdminIds } });
  log('Deletion requests deleted', r15.deletedCount);

  const r16 = await Notification.deleteMany({ user: { $in: nonAdminIds } });
  log('Notifications deleted', r16.deletedCount);

  const r17 = await TherapistNote.deleteMany({ patient: { $in: nonAdminIds } });
  log('Therapist notes (patient-side) deleted', r17.deletedCount);

  // Clinician accounts — also remove their therapist listing if they had one
  const r18 = await Therapist.deleteMany({ email: { $in: nonAdminEmails } });
  log('Clinician therapist listings deleted', r18.deletedCount);

  // Admin-generated content (non-critical — keep blogs, group sessions, home config, quotes as they are app content)
  sep();
  warn('Blogs, Quotes, Group Sessions, HomeConfig, Institutions and Fitness content are kept (they are app-level content, not user data).');
  warn('Admin audit logs are kept.');

  // ── 4. Confirm remaining users ─────────────────────────────────────────────
  sep();
  const remaining = await User.find({}).lean();
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  REMAINING USERS IN DATABASE');
  console.log('══════════════════════════════════════════════════════════════════');
  remaining.forEach(u => {
    const isAdmin = adminEmails.includes((u.email || '').toLowerCase());
    const label = isAdmin ? '🔴 ADMIN' : (u.role === 'clinician' ? '🟡 CLINICIAN' : '🟢 USER');
    console.log(`  ${label}  ${u.name} <${u.email}>  [${u._id}]`);
  });
  console.log(`\n  Total remaining: ${remaining.length}`);
  console.log('══════════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

reset().catch(err => {
  console.error('\n❌  Reset failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
