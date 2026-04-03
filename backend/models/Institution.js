const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    metadata: {
        location: String,
        industry: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institution', InstitutionSchema);
