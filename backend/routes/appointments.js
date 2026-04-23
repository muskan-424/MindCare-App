const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');

// POST /api/appointments — submit a consultation REQUEST (no therapist assigned yet)
router.post('/', auth, async (req, res) => {
  try {
    const { requestedSpeciality, preferredDates, preferredTime, userNote } = req.body;

    const appointment = new Appointment({
      user: req.user.id,
      requestedSpeciality: requestedSpeciality || '',
      preferredDates: preferredDates || [],
      preferredTime: preferredTime || 'any',
      userNote: userNote?.trim() || '',
      status: 'awaiting_admin',
    });
    await appointment.save();

    res.status(201).json({
      id: appointment._id,
      requestedSpeciality: appointment.requestedSpeciality,
      preferredDates: appointment.preferredDates,
      preferredTime: appointment.preferredTime,
      userNote: appointment.userNote,
      status: appointment.status,
      createdAt: appointment.createdAt,
      message: 'Your consultation request has been submitted. An admin will assign a therapist and confirm your slot shortly.',
    });
  } catch (err) {
    console.error('Book appointment error:', err.message);
    res.status(500).json({ error: 'Failed to submit consultation request' });
  }
});

// GET /api/appointments — user's own appointments (all statuses)
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('therapist', 'name img specialisation timing fee email contact_no')
      .lean();

    res.json(appointments.map(a => ({
      id: String(a._id),
      requestedSpeciality: a.requestedSpeciality,
      preferredDates: a.preferredDates,
      preferredTime: a.preferredTime,
      userNote: a.userNote,
      therapistId: a.therapist ? String(a.therapist._id) : null,
      therapistName: a.therapist?.name || null,
      therapistImg: a.therapist?.img || null,
      specialisation: a.therapist?.specialisation || null,
      date: a.date || null,
      timeSlot: a.timeSlot || null,
      adminNote: a.adminNote,
      status: a.status,
      createdAt: a.createdAt,
    })));
  } catch (err) {
    console.error('Get appointments error:', err.message);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// GET /api/appointments/therapist/me — therapist/clinician sees their assigned patients
router.get('/therapist/me', auth, async (req, res) => {
  try {
    const allowedRoles = ['therapist', 'clinician', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Clinician role required' });
    }
    
    // Step 1: Find the Therapist listing linked to this clinician User account
    const Therapist = require('../models/Therapist');
    const listing = await Therapist.findOne({ userId: req.user.id }).lean();
    
    if (!listing) {
      // If the clinician isn't linked to a Therapist listing, they have no assigned patients
      return res.json([]);
    }

    // Step 2: Fetch appointments assigned to that Therapist listing
    const appointments = await Appointment.find({ therapist: listing._id })
      .populate('user', 'name email age gender')
      .sort({ createdAt: -1 })
      .lean();
    res.json(appointments);
  } catch (err) {
    console.error('Therapist patients fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load assigned patients' });
  }
});

// PATCH /api/appointments/:id/cancel — user cancels own pending request
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed appointment' });

    appt.status = 'cancelled';
    await appt.save();
    res.json({ success: true, status: appt.status });
  } catch (err) {
    console.error('Cancel appointment error:', err.message);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Helper: parse timing string into 30-min slots
function generateSlots(timingStr) {
  if (!timingStr) return [];
  try {
    const parts = timingStr.split(' - ');
    if (parts.length !== 2) return [];
    const start = parseTime(parts[0].trim());
    const end = parseTime(parts[1].trim());
    const slots = [];
    let current = start;
    while (current < end) {
      slots.push(formatTime(current));
      current += 30;
    }
    return slots;
  } catch (e) {
    return [];
  }
}

function parseTime(str) {
  const [time, period] = str.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + (m || 0);
}

function formatTime(minutes) {
  let h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

module.exports = router;
module.exports.generateSlots = generateSlots;
