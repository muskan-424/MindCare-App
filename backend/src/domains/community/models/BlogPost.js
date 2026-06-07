const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    profilePic: { type: String, default: '' },
    image: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    section: { type: String, enum: ['featured', 'popular'], default: 'featured' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BlogPostSchema.index({ section: 1, active: 1 });

module.exports = mongoose.model('BlogPost', BlogPostSchema);
