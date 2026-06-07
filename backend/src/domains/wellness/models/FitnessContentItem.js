const mongoose = require('mongoose');

const FitnessContentItemSchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true },
    subcategoryName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    videoId: { type: String, default: '' },
  },
  { timestamps: true }
);

FitnessContentItemSchema.index({ categoryName: 1, subcategoryName: 1 });

module.exports = mongoose.model('FitnessContentItem', FitnessContentItemSchema);
