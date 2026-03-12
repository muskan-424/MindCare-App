const mongoose = require('mongoose');

const selfHelpTileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  screen: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { _id: false });

const contentCategorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { _id: false });

const HomeConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    selfHelpTiles: [selfHelpTileSchema],
    contentCategories: [contentCategorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeConfig', HomeConfigSchema);
