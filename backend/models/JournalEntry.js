const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

JournalEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
