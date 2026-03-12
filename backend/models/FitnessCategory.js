const mongoose = require('mongoose');

const FitnessCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FitnessCategory', FitnessCategorySchema);
