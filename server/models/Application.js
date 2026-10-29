
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Rejected"
      ],
      default: "Applied"
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    }
  },
  { timestamps: true }
);

// A candidate can apply to a particular job only once.
applicationSchema.index(
  { applicant: 1, job: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);
