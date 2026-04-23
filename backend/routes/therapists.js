const express = require('express');
const router = express.Router();
const Therapist = require('../models/Therapist');

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
const { auth } = require('../middleware/auth');

// Seed data ... (already exists)

// ... existing routes ...

// ── GET /api/therapists/notes/:userId ───────────────────────────────────────
// Fetch all session notes for a specific patient (Therapist only)
router.get('/notes/:userId', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician'].includes(req.user.role)) {
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

// ── POST /api/therapists/notes ──────────────────────────────────────────────
// Save a new session note
router.post('/notes', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician'].includes(req.user.role)) {
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
    if (!['therapist', 'clinician'].includes(req.user.role)) {
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

