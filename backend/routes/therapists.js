const express = require('express');
const router = express.Router();
const Therapist = require('../models/Therapist');
const { auth } = require('../middleware/auth');

// Seed data used only if the database is empty.
const SEED_THERAPISTS = [
  {
    name: 'Dr. Brain Wofe',
    specialisation: 'Psychologist',
    img: 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'brain@hotmail.com',
    contact_no: '123456788',
    timing: '4:30 PM - 8:30 PM',
    fee: '$15/session',
    stars: 5,
  },
  {
    name: 'Dr. Selkon Kane',
    specialisation: 'Psychiatrist',
    img: 'https://www.ayurvedaconsultants.com/frontEndFiles/images/doctor-circle.jpg',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'kane_selkon12@gmail.com',
    contact_no: '123456788',
    timing: '5:30 PM - 9:30 PM',
    fee: '$10/session',
    stars: 5,
  },
  {
    name: 'Dr. SN Mohanty',
    specialisation: 'Counsellor',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRUi3Cot4kn3qaJfO7i9b4gWrs-f2OHUH7tfQ&usqp=CAU',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'official_sn1889@gmail.com',
    contact_no: '12345688',
    timing: '5:00 PM - 9:00 PM',
    fee: '$15/session',
    stars: 5,
  },
  {
    name: 'Kate Williams',
    specialisation: 'Social Worker',
    img:
      'https://images.squarespace-cdn.com/content/v1/5e24e80299d8c23d1391ff77/1580455910868-CFM7L73ID2TJ36JNYRZX/ke17ZwdGBToddI8pDm48KJK4Mm1kch8SFO9ZNkN1NT97gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QHyNOqBUUEtDDsRWrJLTmN9YSRtfoTLg6dUq-6F17A0FFZK5fArcnK1IqGweyunyWChwIwkIJ_P7MaZif-uMs/Amber-Chow-Career-Counsellor-Burnaby-Circle.png',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'official_sn1889@gmail.com',
    contact_no: '12345688',
    timing: '5:00 PM - 9:00 PM',
    fee: '$15/session',
    stars: 5,
  },
];

const SEED_THERAPIST_CATEGORIES = [
  { id: '1', name: 'Psychologist', icon: 'https://cdn-icons-png.flaticon.com/512/2785/2785819.png', order: 0 },
  { id: '2', name: 'Psychiatrist', icon: 'https://cdn-icons-png.flaticon.com/512/3308/3308392.png', order: 1 },
  { id: '3', name: 'Counsellor', icon: 'https://cdn-icons-png.flaticon.com/512/2461/2461102.png', order: 2 },
  { id: '4', name: 'Social Worker', icon: 'https://cdn-icons-png.flaticon.com/512/3179/3179068.png', order: 3 },
];

async function ensureSeeded() {
  const count = await Therapist.countDocuments();
  if (count === 0) {
    await Therapist.insertMany(SEED_THERAPISTS);
  }
}

// GET /api/therapists
router.get('/', async (_req, res) => {
  try {
    await ensureSeeded();
    const therapists = await Therapist.find({ active: true }).sort({ name: 1 }).lean();
    res.json(
      therapists.map(t => ({
        id: String(t._id),
        name: t.name,
        specialisation: t.specialisation,
        img: t.img,
        bio: t.bio,
        email: t.email,
        contact_no: t.contact_no,
        timing: t.timing,
        fee: t.fee,
        stars: t.stars,
      }))
    );
  } catch (err) {
    console.error('Error fetching therapists:', err.message);
    res.status(500).json({ error: 'Failed to load therapists' });
  }
});

// GET /api/therapists/me
router.get('/me', auth, async (req, res) => {
  try {
    let t = await Therapist.findOne({ userId: req.user.id }).lean();

    // Fallback: for older clinician accounts where userId wasn't set,
    // find by email and auto-link the userId for future lookups.
    if (!t) {
      const User = require('../models/User');
      const user = await User.findById(req.user.id).lean();
      if (user) {
        t = await Therapist.findOneAndUpdate(
          { email: user.email },
          { $set: { userId: user._id } },
          { new: true }
        ).lean();
      }
    }

    if (!t) return res.status(404).json({ error: 'Therapist profile not found' });

    res.json({
      id: String(t._id),
      name: t.name,
      specialisation: t.specialisation,
      img: t.img || 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png',
      bio: t.bio || 'Your bio here',
      email: t.email,
      contact_no: t.contact_no || '12345678',
      timing: t.timing || '9:00 AM - 5:00 PM',
      fee: t.fee || '$50/session',
      stars: t.stars || 5,
    });
  } catch (err) {
    console.error('Error fetching therapist self:', err.message);
    res.status(500).json({ error: 'Failed to load therapist profile' });
  }
});

// GET /api/therapists/categories — browse-by-type categories (live from backend, fallback to seed)
router.get('/categories', async (_req, res) => {
  try {
    const categories = SEED_THERAPIST_CATEGORIES.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json(categories);
  } catch (err) {
    console.error('Error fetching therapist categories:', err.message);
    res.status(500).json(SEED_THERAPIST_CATEGORIES);
  }
});

const TherapistNote = require('../models/TherapistNote');
const User = require('../models/User');
const Profile = require('../models/Profile');
const AssessmentFusionResult = require('../models/AssessmentFusionResult');
const IssueReport = require('../models/IssueReport');
const MoodEntry = require('../models/MoodEntry');
const JournalEntry = require('../models/JournalEntry');
// ── Clinical / Notes routes ─────────────────────────────────────────────────

// ── GET /api/therapists/notes/:userId ───────────────────────────────────────
// Fetch all session notes for a specific patient (Therapist only)
router.get('/notes/:userId', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Clinician only' });
    }

    const notes = await TherapistNote.find({
      patient: req.params.userId,
      therapist: req.user.id
    })
    .sort({ sessionDate: -1 })
    .lean();

    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ── GET /api/therapists/patient/:userId/profile ─────────────────────────────
// Fetch full clinical profile (AI assessments, reports, moods, journals)
router.get('/patient/:userId/profile', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Clinician only' });
    }

    const userId = req.params.userId;
    const [user, profile, fusions, issues, moods, journals] = await Promise.all([
      User.findById(userId).lean(),
      Profile.findOne({ userId }).lean(),
      AssessmentFusionResult.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      IssueReport.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      MoodEntry.find({ user: userId }).sort({ date: -1 }).lean(),
      JournalEntry.find({ user: userId }).sort({ date: -1 }).lean(),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, age: user.age, gender: user.gender },
      profile,
      fusions: fusions.map(f => ({ id: String(f._id), riskLevel: f.riskLevel, riskScore: f.riskScore, aiMarkers: f.aiMarkers, recommendations: f.recommendations, createdAt: f.createdAt })),
      issues: issues.map(i => ({ id: String(i._id), category: i.category, severity: i.severity, riskLevel: i.riskLevel, safetyTriggered: i.safetyTriggered, createdAt: i.createdAt })),
      moods: moods.map(m => ({ id: String(m._id), rating: m.rating, note: m.note, date: m.date })),
      journals: journals.map(j => ({ id: String(j._id), title: j.title, contentPreview: j.content?.substring(0, 50) + '...', date: j.date })),
    });
  } catch (err) {
    console.error('Clinician full profile error:', err.message);
    res.status(500).json({ error: 'Failed to load full profile' });
  }
});

// ── POST /api/therapists/notes ──────────────────────────────────────────────
// Save a new session note
router.post('/notes', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Clinician only' });
    }

    const { patientId, sessionDate, content, category, confidentialityLevel } = req.body;
    if (!patientId || !content) {
      return res.status(400).json({ error: 'patientId and content are required' });
    }

    const note = new TherapistNote({
      patient: patientId,
      therapist: req.user.id,
      sessionDate: sessionDate || new Date(),
      content,
      category: category || 'Progress',
      confidentialityLevel: confidentialityLevel || 1
    });

    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error('Note creation error:', err.message);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// ── DELETE /api/therapists/notes/:id ────────────────────────────────────────
// Remove a note (only by the therapist who wrote it)
router.delete('/notes/:id', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const note = await TherapistNote.findOneAndDelete({
      _id: req.params.id,
      therapist: req.user.id
    });

    if (!note) return res.status(404).json({ error: 'Note not found or unauthorized' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;

