const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  label: { type: String, required: true },  // e.g. "Meditate 3 times"
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { _id: true });

const GoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:  { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ['mental_health', 'fitness', 'social', 'academic', 'self_care', 'sleep', 'other'],
      default: 'mental_health',
    },
    targetDate: { type: Date },
    // 0-100 integer for manual progress slider updates by the user
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    milestones: [MilestoneSchema],
  },
  { timestamps: true }
);

// Auto-complete if progress hits 100
GoalSchema.pre('save', function (next) {
  if (this.progress >= 100 && this.status !== 'completed') {
    this.status = 'completed';
  }
  next();
});

module.exports = mongoose.model('Goal', GoalSchema);
