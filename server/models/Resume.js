
const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    originalFileName: {
      type: String,
      required: true
    },

    extractedText: {
      type: String,
      default: ""
    },

    skills: {
      type: [String],
      default: []
    },

    // Candidate's current city
    currentLocation: {
      type: String,
      default: ""
    },

    // Candidate's preferred job location
    preferredLocation: {
      type: String,
      default: ""
    },

    // Whether the candidate is willing to relocate
    willingToRelocate: {
      type: Boolean,
      default: false
    },

    willingToLearn: {
        type: Boolean,
        default: false
    },

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Resume", resumeSchema);
