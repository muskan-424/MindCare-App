/**
 * MindCare — User Portal Test Seed Script
 * =========================================
 * Creates a clean test user + full set of related data to exercise
 * every major feature in the user portal.
 *
 * Usage:
 *   cd backend
 *   node scripts/seedTestUser.js
 *
 * Test credentials after running:
 *   Email    : test@mindcare.com
 *   Password : Test@1234
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ──────────────────────────────────────────────────────────────────
const User            = require('../models/User');
const Profile         = require('../models/Profile');
const MoodEntry       = require('../models/MoodEntry');
const IssueReport     = require('../models/IssueReport');
const JournalEntry    = require('../models/JournalEntry');
const EmergencyContact = require('../models/EmergencyContact');
const Appointment     = require('../models/Appointment');
const WellnessPlan    = require('../models/WellnessPlan');
const Goal            = require('../models/Goal');

// ── Helpers ──────────────────────────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
};

const log  = (msg)      => console.log(`  ✅  ${msg}`);
const warn = (msg)      => console.log(`  ⚠️   ${msg}`);
const sep  = ()         => console.log('');

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n🌱  MindCare Test Seed Starting...\n');
  console.log('━'.repeat(48));

  // ── 1. Clean up any existing test user ─────────────────────────────────────
  const existing = await User.findOne({ email: 'test@mindcare.com' });
  if (existing) {
    const uid = existing._id;
    await Promise.all([
      User.deleteOne({ _id: uid }),
      Profile.deleteMany({ userId: uid }),
      MoodEntry.deleteMany({ user: uid }),
      IssueReport.deleteMany({ user: uid }),
      JournalEntry.deleteMany({ user: uid }),
      EmergencyContact.deleteMany({ user: uid }),
      Appointment.deleteMany({ user: uid }),
      WellnessPlan.deleteMany({ user: uid }),
      Goal.deleteMany({ user: uid }),
    ]);
    warn('Previous test user & data cleared');
  }

  // ── 2. Create User ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Test@1234', 10);
  const user = await User.create({
    name:     'Test User',
    email:    'test@mindcare.com',
    password: passwordHash,
    age:      '22',
    gender:   'female',
    role:     'user',
  });
  log(`User created  →  test@mindcare.com  /  Test@1234`);

  const uid = user._id;

  // ── 3. Profile ──────────────────────────────────────────────────────────────
  await Profile.create({
    userId:   uid,
    name:     'Test User',
    email:    'test@mindcare.com',
    phone_no: '+91-9000000001',
    age:      '22',
    gender:   'female',
    bio:      'This is a seeded test account for QA purposes.',
    concerns: ['anxiety', 'academic_stress', 'sleep'],
    isPeerMatchingEnabled: true,
    peerBio:  'Looking to connect with others managing similar challenges.',
  });
  log('Profile created');

  // ── 4. Mood Entries (14 days of history) ────────────────────────────────────
  const moodData = [
    { n: 13, rating: 4, note: 'Had a tough morning but got through it.' },
    { n: 12, rating: 6, note: 'Decent day overall.' },
    { n: 11, rating: 3, note: 'Feeling really anxious about exams.' },
    { n: 10, rating: 5, note: '' },
    { n: 9,  rating: 7, note: 'Good session with the therapist.' },
    { n: 8,  rating: 4, note: 'Tired after a long day.' },
    { n: 7,  rating: 6, note: 'Breathing exercises helped.' },
    { n: 6,  rating: 8, note: 'Felt really positive today!' },
    { n: 5,  rating: 5, note: 'Average day.' },
    { n: 4,  rating: 3, note: 'Insomnia last night.' },
    { n: 3,  rating: 6, note: 'Journaled a lot.' },
    { n: 2,  rating: 7, note: 'Getting better gradually.' },
    { n: 1,  rating: 6, note: 'Almost back to normal.' },
    // NOTE: No entry for today — so the app will trigger the intake assessment on login
  ];
  await MoodEntry.insertMany(
    moodData.map(({ n, rating, note }) => ({ user: uid, rating, note, date: daysAgo(n) }))
  );
  log(`${moodData.length} mood entries created (no entry today → will trigger assessment on login)`);

  // ── 5. AI Issue Reports / Assessments ───────────────────────────────────────
  const reports = await IssueReport.insertMany([
    {
      user: uid,
      category: 'anxiety',
      severity: 4,
      description: 'I have been experiencing significant anxiety before any public event.',
      moodTag: 'anxious',
      sentimentScore: -0.65,
      riskLevel: 'HIGH',
      emotionTags: ['anxious', 'overwhelmed'],
      recommendations: [
        'Practice the 4-7-8 breathing technique daily.',
        'Consider journaling your triggers.',
        'Speak with a therapist about cognitive reframing.',
      ],
      safetyTriggered: false,
      escalated: true,
      escalatedAt: daysAgo(10),
      adminVerified: false,
      adminAction: 'none',
      createdAt: daysAgo(10),
    },
    {
      user: uid,
      category: 'sleep',
      severity: 3,
      description: 'I have been having trouble sleeping for the past week.',
      moodTag: 'tired',
      sentimentScore: -0.35,
      riskLevel: 'MEDIUM',
      emotionTags: ['tired', 'sad'],
      recommendations: [
        'Maintain a consistent sleep schedule.',
        'Avoid screens 1 hour before bed.',
        'Try a guided sleep meditation.',
      ],
      safetyTriggered: false,
      escalated: false,
      adminVerified: true,
      adminNote: 'Referred to sleep hygiene resources.',
      adminAction: 'referred',
      createdAt: daysAgo(5),
    },
  ]);
  log(`${reports.length} AI assessment reports created (1 escalated HIGH, 1 verified MEDIUM)`);

  // ── 6. Journal Entries ──────────────────────────────────────────────────────
  await JournalEntry.insertMany([
    {
      user: uid,
      title: 'First day using MindCare',
      content: 'I decided to start tracking my mental health. Feeling a bit nervous but hopeful.',
      mood: 'hopeful',
      tags: ['new start', 'hopeful'],
      createdAt: daysAgo(13),
    },
    {
      user: uid,
      title: 'Anxiety spike – exam week',
      content: 'Could not sleep last night. My heart was racing thinking about the presentation. I need to try the breathing exercises.',
      mood: 'anxious',
      tags: ['anxiety', 'exams', 'breathing'],
      createdAt: daysAgo(11),
    },
    {
      user: uid,
      title: 'Feeling better',
      content: 'The breathing technique actually helped. I felt more grounded during the exam. Small wins count.',
      mood: 'calm',
      tags: ['progress', 'breathing', 'calm'],
      createdAt: daysAgo(7),
    },
    {
      user: uid,
      title: 'Gratitude entry',
      content: 'Grateful for: 1. The support app. 2. My friend who listened. 3. A good cup of tea.',
      mood: 'okay',
      tags: ['gratitude'],
      createdAt: daysAgo(3),
    },
  ]);
  log('4 journal entries created');

  // ── 7. Emergency Contact ────────────────────────────────────────────────────
  await EmergencyContact.create({
    user:         uid,
    name:         'Priya Sharma',
    relationship: 'Sister',
    phone:        '+91-9876543210',
    reachVia:     'whatsapp',
    userMessage:  'Please reach my sister Priya if I am in distress and unreachable.',
    consentGiven: true,
    status:       'awaiting_admin',
    createdAt:    daysAgo(8),
  });
  log('Emergency contact created (status: awaiting_admin — visible in admin Actions tab)');

  // ── 8. Appointment ──────────────────────────────────────────────────────────
  // Re-use or find a therapist
  const Therapist = require('../models/Therapist');
  let therapist = await Therapist.findOne({ active: true });
  if (!therapist) {
    therapist = await Therapist.create({
      name: 'Dr. Ananya Mehta',
      specialty: 'Cognitive Behavioral Therapy',
      bio: 'Specialist in anxiety, depression, and stress management.',
      slots: ['Mon 10am', 'Wed 2pm', 'Fri 11am'],
      active: true,
    });
    log('Created a test therapist: Dr. Ananya Mehta');
  }

  await Appointment.create({
    user:        uid,
    therapist:   therapist._id,
    slot:        'Wed 2pm',
    status:      'confirmed',
    notes:       'First consultation — focus on anxiety management strategies.',
    createdAt:   daysAgo(4),
  });
  log(`Appointment created with ${therapist.name}`);

  // ── 9. Wellness Plan ────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  await WellnessPlan.create({
    user:            uid,
    goals:           ['Reduce Anxiety', 'Better Sleep', 'Build Positive Habits'],
    currentStruggles: 'Feeling overwhelmed with academic pressure and struggling to sleep.',
    preferredPace:   'Moderate',
    status:          'active',
    planDurationDays: 30,
    planFocus:       'Anxiety & Sleep Restoration',
    adminNote:       'Great progress so far — keep going one day at a time!',
    startDate:       today,
    endDate:         endDate,
    totalTasksCompleted: 3,
    dailyPlans: [
      {
        dayNumber: 1,
        date: today,
        tasks: [
          { title: 'Morning Breathing (4-7-8)', type: 'breathing', description: 'Do 3 cycles of the 4-7-8 breathing exercise.', completed: true, completedAt: today },
          { title: 'Gratitude Journal', type: 'journal', description: 'Write 3 things you are grateful for.', completed: true, completedAt: today },
          { title: 'Evening Walk (15 min)', type: 'activity', description: 'Go for a short mindful walk.', completed: false },
        ],
      },
      {
        dayNumber: 2,
        date: new Date(today.getTime() + 86400000),
        tasks: [
          { title: 'Guided Meditation (10 min)', type: 'meditation', description: 'Follow a 10-minute anxiety relief meditation.', completed: false },
          { title: 'Read about Sleep Hygiene', type: 'reading', description: 'Read one article on sleep hygiene tips.', completed: true, completedAt: today },
          { title: 'No screens 1hr before bed', type: 'custom', description: 'Practice screen-free wind-down routine.', completed: false },
        ],
      },
      {
        dayNumber: 3,
        date: new Date(today.getTime() + 2 * 86400000),
        tasks: [
          { title: 'CBT Thought Journal', type: 'journal', description: 'Log a negative thought and reframe it positively.', completed: false },
          { title: 'Body Scan (15 min)', type: 'meditation', description: 'Do a full body scan relaxation.', completed: false },
        ],
      },
    ],
  });
  log('Wellness Plan created (active, 30-day, 3 tasks completed)');

  // ── 10. Goals ───────────────────────────────────────────────────────────────
  await Goal.insertMany([
    {
      userId:      uid,
      title:       'Meditate for 7 consecutive days',
      description: 'Build a daily meditation habit to reduce anxiety.',
      category:    'mental_health',
      targetDate:  new Date(today.getTime() + 7 * 86400000),
      status:      'active',
      progress:    43, // 3 of 7 days ≈ 43%
      milestones: [
        { label: 'Meditate on Day 1', completed: true, completedAt: daysAgo(3) },
        { label: 'Meditate on Day 2', completed: true, completedAt: daysAgo(2) },
        { label: 'Meditate on Day 3', completed: true, completedAt: daysAgo(1) },
        { label: 'Meditate on Day 4', completed: false },
      ],
    },
    {
      userId:      uid,
      title:       'Write 10 journal entries',
      description: 'Track thoughts and emotions through regular journaling.',
      category:    'self_care',
      targetDate:  new Date(today.getTime() + 14 * 86400000),
      status:      'active',
      progress:    40, // 4 of 10 entries ≈ 40%
      milestones: [
        { label: 'First entry', completed: true, completedAt: daysAgo(13) },
        { label: '3 entries', completed: true, completedAt: daysAgo(11) },
        { label: '5 entries', completed: false },
        { label: '10 entries', completed: false },
      ],
    },
    {
      userId:      uid,
      title:       'Sleep before midnight for 5 days',
      description: 'Improve sleep schedule by establishing a consistent bedtime.',
      category:    'sleep',
      targetDate:  new Date(today.getTime() + 5 * 86400000),
      status:      'completed',
      progress:    100,
      milestones: [
        { label: 'Day 1 done', completed: true, completedAt: daysAgo(10) },
        { label: 'Day 3 done', completed: true, completedAt: daysAgo(8) },
        { label: 'Day 5 done', completed: true, completedAt: daysAgo(6) },
      ],
    },
  ]);
  log('3 goals created (2 active, 1 completed)');

  // ── Summary ──────────────────────────────────────────────────────────────────
  sep();
  console.log('━'.repeat(48));
  console.log('\n🎉  Seed Complete! Test account ready:\n');
  console.log('  ┌─────────────────────────────────────┐');
  console.log('  │  📧  Email    : test@mindcare.com   │');
  console.log('  │  🔑  Password : Test@1234           │');
  console.log('  └─────────────────────────────────────┘\n');
  console.log('  What to expect on first login:');
  console.log('  → Assessment screen appears (no mood logged today)');
  console.log('  → Home screen shows burnout/wellness data');
  console.log('  → 14 days of mood history in Mood Tracker');
  console.log('  → 4 journal entries in Journal');
  console.log('  → Active Wellness Plan with Day 1–3 tasks');
  console.log('  → 3 goals (2 active, 1 completed)');
  console.log('  → 1 emergency contact (pending admin approval)');
  console.log('  → 1 confirmed appointment');
  console.log('');
  console.log('  Admin Portal test items:');
  console.log('  → Actions tab: 1 escalated HIGH risk report to verify');
  console.log('  → Actions tab: 1 emergency contact pending approval');
  console.log('  → Users tab: test@mindcare.com with role=user');
  console.log('');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
