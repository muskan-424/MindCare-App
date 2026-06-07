const mongoose = require('mongoose');

const PeerConnectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    sharedConcerns: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Index to quickly find connections for a user and avoid duplicates
PeerConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('PeerConnection', PeerConnectionSchema);
