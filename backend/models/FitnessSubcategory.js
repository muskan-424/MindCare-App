const mongoose = require('mongoose');

const FitnessSubcategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FitnessSubcategorySchema.index({ categoryName: 1 });

module.exports = mongoose.model('FitnessSubcategory', FitnessSubcategorySchema);
