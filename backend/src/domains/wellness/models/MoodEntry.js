const mongoose = require('mongoose');

const MoodEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MoodEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('MoodEntry', MoodEntrySchema);
