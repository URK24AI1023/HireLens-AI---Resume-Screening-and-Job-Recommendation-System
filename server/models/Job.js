
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Remote"],
      default: "Full-time"
    },
    description: {
      type: String,
      required: true
    },
    requiredSkills: {
      type: [String],
      required: true
    },
    experience: {
      type: String,
      default: "Fresher"
    },
    salary: {
      type: String,
      default: "Not disclosed"
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Job", jobSchema);
