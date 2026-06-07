const mongoose = require('mongoose');

// The individual daily task embedded schema
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['breathing', 'journal', 'meditation', 'reading', 'activity', 'custom'],
    required: true,
  },
  description: { type: String, default: '' },
  resourceLink: { type: String, default: '' }, // e.g., link to a specific breathing exercise or article
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

// A day's worth of tasks
const DailyPlanSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true }, // 1 to 30
  date: { type: Date }, // Optional: specific date the user should do this
  tasks: [TaskSchema],
});

// The main Wellness Plan Schema
const WellnessPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // User's initial request/questionnaire
    goals: [{ type: String }], // e.g., 'Reduce Anxiety', 'Better Sleep', 'Manage Work Stress'
    currentStruggles: { type: String, default: '' },
    preferredPace: { type: String, enum: ['Relaxed', 'Moderate', 'Intense'], default: 'Moderate' },
    
    // Admin fields
    status: {
      type: String,
      enum: ['awaiting_admin', 'active', 'completed', 'cancelled'],
      default: 'awaiting_admin',
    },
    planDurationDays: { type: Number, default: 30 },
    planFocus: { type: String, default: '' }, // Admin summary of the plan's focus
    adminNote: { type: String, default: '' }, // A generic welcome/encouragement note from the admin
    
    // The actual plan
    dailyPlans: [DailyPlanSchema],
    
    // Progress tracking
    startDate: { type: Date },
    endDate: { type: Date },
    totalTasksCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WellnessPlanSchema.index({ user: 1 });
WellnessPlanSchema.index({ status: 1 });

module.exports = mongoose.model('WellnessPlan', WellnessPlanSchema);
