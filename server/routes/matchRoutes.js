
const express = require("express");
const mongoose = require("mongoose");

const Resume = require("../models/Resume");
const Job = require("../models/Job");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Normalize text for case-insensitive comparisons
const normalize = (value) =>
  String(value || "").trim().toLowerCase();

// POST: Compare a resume with a job
router.post("/:jobId", protect, async (req, res) => {
  try {
    if (req.user.role !== "jobseeker") {
      return res.status(403).json({
        message: "Only job seekers can use resume matching"
      });
    }

    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID"
      });
    }

    // Get the latest resume belonging to this user
    const resume = await Resume.findOne({
      user: req.user.id
    }).sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({
        message: "Please upload a resume before matching"
      });
    }

    // Find the selected active job
    const job = await Job.findOne({
      _id: jobId,
      isActive: true
    });

    if (!job) {
      return res.status(404).json({
        message: "Active job not found"
      });
    }

    // 1. SKILL MATCHING
    const resumeSkills = new Set(
      (resume.skills || []).map(normalize).filter(Boolean)
    );

    const requiredSkills = [
      ...new Set(
        (job.requiredSkills || [])
          .map(normalize)
          .filter(Boolean)
      )
    ];

    const matchedSkills = requiredSkills.filter(
      (skill) => resumeSkills.has(skill)
    );

    const missingSkills = requiredSkills.filter(
      (skill) => !resumeSkills.has(skill)
    );

    const matchScore =
      requiredSkills.length === 0
        ? 0
        : Math.round(
            (matchedSkills.length / requiredSkills.length) * 100
          );

    // 2. LOCATION COMPATIBILITY
    const currentLocation = (resume.currentLocation || "").trim();
    const preferredLocation = (resume.preferredLocation || "").trim();
    const jobLocation = (job.location || "").trim();

    const willingToRelocate = resume.willingToRelocate === true;

    const hasCurrentLocation = Boolean(currentLocation);
    const hasJobLocation = Boolean(jobLocation);

    const isRemoteJob = normalize(jobLocation).includes("remote");

    const isPreferredLocationAny =
      !preferredLocation ||
      ["any city", "any location", "anywhere"].includes(
        normalize(preferredLocation)
      );

    const matchesCurrentLocation =
      hasCurrentLocation &&
      hasJobLocation &&
      normalize(currentLocation) === normalize(jobLocation);

    const matchesPreferredLocation =
      isPreferredLocationAny ||
      (hasJobLocation &&
        normalize(preferredLocation) === normalize(jobLocation));

    let locationStatus = "unknown";
    let locationWarning = null;
    let locationMessage = "";

    if (isRemoteJob) {
      locationStatus = "compatible";
      locationMessage = "This job is listed as remote.";
    } else if (
      hasJobLocation &&
      matchesCurrentLocation
    ) {
      locationStatus = "compatible";
      locationMessage = "The job matches your current location.";
    } else if (
      hasJobLocation &&
      !isPreferredLocationAny &&
      matchesPreferredLocation
    ) {
      locationStatus = "compatible";
      locationMessage = "The job matches your preferred location.";
    } else if (hasJobLocation && willingToRelocate) {
      locationStatus = "relocation_supported";
      locationWarning =
        `This job is in ${jobLocation}, which may differ from your ` +
        "current or preferred location. You indicated that you are " +
        "willing to relocate.";
      locationMessage =
        "Location mismatch will not count against your suitability.";
    } else if (hasJobLocation) {
      locationStatus = "mismatch";
      locationWarning =
        `This job is in ${jobLocation}. Check the location before applying.`;
      locationMessage =
        "Consider this location difference when deciding whether to apply.";
    } else {
      locationMessage =
        "The job location is not available, so compatibility could not be checked.";
    }

    // 3. LEARNING SUGGESTIONS
    const willingToLearn = resume.willingToLearn === true;

    const learningSuggestions = willingToLearn
      ? missingSkills
      : [];

    const learningMessage = willingToLearn
      ? missingSkills.length > 0
        ? "You can consider learning the missing skills to strengthen your application."
        : "Your resume contains all the listed required skills."
      : missingSkills.length > 0
        ? "You indicated that you are not currently willing to learn new skills. Review the missing skills before applying."
        : "Your resume contains all the listed required skills.";

    // 4. RECOMMENDATION
    // Skill percentage stays independent of location and learning preferences.
    let recommendation;

    if (requiredSkills.length === 0) {
      recommendation =
        "This job has no listed required skills. Review the job details before applying.";
    } else if (matchScore >= 80) {
      recommendation =
        "Strong skill match. Consider reviewing the job details and applying if interested.";
    } else if (matchScore >= 50) {
      recommendation =
        "Moderate skill match. Review the missing skills and your preferences.";
    } else {
      recommendation =
        "Some required skills are missing. Review the requirements and learning suggestions before applying.";
    }

    res.json({
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location || ""
      },

      resume: {
        id: resume._id,
        fileName: resume.originalFileName
      },

      skillAnalysis: {
        matchScore,
        matchedSkills,
        missingSkills,
        totalRequiredSkills: requiredSkills.length,
        matchedSkillCount: matchedSkills.length,
        explanation:
          `${matchedSkills.length} of ${requiredSkills.length} ` +
          "required skills were found in your resume."
      },

      locationCompatibility: {
        currentLocation,
        preferredLocation,
        jobLocation,
        willingToRelocate,
        status: locationStatus,
        warning: locationWarning,
        message: locationMessage,
        mismatchAffectsSuitability: locationStatus === "mismatch"
      },

      learningAnalysis: {
        willingToLearn,
        missingSkills,
        learningSuggestions,
        message: learningMessage
      },

      candidatePreferences: {
        preferredLocation: preferredLocation || "Not specified",
        willingToRelocate,
        willingToLearn
      },

      recommendation
    });
  } catch (error) {
    console.error("Resume matching error:", error.message);

    res.status(500).json({
      message: "Failed to calculate resume match"
    });
  }
});

module.exports = router;
