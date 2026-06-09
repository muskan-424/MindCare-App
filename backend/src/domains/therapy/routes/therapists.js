const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Therapist = require('../models/Therapist');
const { auth } = require('../../../../middleware/auth');
const therapistOnly = require('../../../../middleware/therapistOnly');
const {
  shapeTherapistListing,
  shapeTherapistProfile,
  shapeTherapistNote,
  shapeTherapistNotes,
  shapeClinicalPatientProfile,
} = require('../../../shared/responseShapers');

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
    const User = require('../../identity/models/User');
    const clinicians = await User.find({ role: { $in: ['clinician', 'therapist'] } }).lean();
    const therapists = await Therapist.find({ active: true }).lean();

    const results = [];
    const seenEmails = new Set();

    therapists.forEach(t => {
      const isSeeded = ['Dr. Brain Wofe', 'Dr. Selkon Kane', 'Dr. SN Mohanty', 'Kate Williams'].includes(t.name);
      if (!isSeeded && t.email) {
        seenEmails.add(t.email.toLowerCase());
        results.push(shapeTherapistListing({
          ...t,
          bio: t.bio || 'Licensed clinician specializing in mental wellness.',
        }));
      }
    });

    clinicians.forEach(u => {
      if (!seenEmails.has(u.email.toLowerCase())) {
        seenEmails.add(u.email.toLowerCase());
        results.push(shapeTherapistListing({
          _id: u._id,
          name: u.name || 'Professional Clinician',
          specialisation: u.role === 'clinician' ? 'Clinical Psychologist' : 'Psychiatrist',
          img: 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png',
          bio: 'Licensed mental health professional dedicated to patient care and wellness.',
          email: u.email,
          contact_no: u.contact_no || '',
          timing: '9:00 AM - 5:00 PM',
          fee: '$15/session',
          stars: 5,
        }));
      }
    });

    res.json(results.sort((a, b) => a.name.localeCompare(b.name)));
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
      const User = require('../../identity/models/User');
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

    res.json(shapeTherapistProfile(t));
  } catch (err) {
    console.error('Error fetching therapist self:', err.message);
    res.status(500).json({ error: 'Failed to load therapist profile' });
  }
});

// PUT /api/therapists/me - update therapist self profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, specialisation, bio, email, contact_no, timing, fee, img } = req.body;
    let t = await Therapist.findOne({ userId: req.user.id });
    if (!t) {
      t = new Therapist({ userId: req.user.id });
    }
    if (name !== undefined) t.name = name;
    if (specialisation !== undefined) t.specialisation = specialisation;
    if (bio !== undefined) t.bio = bio;
    if (email !== undefined) t.email = email;
    if (contact_no !== undefined) t.contact_no = contact_no;
    if (timing !== undefined) t.timing = timing;
    if (fee !== undefined) t.fee = fee;
    if (img !== undefined) t.img = img;
    await t.save();
    res.json(shapeTherapistProfile(t));
  } catch (err) {
    console.error('Error updating therapist self:', err.message);
    res.status(500).json({ error: 'Failed to update therapist profile' });
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
const User = require('../../identity/models/User');
const Profile = require('../../identity/models/Profile');
const AssessmentFusionResult = require('../../assessment/models/AssessmentFusionResult');
const IssueReport = require('../../admin/models/IssueReport');
const MoodEntry = require('../../wellness/models/MoodEntry');
const JournalEntry = require('../../wellness/models/JournalEntry');
// ── Clinical / Notes routes ─────────────────────────────────────────────────

// ── GET /api/therapists/notes/:userId ───────────────────────────────────────
// Fetch all session notes for a specific patient (Therapist only)
router.get('/notes/:userId', auth, therapistOnly, async (req, res) => {
  try {
    const notes = await TherapistNote.find({
      patient: req.params.userId,
      therapist: req.user.id
    })
    .sort({ sessionDate: -1 })
    .lean();

    res.json(shapeTherapistNotes(notes));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ── GET /api/therapists/patient/:userId/profile ─────────────────────────────
// Fetch full clinical profile (AI assessments, reports, moods, journals)
router.get('/patient/:userId/profile', auth, therapistOnly, async (req, res) => {
  try {
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

    res.json(shapeClinicalPatientProfile({ user, profile, fusions, issues, moods, journals }));
  } catch (err) {
    console.error('Clinician full profile error:', err.message);
    res.status(500).json({ error: 'Failed to load full profile' });
  }
});

// ── POST /api/therapists/notes ──────────────────────────────────────────────
// Save a new session note
router.post(
  '/notes',
  auth,
  therapistOnly,
  [
    body('patientId', 'patientId must be a valid MongoDB ObjectId').isMongoId(),
    body('content', 'content is required')
      .isString().trim().notEmpty()
      .isLength({ max: 5000 }).withMessage('Session note cannot exceed 5,000 characters'),
    body('category')
      .optional()
      .isIn(['Progress', 'Clinical', 'Crisis', 'Follow-up'])
      .withMessage('category must be one of: Progress, Clinical, Crisis, Follow-up'),
    body('confidentialityLevel')
      .optional()
      .isInt({ min: 1, max: 3 })
      .withMessage('confidentialityLevel must be 1 (Low), 2 (Medium), or 3 (High)'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { patientId, sessionDate, content, category, confidentialityLevel } = req.body;

      const note = new TherapistNote({
        patient: patientId,
        therapist: req.user.id,
        sessionDate: sessionDate || new Date(),
        content,
        category: category || 'Progress',
        confidentialityLevel: confidentialityLevel || 1
      });

      await note.save();
      res.status(201).json(shapeTherapistNote(note));
    } catch (err) {
      console.error('Note creation error:', err.message);
      res.status(500).json({ error: 'Failed to save note' });
    }
  }
);

// ── DELETE /api/therapists/notes/:id ────────────────────────────────────────
// Remove a note (only by the therapist who wrote it)
router.delete('/notes/:id', auth, therapistOnly, async (req, res) => {
  try {
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

// ── PATCH /api/therapists/notes/:id ────────────────────────────────────────────
// Update an existing session note (only the therapist who wrote it)
router.patch('/notes/:id', auth, async (req, res) => {
  try {
    if (!['therapist', 'clinician', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { content, category, confidentialityLevel } = req.body;
    const VALID_CATEGORIES = ['Progress', 'Clinical', 'Crisis', 'Follow-up'];

    if (content !== undefined && !content.trim()) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (confidentialityLevel !== undefined && ![1, 2, 3].includes(Number(confidentialityLevel))) {
      return res.status(400).json({ error: 'confidentialityLevel must be 1, 2, or 3' });
    }

    const note = await TherapistNote.findOneAndUpdate(
      { _id: req.params.id, therapist: req.user.id },
      {
        $set: {
          ...(content !== undefined && { content: content.trim() }),
          ...(category !== undefined && { category }),
          ...(confidentialityLevel !== undefined && { confidentialityLevel: Number(confidentialityLevel) }),
        }
      },
      { new: true }
    );

    if (!note) return res.status(404).json({ error: 'Note not found or unauthorized' });
    res.json(shapeTherapistNote(note));
  } catch (err) {
    console.error('Note update error:', err.message);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

module.exports = router;

